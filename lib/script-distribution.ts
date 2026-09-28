import { isEvaluatorEligibleForSubject } from "@/lib/assignments"
import type {
  AnswerSheet,
  Evaluator,
  Exam,
  ProcessedScript,
  ScriptDistributionSummary,
  ScriptMapping,
  Student,
  UploadBatch,
} from "@/types/osm"

export const DEFAULT_SCRIPTS_PER_EVALUATOR = 20

export type ScriptDistributionAssignment = {
  scriptId: string
  evaluatorId: string
  answerSheetId?: string
}

export type ScriptDistributionPlan = {
  assignments: ScriptDistributionAssignment[]
  summary: ScriptDistributionSummary
}

export type ScriptDistributionContext = {
  mapping: ScriptMapping
  script: ProcessedScript
  student: Student
  batch: UploadBatch
  exam: Exam
  answerSheet: AnswerSheet | undefined
}

export function getScriptContexts({
  scripts,
  mappings,
  students,
  batches,
  exams,
  answerSheets,
}: {
  scripts: ProcessedScript[]
  mappings: ScriptMapping[]
  students: Student[]
  batches: UploadBatch[]
  exams: Exam[]
  answerSheets: AnswerSheet[]
}) {
  return mappings
    .filter((mapping) => mapping.status === "valid")
    .map((mapping) => {
      const script = scripts.find((item) => item.id === mapping.scriptId)
      const student = mapping.studentId
        ? students.find((item) => item.id === mapping.studentId)
        : undefined
      const batch = script
        ? batches.find((item) => item.id === script.uploadBatchId)
        : undefined
      const exam = batch ? exams.find((item) => item.id === batch.examId) : undefined
      const answerSheet = answerSheets.find(
        (item) => item.processedScriptId === script?.id
      )

      if (!script || !student || !batch || !exam) return undefined
      if (student.rollNumber !== mapping.rollNumber) return undefined

      return { mapping, script, student, batch, exam, answerSheet }
    })
    .filter((context): context is ScriptDistributionContext => Boolean(context))
    .sort((first, second) => {
      return first.script.startPage - second.script.startPage ||
        first.script.id.localeCompare(second.script.id)
    })
}

function getEligibleEvaluatorsForContext(
  context: ScriptDistributionContext,
  evaluators: Evaluator[]
) {
  return evaluators.filter((evaluator) =>
    isEvaluatorEligibleForSubject(evaluator, context.exam.subjectId)
  )
}

function getStatus({
  eligibleScripts,
  distributed,
  eligibleEvaluators,
  totalCapacity,
}: {
  eligibleScripts: number
  distributed: number
  eligibleEvaluators: number
  totalCapacity: number
}): ScriptDistributionSummary["status"] {
  if (eligibleScripts === 0 || eligibleEvaluators === 0) {
    return "not_distributed"
  }

  if (distributed === eligibleScripts) {
    return "distributed"
  }

  return totalCapacity === 0 ? "capacity_reached" : "partially_distributed"
}

