import { getScriptOperationalStatus } from "@/lib/script-operational-status"
import type { AnswerSheet, Evaluation, EvaluationSession, Evaluator, Exam, OperationalAlert, PdfProcessingJob, ProcessedScript, ScriptException, ScriptMapping, UploadBatch } from "@/types/osm"

export const DEMO_ALERT_NOW = "2026-08-24T14:00:00.000Z"
export const DEADLINE_WARNING_HOURS = 72
export const EVALUATOR_INACTIVE_HOURS = 24
export const SCRIPT_STUCK_HOURS = 24
export const CENTRE_UPLOAD_DELAY_HOURS = 24

function hoursBetween(later: string, earlier: string) {
  return (Date.parse(later) - Date.parse(earlier)) / (60 * 60 * 1000)
}

function alertBase(type: OperationalAlert["type"], severity: OperationalAlert["severity"], title: string, message: string, createdAt: string, details: Record<string, string | number>, references: Partial<Pick<OperationalAlert, "examId" | "evaluatorId" | "scriptId" | "uploadBatchId" | "nodalCentreId" | "processingJobId">> = {}): OperationalAlert {
  return { id: `${type}-${references.scriptId ?? references.evaluatorId ?? references.uploadBatchId ?? references.examId ?? createdAt}`, type, severity, title, message, createdAt, status: "active", details, ...references }
}

function submittedSheetIds(evaluations: Evaluation[]) {
  return new Set(evaluations.filter((evaluation) => evaluation.status === "submitted").map((evaluation) => evaluation.answerSheetId))
}

