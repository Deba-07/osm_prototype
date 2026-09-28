import { isEvaluatorEligibleForSubject, MAX_ACTIVE_SHEETS_PER_EVALUATOR } from "@/lib/assignments"
import type { ScriptDistributionAssignment } from "@/lib/script-distribution"
import type { AnswerSheet, Evaluation, Evaluator } from "@/types/osm"

export function getRemainingEvaluatorSheets({ evaluatorId, answerSheets, evaluations }: { evaluatorId: string; answerSheets: AnswerSheet[]; evaluations: Evaluation[] }) {
  const submittedSheetIds = new Set(evaluations.filter((evaluation) => evaluation.status === "submitted").map((evaluation) => evaluation.answerSheetId))
  return answerSheets.filter((sheet) => sheet.assignedEvaluatorId === evaluatorId && sheet.status !== "completed" && !submittedSheetIds.has(sheet.id))
}

export function getCompletedEvaluatorSheets({ evaluatorId, answerSheets, evaluations }: { evaluatorId: string; answerSheets: AnswerSheet[]; evaluations: Evaluation[] }) {
  const submittedSheetIds = new Set(evaluations.filter((evaluation) => evaluation.status === "submitted").map((evaluation) => evaluation.answerSheetId))
  return answerSheets.filter((sheet) => sheet.assignedEvaluatorId === evaluatorId && (sheet.status === "completed" || submittedSheetIds.has(sheet.id)))
}

export function planEvaluatorRedistribution({ unavailableEvaluatorId, remainingSheets, answerSheets, evaluators }: { unavailableEvaluatorId: string; remainingSheets: AnswerSheet[]; answerSheets: AnswerSheet[]; evaluators: Evaluator[] }) {
  const activeCounts = new Map(evaluators.map((evaluator) => [evaluator.id, answerSheets.filter((sheet) => sheet.assignedEvaluatorId === evaluator.id && (sheet.status === "assigned" || sheet.status === "in_progress")).length]))
  const assignments: ScriptDistributionAssignment[] = []
  const eligible = evaluators.filter((evaluator) => evaluator.id !== unavailableEvaluatorId && evaluator.status === "approved" && evaluator.availability !== "unavailable")
  for (const sheet of remainingSheets) {
    const destinations = eligible.filter((evaluator) => isEvaluatorEligibleForSubject(evaluator, sheet.subjectId) && (activeCounts.get(evaluator.id) ?? 0) < MAX_ACTIVE_SHEETS_PER_EVALUATOR).sort((first, second) => (activeCounts.get(first.id) ?? 0) - (activeCounts.get(second.id) ?? 0))
    const destination = destinations[0]
    if (!destination) continue
    activeCounts.set(destination.id, (activeCounts.get(destination.id) ?? 0) + 1)
    assignments.push({ scriptId: sheet.processedScriptId ?? sheet.id, answerSheetId: sheet.id, evaluatorId: destination.id })
  }
  return { assignments, remainingSheetIds: remainingSheets.filter((sheet) => !assignments.some((assignment) => assignment.answerSheetId === sheet.id)).map((sheet) => sheet.id) }
}
