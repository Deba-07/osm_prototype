import type { AdminAdjustment, Evaluation } from "@/types/osm"

export function calculateFinalMarks(
  evaluatorMarks: number,
  adjustmentMarks: number
) {
  return Number((evaluatorMarks + adjustmentMarks).toFixed(2))
}

export function getEffectiveEvaluationMarks(
  evaluation: Evaluation,
  adjustments: AdminAdjustment[] = []
) {
  return adjustments.find((item) => item.evaluationId === evaluation.id)?.finalMarks ?? evaluation.totalMarks
}

export function validateAdjustmentInput({
  evaluation,
  adjustmentMarks,
  reason,
  maximumMarks,
}: {
  evaluation: Evaluation | undefined
  adjustmentMarks: number
  reason: string
  maximumMarks: number
}) {
  if (!evaluation || evaluation.status !== "submitted") {
    return "Only submitted evaluations can be adjusted."
  }
  if (!Number.isFinite(adjustmentMarks)) {
    return "Adjustment marks must be a finite number."
  }
  if (!reason.trim()) {
    return "A reason is required for every adjustment."
  }
  const finalMarks = calculateFinalMarks(evaluation.totalMarks, adjustmentMarks)
  if (finalMarks < 0) {
    return "Final marks cannot be negative."
  }
  if (finalMarks > maximumMarks) {
    return `Final marks cannot exceed the maximum of ${maximumMarks}.`
  }
  return undefined
}