export function getOperationalAlerts({ exams, evaluators, uploadBatches, processingJobs, processedScripts, mappings, answerSheets, evaluations, evaluationSessions, exceptions }: { exams: Exam[]; evaluators: Evaluator[]; uploadBatches: UploadBatch[]; processingJobs: PdfProcessingJob[]; processedScripts: ProcessedScript[]; mappings: ScriptMapping[]; answerSheets: AnswerSheet[]; evaluations: Evaluation[]; evaluationSessions: EvaluationSession[]; exceptions: ScriptException[] }): OperationalAlert[] {
  const alerts: OperationalAlert[] = []
  const now = DEMO_ALERT_NOW
  const submittedIds = submittedSheetIds(evaluations)
  const incompleteSheets = (examId?: string) => answerSheets.filter((sheet) => (!examId || sheet.examId === examId) && sheet.assignedEvaluatorId && sheet.status !== "completed" && !submittedIds.has(sheet.id))

  for (const exam of exams) {
    const incomplete = incompleteSheets(exam.id)
    if (incomplete.length === 0) continue
    const deadline = `${exam.examDate}T18:00:00.000Z`
    const remainingHours = hoursBetween(deadline, now)
    if (remainingHours <= DEADLINE_WARNING_HOURS) {
      const overdue = remainingHours < 0
      alerts.push(alertBase("evaluation_deadline", overdue ? "critical" : "warning", overdue ? "Evaluation deadline overdue" : "Evaluation deadline approaching", `${exam.name} ${overdue ? "deadline has passed" : "deadline is approaching"}. ${incomplete.length} scripts remain incomplete.`, now, { deadline, incompleteScripts: incomplete.length, remainingHours: Math.round(remainingHours) }, { examId: exam.id }))
    }
  }

  for (const evaluator of evaluators.filter((item) => item.status === "approved" && item.availability !== "unavailable")) {
    const remaining = answerSheets.filter((sheet) => sheet.assignedEvaluatorId === evaluator.id && sheet.status !== "completed" && !submittedIds.has(sheet.id))
    if (remaining.length === 0) continue
    const sessions = evaluationSessions.filter((session) => session.evaluatorId === evaluator.id)
    const activity = sessions.flatMap((session) => [session.lastSavedAt, session.resumedAt, session.startedAt].filter(Boolean) as string[]).sort().at(-1)
    if (!activity || hoursBetween(now, activity) >= EVALUATOR_INACTIVE_HOURS) {
      alerts.push(alertBase("evaluator_inactive", "warning", "Evaluator inactive", `${evaluator.name} has ${remaining.length} remaining scripts and no recent evaluation activity.`, activity ?? now, { remainingScripts: remaining.length, lastActivity: activity ?? "Not recorded" }, { evaluatorId: evaluator.id }))
    }
  }

  for (const script of processedScripts) {
    const status = getScriptOperationalStatus({ scriptId: script.id, scripts: processedScripts, mappings, answerSheets, evaluations, evaluationSessions, exceptions })
    if (status !== "assigned" && status !== "in_progress") continue
    const sheet = answerSheets.find((item) => (item.processedScriptId ?? item.id) === script.id)
    const session = evaluationSessions.filter((item) => item.scriptId === script.id).sort((a, b) => (b.lastSavedAt ?? b.startedAt).localeCompare(a.lastSavedAt ?? a.startedAt))[0]
    const lastActivity = session?.lastSavedAt ?? session?.startedAt ?? script.generatedAt
    if (hoursBetween(now, lastActivity) >= SCRIPT_STUCK_HOURS) {
      alerts.push(alertBase("script_stuck", "warning", "Script stuck", `${script.id} has remained ${status.replace("_", " ")} without recent activity.`, lastActivity, { operationalStatus: status, lastActivity }, { scriptId: script.id, evaluatorId: sheet?.assignedEvaluatorId, examId: sheet?.examId }))
    }
  }

  for (const batch of uploadBatches) {
    const job = processingJobs.find((item) => item.uploadBatchId === batch.id)
    if (batch.status !== "uploaded" && batch.status !== "ready_for_processing") continue
    if (job?.status === "completed") continue
    if (hoursBetween(now, batch.uploadedAt) >= CENTRE_UPLOAD_DELAY_HOURS) {
      alerts.push(alertBase("centre_upload_delayed", "warning", "Centre upload delayed", `Nodal centre upload for ${batch.batchNumber} has not completed.`, batch.uploadedAt, { uploadStatus: batch.status, uploadedAt: batch.uploadedAt }, { uploadBatchId: batch.id, nodalCentreId: batch.nodalCentreId, examId: batch.examId }))
    }
  }

  for (const session of evaluationSessions.filter((item) => item.status === "interrupted")) {
    const hasSubmitted = evaluations.some((evaluation) => evaluation.status === "submitted" && (answerSheets.find((sheet) => sheet.id === evaluation.answerSheetId)?.processedScriptId ?? evaluation.answerSheetId) === session.scriptId)
    if (hasSubmitted) continue
    alerts.push(alertBase("interrupted_evaluation", "warning", "Interrupted evaluation", `Evaluator ${session.evaluatorId} has an interrupted evaluation for ${session.scriptId}.`, session.interruptedAt ?? session.lastSavedAt ?? session.startedAt, { lastSaved: session.lastSavedAt ?? "Not recorded", interruptedAt: session.interruptedAt ?? "Not recorded", resumable: "Yes" }, { evaluatorId: session.evaluatorId, scriptId: session.scriptId }))
  }

  for (const job of processingJobs.filter((item) => item.status === "failed")) {
    const batch = uploadBatches.find((item) => item.id === job.uploadBatchId)
    alerts.push(alertBase("processing_failure", "critical", "Processing failure", `PDF processing failed for ${batch?.batchNumber ?? job.uploadBatchId}.`, job.completedAt ?? job.startedAt ?? now, { error: job.errorMessage ?? "Processing failed" }, { processingJobId: job.id, uploadBatchId: job.uploadBatchId, nodalCentreId: batch?.nodalCentreId, examId: batch?.examId }))
  }

  return alerts.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
}

export const operationalAlertTypeLabels: Record<OperationalAlert["type"], string> = { evaluation_deadline: "Evaluation deadline", evaluator_inactive: "Evaluator inactive", script_stuck: "Script stuck", centre_upload_delayed: "Centre upload delayed", interrupted_evaluation: "Interrupted evaluation", processing_failure: "Processing failure" }
export const operationalAlertSeverityLabels: Record<OperationalAlert["severity"], string> = { critical: "Critical", warning: "Warning", info: "Info" }