export function planAutomaticScriptDistribution({
  scripts,
  mappings,
  students,
  batches,
  exams,
  evaluators,
  answerSheets,
}: {
  scripts: ProcessedScript[]
  mappings: ScriptMapping[]
  students: Student[]
  batches: UploadBatch[]
  exams: Exam[]
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
}): ScriptDistributionPlan {
  const contexts = getScriptContexts({
    scripts,
    mappings,
    students,
    batches,
    exams,
    answerSheets,
  })
  const eligibleEvaluatorIds = new Set<string>()
  const activeCounts = new Map<string, number>()

  for (const evaluator of evaluators) {
    activeCounts.set(
      evaluator.id,
      answerSheets.filter(
        (sheet) =>
          sheet.assignedEvaluatorId === evaluator.id &&
          (sheet.status === "assigned" || sheet.status === "in_progress")
      ).length
    )
  }

  for (const context of contexts) {
    for (const evaluator of getEligibleEvaluatorsForContext(context, evaluators)) {
      eligibleEvaluatorIds.add(evaluator.id)
    }
  }

  const eligibleEvaluators = evaluators.filter((evaluator) =>
    eligibleEvaluatorIds.has(evaluator.id)
  )
  const totalCapacity = eligibleEvaluators.reduce(
    (sum, evaluator) =>
      sum + Math.max(DEFAULT_SCRIPTS_PER_EVALUATOR - (activeCounts.get(evaluator.id) ?? 0), 0),
    0
  )
  const assignments: ScriptDistributionAssignment[] = []
  const unassigned: ScriptDistributionSummary["unassigned"] = []
  const nextEvaluatorIndexBySubject = new Map<string, number>()
  let distributed = 0

  for (const context of contexts) {
    const existingSheet = context.answerSheet
    if (
      existingSheet?.assignedEvaluatorId &&
      existingSheet.status !== "unassigned"
    ) {
      distributed += 1
      continue
    }

    const eligible = getEligibleEvaluatorsForContext(context, evaluators).filter(
      (evaluator) =>
        (activeCounts.get(evaluator.id) ?? 0) < DEFAULT_SCRIPTS_PER_EVALUATOR
    )

    if (eligible.length === 0) {
      unassigned.push({
        scriptId: context.script.id,
        studentId: context.student.id,
        reason:
          getEligibleEvaluatorsForContext(context, evaluators).length === 0
            ? "No approved evaluator has matching subject expertise."
            : "All eligible evaluators have reached the active capacity of 20 scripts.",
      })
      continue
    }

    const subjectKey = context.exam.subjectId
    let startIndex = nextEvaluatorIndexBySubject.get(subjectKey)
    if (startIndex === undefined) {
      startIndex = eligible.reduce((bestIndex, evaluator, index) => {
        const bestCount = activeCounts.get(eligible[bestIndex].id) ?? 0
        const currentCount = activeCounts.get(evaluator.id) ?? 0
        return currentCount < bestCount ? index : bestIndex
      }, 0)
    }

    let selected = eligible[startIndex]
    let selectedIndex = startIndex
    for (let offset = 0; offset < eligible.length; offset += 1) {
      const candidateIndex = (startIndex + offset) % eligible.length
      const candidate = eligible[candidateIndex]
      if ((activeCounts.get(candidate.id) ?? 0) < DEFAULT_SCRIPTS_PER_EVALUATOR) {
        selected = candidate
        selectedIndex = candidateIndex
        break
      }
    }

    activeCounts.set(selected.id, (activeCounts.get(selected.id) ?? 0) + 1)
    nextEvaluatorIndexBySubject.set(subjectKey, (selectedIndex + 1) % eligible.length)
    assignments.push({
      scriptId: context.script.id,
      evaluatorId: selected.id,
      answerSheetId: existingSheet?.id,
    })
    distributed += 1
  }

  const summary: ScriptDistributionSummary = {
    eligibleScripts: contexts.length,
    eligibleEvaluators: eligibleEvaluators.length,
    defaultScriptsPerEvaluator: DEFAULT_SCRIPTS_PER_EVALUATOR,
    totalCapacity,
    distributed,
    remaining: unassigned.length,
    status: getStatus({
      eligibleScripts: contexts.length,
      distributed,
      eligibleEvaluators: eligibleEvaluators.length,
      totalCapacity,
    }),
    unassigned,
  }

  return { assignments, summary }
}

export function getAdditionalScriptCandidates({
  evaluator,
  requestedCount,
  scripts,
  mappings,
  students,
  batches,
  exams,
  answerSheets,
}: {
  evaluator: Evaluator
  requestedCount: number
  scripts: ProcessedScript[]
  mappings: ScriptMapping[]
  students: Student[]
  batches: UploadBatch[]
  exams: Exam[]
  answerSheets: AnswerSheet[]
}) {
  return getScriptContexts({
    scripts,
    mappings,
    students,
    batches,
    exams,
    answerSheets,
  })
    .filter((context) => {
      const isUnassigned =
        !context.answerSheet ||
        (context.answerSheet.status === "unassigned" &&
          !context.answerSheet.assignedEvaluatorId)
      return (
        isUnassigned &&
        isEvaluatorEligibleForSubject(evaluator, context.exam.subjectId)
      )
    })
    .slice(0, Math.max(requestedCount, 0))
}

export function getScriptDistributionSummary(args: Parameters<typeof planAutomaticScriptDistribution>[0]) {
  return planAutomaticScriptDistribution(args).summary
}
