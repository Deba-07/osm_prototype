import { getEvaluatorAssignmentWorkload } from "@/lib/assignments"
import { getScriptOperationalStatus, type ScriptOperationalStatus } from "@/lib/script-operational-status"
import type {
  AnswerSheet,
  Evaluation,
  EvaluationSession,
  Evaluator,
  Exam,
  NodalCentre,
  PdfProcessingJob,
  ProcessedScript,
  ScriptException,
  ScriptMapping,
  UploadBatch,
} from "@/types/osm"

export type OperationsDeadlineAlert = {
  id: string
  label: string
  relatedTo: string
  deadline: string
  state: "upcoming" | "due_soon" | "overdue"
}

export type OperationsBottleneck = {
  category: string
  count: number
  explanation: string
}

export type OperationsEvaluatorWorkload = {
  evaluator: Evaluator
  assignedScripts: number
  inEvaluation: number
  completedScripts: number
  remainingAssigned: number
  activeOrResumableSession: boolean
}

export type OperationsCentreStatus = {
  centre: NodalCentre
  batchesReceived: number
  scriptsProcessed: number
  scriptsAssigned: number
  scriptsCompleted: number
  unresolvedExceptions: number
}

export type ExaminationOperationsMetrics = {
  scriptsReceived: number
  scriptsProcessed: number
  scriptsAssigned: number
  scriptsInEvaluation: number
  scriptsCompleted: number
  exceptionScripts: number
  funnel: Array<{ label: string; count: number }>
  evaluatorWorkloads: OperationsEvaluatorWorkload[]
  centreStatuses: OperationsCentreStatus[]
  bottlenecks: OperationsBottleneck[]
  deadlineAlerts: OperationsDeadlineAlert[]
  statusByScript: Record<string, ScriptOperationalStatus>
}

const demoToday = new Date("2026-09-28T00:00:00.000Z")

function uniqueScriptIds(answerSheets: AnswerSheet[]) {
  return new Set(answerSheets.map((sheet) => sheet.processedScriptId ?? sheet.id))
}

function getAlertState(deadline: string): OperationsDeadlineAlert["state"] {
  const days = Math.ceil(
    (new Date(deadline).getTime() - demoToday.getTime()) / (24 * 60 * 60 * 1000)
  )
  return days < 0 ? "overdue" : days <= 3 ? "due_soon" : "upcoming"
}

