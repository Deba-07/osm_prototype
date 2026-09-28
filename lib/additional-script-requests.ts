import { getEvaluatorAssignmentWorkload } from "@/lib/assignments"
import type { AnswerSheet, AdditionalScriptRequest, Evaluator } from "@/types/osm"

export type AdditionalScriptRequestValidation = {
  success: boolean
  message?: string
}

export function validateAdditionalScriptRequest({
  input,
  evaluator,
  answerSheets,
  requests,
}: {
  input: { evaluatorId: string; requestedCount: number }
  evaluator: Evaluator | undefined
  answerSheets: AnswerSheet[]
  requests: AdditionalScriptRequest[]
}): AdditionalScriptRequestValidation {
  if (!evaluator || evaluator.id !== input.evaluatorId) {
    return { success: false, message: "Evaluator account was not found." }
  }

  if (evaluator.status !== "approved") {
    return { success: false, message: "Only approved evaluators can request additional scripts." }
  }

  if (!Number.isInteger(input.requestedCount) || input.requestedCount <= 0) {
    return { success: false, message: "Request a positive whole number of scripts." }
  }

  if (requests.some((request) => request.evaluatorId === evaluator.id && request.status === "pending")) {
    return { success: false, message: "A pending request already exists for this evaluator." }
  }

  const evaluatorSheets = answerSheets.filter(
    (answerSheet) => answerSheet.assignedEvaluatorId === evaluator.id
  )
  const workload = getEvaluatorAssignmentWorkload({ evaluator, answerSheets })
  if (evaluatorSheets.length === 0 || workload.completedSheets !== evaluatorSheets.length) {
    return {
      success: false,
      message: "Complete the current assigned workload before requesting more scripts.",
    }
  }

  return { success: true }
}
