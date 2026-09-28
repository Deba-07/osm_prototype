import type { Evaluation, Evaluator, EvaluatorRemuneration } from "@/types/osm"

export const DEFAULT_EVALUATOR_RATE_PER_SCRIPT = 50
export const DEFAULT_TA_DA_AMOUNT = 500

export function calculateEvaluatorRemuneration({
  evaluatorId,
  examId,
  completedScripts,
  ratePerScript = DEFAULT_EVALUATOR_RATE_PER_SCRIPT,
  taDaAmount = DEFAULT_TA_DA_AMOUNT,
  calculatedAt = new Date().toISOString(),
}: {
  evaluatorId: string
  examId?: string
  completedScripts: number
  ratePerScript?: number
  taDaAmount?: number
  calculatedAt?: string
}): EvaluatorRemuneration {
  const safeCompletedScripts = Math.max(0, Math.floor(completedScripts))
  const evaluationAmount = safeCompletedScripts * ratePerScript
  return {
    id: `remuneration-${evaluatorId}-${examId ?? "all"}`,
    evaluatorId,
    examId,
    completedScripts: safeCompletedScripts,
    ratePerScript,
    evaluationAmount,
    taDaAmount,
    totalAmount: evaluationAmount + taDaAmount,
    status: "calculated",
    calculatedAt,
  }
}

export function deriveEvaluatorRemuneration({
  evaluators,
  evaluations,
  includeZeroEvaluators = true,
}: {
  evaluators: Evaluator[]
  evaluations: Evaluation[]
  includeZeroEvaluators?: boolean
}) {
  const submitted = evaluations.filter((evaluation) => evaluation.status === "submitted")
  const groups = new Map<string, { evaluatorId: string; examId: string; latestSubmittedAt?: string }>()
  for (const evaluation of submitted) {
    const key = `${evaluation.evaluatorId}:${evaluation.examId}`
    const group = groups.get(key) ?? { evaluatorId: evaluation.evaluatorId, examId: evaluation.examId }
    if (!group.latestSubmittedAt || (evaluation.submittedAt ?? "") > group.latestSubmittedAt) group.latestSubmittedAt = evaluation.submittedAt
    groups.set(key, group)
  }

  const records = Array.from(groups.values()).map((group) => calculateEvaluatorRemuneration({
    evaluatorId: group.evaluatorId,
    examId: group.examId,
    completedScripts: submitted.filter((evaluation) => evaluation.evaluatorId === group.evaluatorId && evaluation.examId === group.examId).length,
    calculatedAt: group.latestSubmittedAt,
  }))
  if (!includeZeroEvaluators) return records
  for (const evaluator of evaluators) {
    if (!records.some((record) => record.evaluatorId === evaluator.id)) records.push(calculateEvaluatorRemuneration({ evaluatorId: evaluator.id, completedScripts: 0 }))
  }
  return records
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value)
}