export function getExaminationOperationsMetrics({
  uploadBatches,
  processingJobs,
  processedScripts,
  mappings,
  answerSheets,
  evaluations,
  evaluationSessions,
  exceptions,
  evaluators,
  nodalCentres,
  exams,
}: {
  uploadBatches: UploadBatch[]
  processingJobs: PdfProcessingJob[]
  processedScripts: ProcessedScript[]
  mappings: ScriptMapping[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
  evaluationSessions: EvaluationSession[]
  exceptions: ScriptException[]
  evaluators: Evaluator[]
  nodalCentres: NodalCentre[]
  exams: Exam[]
}): ExaminationOperationsMetrics {
  const processedBatchIds = new Set(processedScripts.map((script) => script.uploadBatchId))
  const receivedScriptCount =
    processedScripts.length +
    uploadBatches.filter((batch) => !processedBatchIds.has(batch.id)).length
  const assignedScriptIds = uniqueScriptIds(
    answerSheets.filter((sheet) => Boolean(sheet.assignedEvaluatorId))
  )
  const completedScriptIds = uniqueScriptIds(
    answerSheets.filter((sheet) => sheet.status === "completed")
  )
  const completedByEvaluation = new Set(
    evaluations
      .filter((evaluation) => evaluation.status === "submitted")
      .map((evaluation) =>
        answerSheets.find((sheet) => sheet.id === evaluation.answerSheetId)?.processedScriptId ??
          evaluation.answerSheetId
      )
  )
  completedByEvaluation.forEach((scriptId) => completedScriptIds.add(scriptId))
  const inEvaluationScriptIds = new Set(
    evaluationSessions
      .filter(
        (session) => session.status === "active" || session.status === "interrupted"
      )
      .map((session) => session.scriptId)
  )
  const exceptionScriptIds = new Set(
    exceptions
      .filter((exception) => exception.status !== "resolved")
      .map((exception) => exception.scriptId)
  )

  const statusByScript = Object.fromEntries(
    processedScripts.map((script) => [
      script.id,
      getScriptOperationalStatus({
        scriptId: script.id,
        scripts: processedScripts,
        mappings,
        answerSheets,
        evaluations,
        evaluationSessions,
        exceptions,
      }),
    ])
  )

  const evaluatorWorkloads = evaluators
    .filter((evaluator) => evaluator.status === "approved")
    .map((evaluator) => {
      const workload = getEvaluatorAssignmentWorkload({ evaluator, answerSheets })
      const evaluatorScriptIds = uniqueScriptIds(
        answerSheets.filter((sheet) => sheet.assignedEvaluatorId === evaluator.id)
      )
      const inEvaluation = [...inEvaluationScriptIds].filter((scriptId) => {
        const sheet = answerSheets.find(
          (item) => (item.processedScriptId ?? item.id) === scriptId
        )
        return sheet?.assignedEvaluatorId === evaluator.id
      }).length
      return {
        evaluator,
        assignedScripts: evaluatorScriptIds.size,
        inEvaluation,
        completedScripts: uniqueScriptIds(
          answerSheets.filter(
            (sheet) =>
              sheet.assignedEvaluatorId === evaluator.id &&
              sheet.status === "completed"
          )
        ).size,
        remainingAssigned: workload.activeSheets,
        activeOrResumableSession: [...inEvaluationScriptIds].some((scriptId) =>
          [...evaluatorScriptIds].includes(scriptId)
        ),
      }
    })

  const centreStatuses = nodalCentres.map((centre) => {
    const centreBatches = uploadBatches.filter(
      (batch) => batch.nodalCentreId === centre.id
    )
    const centreBatchIds = new Set(centreBatches.map((batch) => batch.id))
    const centreScripts = processedScripts.filter((script) =>
      centreBatchIds.has(script.uploadBatchId)
    )
    const centreAnswerSheets = answerSheets.filter((sheet) => {
      const examId = exams.find((exam) => exam.id === sheet.examId)?.id
      return centreBatches.some((batch) => batch.examId === examId)
    })
    const centreScriptIds = new Set(centreScripts.map((script) => script.id))
    const centreExceptions = [...exceptionScriptIds].filter((scriptId) => {
      return centreScriptIds.has(scriptId)
    }).length
    return {
      centre,
      batchesReceived: centreBatches.length,
      scriptsProcessed: centreScripts.length,
      scriptsAssigned: centreAnswerSheets.filter((sheet) => Boolean(sheet.assignedEvaluatorId)).length,
      scriptsCompleted: centreAnswerSheets.filter((sheet) => sheet.status === "completed").length,
      unresolvedExceptions: centreExceptions,
    }
  })

  const validReadyScripts = mappings.filter(
    (mapping) => mapping.status === "valid" && !assignedScriptIds.has(mapping.scriptId)
  ).length
  const mappingReviewScripts = new Set(
    mappings
      .filter((mapping) => mapping.status === "review" || mapping.status === "invalid")
      .map((mapping) => mapping.scriptId)
  ).size
  const pendingProcessingIds = new Set([
    ...uploadBatches
      .filter((batch) => !processedBatchIds.has(batch.id))
      .map((batch) => batch.id),
    ...processingJobs
      .filter((job) => job.status !== "completed")
      .map((job) => job.uploadBatchId),
  ])
  const pendingProcessing = pendingProcessingIds.size
  const assignedNotCompleted = new Set(
    answerSheets
      .filter((sheet) => Boolean(sheet.assignedEvaluatorId) && sheet.status !== "completed")
      .map((sheet) => sheet.processedScriptId ?? sheet.id)
  ).size
  const centreBottlenecks = centreStatuses.filter(
    (item) => item.centre.status !== "active" && item.batchesReceived > 0
  ).length
  const bottlenecks: OperationsBottleneck[] = [
    ...(pendingProcessing > 0
      ? [{ category: "Processing", count: pendingProcessing, explanation: "Intake work is awaiting completion of PDF processing." }]
      : []),
    ...(mappingReviewScripts > 0
      ? [{ category: "Mapping", count: mappingReviewScripts, explanation: "Scripts require mapping review or correction." }]
      : []),
    ...(validReadyScripts > 0
      ? [{ category: "Assignment", count: validReadyScripts, explanation: "Valid mapped scripts have no evaluator assignment." }]
      : []),
    ...(assignedNotCompleted > 0
      ? [{ category: "Evaluation", count: assignedNotCompleted, explanation: "Assigned scripts are not yet submitted." }]
      : []),
    ...(exceptionScriptIds.size > 0
      ? [{ category: "Exceptions", count: exceptionScriptIds.size, explanation: "Scripts have open or under-review exceptions." }]
      : []),
    ...(centreBottlenecks > 0
      ? [{ category: "Nodal Centre", count: centreBottlenecks, explanation: "Operational work is linked to pending or inactive centres." }]
      : []),
  ]

  const deadlineAlerts = exams
    .filter((exam) => uploadBatches.some((batch) => batch.examId === exam.id))
    .map((exam) => ({
      id: `exam-deadline-${exam.id}`,
      label: "Exam date",
      relatedTo: exam.name,
      deadline: exam.examDate,
      state: getAlertState(exam.examDate),
    }))
    .slice(0, 6)

  return {
    scriptsReceived: receivedScriptCount,
    scriptsProcessed: processedScripts.length,
    scriptsAssigned: assignedScriptIds.size,
    scriptsInEvaluation: inEvaluationScriptIds.size,
    scriptsCompleted: completedScriptIds.size,
    exceptionScripts: exceptionScriptIds.size,
    funnel: [
      { label: "Received", count: receivedScriptCount },
      { label: "Processed", count: processedScripts.length },
      { label: "Assigned", count: assignedScriptIds.size },
      { label: "In Evaluation", count: inEvaluationScriptIds.size },
      { label: "Completed", count: completedScriptIds.size },
    ],
    evaluatorWorkloads,
    centreStatuses,
    bottlenecks,
    deadlineAlerts,
    statusByScript,
  }
}
