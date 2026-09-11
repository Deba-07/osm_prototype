import type {
  AnswerSheet,
  AnswerSheetStatus,
  Evaluation,
  EvaluationDraftInput,
  Evaluator,
  ExamQuestion,
  QuestionMark,
} from "@/types/osm"

type AssignedAnswerSheet = AnswerSheet & {
  assignedEvaluatorId: string
}

export type EvaluationCompletion = {
  evaluatedQuestions: number
  totalQuestions: number
  percentage: number
  isComplete: boolean
}

export type EvaluationValidationResult =
  | {
      success: true
      questionMarks: QuestionMark[]
      totalMarks: number
    }
  | {
      success: false
      message: string
      fieldErrors: Record<string, string>
    }

export type EvaluationMutationValidationResult =
  | {
      success: true
      answerSheet: AssignedAnswerSheet
      evaluator: Evaluator
      questions: ExamQuestion[]
      questionMarks: QuestionMark[]
      totalMarks: number
    }
  | {
      success: false
      message: string
      fieldErrors: Record<string, string>
    }

const questionNumberCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
})

const mutableEvaluationStatuses: AnswerSheetStatus[] = [
  "assigned",
  "in_progress",
]

function safePercentage(part: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

function isAssignedAnswerSheet(
  answerSheet: AnswerSheet | undefined
): answerSheet is AssignedAnswerSheet {
  return Boolean(answerSheet?.assignedEvaluatorId)
}

function isValidMarkValue(value: number | null): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value))
}

function normalizeNumber(value: number) {
  return Number(value.toFixed(2))
}

export function getEvaluationQuestions({
  answerSheet,
  questions,
}: {
  answerSheet: AnswerSheet
  questions: ExamQuestion[]
}) {
  return questions
    .filter(
      (question) =>
        question.subjectId === answerSheet.subjectId &&
        question.examId === answerSheet.examId
    )
    .sort((first, second) =>
      questionNumberCollator.compare(
        first.questionNumber,
        second.questionNumber
      )
    )
}

export function getEvaluationForAnswerSheet({
  evaluations,
  answerSheetId,
  evaluatorId,
}: {
  evaluations: Evaluation[]
  answerSheetId: string
  evaluatorId: string
}) {
  return evaluations.find(
    (evaluation) =>
      evaluation.answerSheetId === answerSheetId &&
      evaluation.evaluatorId === evaluatorId
  )
}

export function getSubmittedEvaluationForAnswerSheet({
  evaluations,
  answerSheetId,
  evaluatorId,
}: {
  evaluations: Evaluation[]
  answerSheetId: string
  evaluatorId: string
}) {
  return evaluations.find(
    (evaluation) =>
      evaluation.answerSheetId === answerSheetId &&
      evaluation.evaluatorId === evaluatorId &&
      evaluation.status === "submitted"
  )
}

export function canEvaluatorAccessSheet({
  answerSheet,
  evaluator,
}: {
  answerSheet: AnswerSheet | undefined
  evaluator: Evaluator | undefined
}) {
  return Boolean(
    answerSheet &&
      evaluator?.status === "approved" &&
      answerSheet.assignedEvaluatorId === evaluator.id &&
      answerSheet.status !== "unassigned"
  )
}

export function calculateEvaluationMaximumMarks(questions: ExamQuestion[]) {
  return questions.reduce(
    (total, question) => total + question.maximumMarks,
    0
  )
}

export function calculateEvaluationTotal(questionMarks: QuestionMark[]) {
  return normalizeNumber(
    questionMarks.reduce(
      (total, questionMark) => total + (questionMark.marksAwarded ?? 0),
      0
    )
  )
}

export function getEvaluationCompletion(
  questionMarks: QuestionMark[]
): EvaluationCompletion {
  const evaluatedQuestions = questionMarks.filter(
    (questionMark) =>
      typeof questionMark.marksAwarded === "number" &&
      Number.isFinite(questionMark.marksAwarded) &&
      questionMark.marksAwarded >= 0 &&
      questionMark.marksAwarded <= questionMark.maximumMarks
  ).length
  const totalQuestions = questionMarks.length

  return {
    evaluatedQuestions,
    totalQuestions,
    percentage: safePercentage(evaluatedQuestions, totalQuestions),
    isComplete:
      totalQuestions > 0 && evaluatedQuestions === totalQuestions,
  }
}

export function getQuestionMarksForEvaluation({
  questions,
  evaluation,
}: {
  questions: ExamQuestion[]
  evaluation: Evaluation | undefined
}): QuestionMark[] {
  const savedMarks = new Map(
    evaluation?.questionMarks.map((questionMark) => [
      questionMark.questionId,
      questionMark.marksAwarded,
    ]) ?? []
  )

  return questions.map((question) => ({
    questionId: question.id,
    questionNumber: question.questionNumber,
    maximumMarks: question.maximumMarks,
    marksAwarded: savedMarks.get(question.id) ?? null,
  }))
}

export function validateQuestionMarks({
  questions,
  questionMarks,
  requireComplete = false,
}: {
  questions: ExamQuestion[]
  questionMarks: QuestionMark[]
  requireComplete?: boolean
}): EvaluationValidationResult {
  const fieldErrors: Record<string, string> = {}

  if (questions.length === 0) {
    return {
      success: false,
      message:
        "No evaluation questions are configured for this subject and examination.",
      fieldErrors: {
        questions:
          "No evaluation questions are configured for this subject and examination.",
      },
    }
  }

  const questionById = new Map(
    questions.map((question) => [question.id, question])
  )
  const questionMarkById = new Map<string, QuestionMark>()
  const seenQuestionIds = new Set<string>()

  for (const questionMark of questionMarks) {
    const question = questionById.get(questionMark.questionId)

    if (!question) {
      fieldErrors[questionMark.questionId] =
        "This mark does not belong to the selected answer sheet."
      continue
    }

    if (seenQuestionIds.has(question.id)) {
      fieldErrors[question.id] =
        `Question ${question.questionNumber} has duplicate marks.`
      continue
    }

    seenQuestionIds.add(question.id)
    questionMarkById.set(question.id, questionMark)

    if (!isValidMarkValue(questionMark.marksAwarded)) {
      fieldErrors[question.id] =
        `Enter a valid number for Question ${question.questionNumber}.`
      continue
    }

    if (questionMark.marksAwarded === null) {
      if (requireComplete) {
        fieldErrors[question.id] =
          `Enter marks for Question ${question.questionNumber}.`
      }
      continue
    }

    if (questionMark.marksAwarded < 0) {
      fieldErrors[question.id] =
        `Marks cannot be negative for Question ${question.questionNumber}.`
      continue
    }

    if (questionMark.marksAwarded > question.maximumMarks) {
      fieldErrors[question.id] =
        `Marks cannot exceed ${question.maximumMarks}.`
    }
  }

  const normalizedQuestionMarks = questions.map((question) => {
    const questionMark = questionMarkById.get(question.id)

    return {
      questionId: question.id,
      questionNumber: question.questionNumber,
      maximumMarks: question.maximumMarks,
      marksAwarded: questionMark?.marksAwarded ?? null,
    }
  })

  if (requireComplete) {
    for (const question of questions) {
      if (!questionMarkById.has(question.id)) {
        fieldErrors[question.id] =
          `Enter marks for Question ${question.questionNumber}.`
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      message: requireComplete
        ? "Complete every question with valid marks before submission."
        : "Review the highlighted marks before saving the draft.",
      fieldErrors,
    }
  }

  return {
    success: true,
    questionMarks: normalizedQuestionMarks,
    totalMarks: calculateEvaluationTotal(normalizedQuestionMarks),
  }
}

function validateEvaluationMutation({
  input,
  answerSheets,
  evaluators,
  questions,
  requireComplete,
}: {
  input: EvaluationDraftInput
  answerSheets: AnswerSheet[]
  evaluators: Evaluator[]
  questions: ExamQuestion[]
  requireComplete: boolean
}): EvaluationMutationValidationResult {
  const answerSheet = answerSheets.find(
    (item) => item.id === input.answerSheetId
  )
  const evaluator = evaluators.find(
    (item) => item.id === input.evaluatorId && item.status === "approved"
  )

  if (!answerSheet) {
    return {
      success: false,
      message: "Answer sheet not found.",
      fieldErrors: {
        answerSheetId: "Answer sheet not found.",
      },
    }
  }

  if (!evaluator) {
    return {
      success: false,
      message: "Select an approved evaluator.",
      fieldErrors: {
        evaluatorId: "Select an approved evaluator.",
      },
    }
  }

  if (!isAssignedAnswerSheet(answerSheet)) {
    return {
      success: false,
      message: "This answer sheet is not assigned to an evaluator.",
      fieldErrors: {
        answerSheetId: "This answer sheet is not assigned to an evaluator.",
      },
    }
  }

  if (answerSheet.assignedEvaluatorId !== evaluator.id) {
    return {
      success: false,
      message:
        "Only the evaluator assigned to this answer sheet may evaluate it.",
      fieldErrors: {
        evaluatorId:
          "Only the evaluator assigned to this answer sheet may evaluate it.",
      },
    }
  }

  if (!mutableEvaluationStatuses.includes(answerSheet.status)) {
    return {
      success: false,
      message:
        answerSheet.status === "completed"
          ? "Completed evaluations are read-only."
          : "This answer sheet is not available for evaluation.",
      fieldErrors: {
        answerSheetId:
          answerSheet.status === "completed"
            ? "Completed evaluations are read-only."
            : "This answer sheet is not available for evaluation.",
      },
    }
  }

  const evaluationQuestions = getEvaluationQuestions({
    answerSheet,
    questions,
  })
  const validation = validateQuestionMarks({
    questions: evaluationQuestions,
    questionMarks: input.questionMarks,
    requireComplete,
  })

  if (!validation.success) {
    return validation
  }

  return {
    success: true,
    answerSheet,
    evaluator,
    questions: evaluationQuestions,
    questionMarks: validation.questionMarks,
    totalMarks: validation.totalMarks,
  }
}

export function validateEvaluationDraftInput({
  input,
  answerSheets,
  evaluators,
  questions,
}: {
  input: EvaluationDraftInput
  answerSheets: AnswerSheet[]
  evaluators: Evaluator[]
  questions: ExamQuestion[]
}) {
  return validateEvaluationMutation({
    input,
    answerSheets,
    evaluators,
    questions,
    requireComplete: false,
  })
}

export function validateEvaluationSubmissionInput({
  input,
  answerSheets,
  evaluators,
  questions,
}: {
  input: EvaluationDraftInput
  answerSheets: AnswerSheet[]
  evaluators: Evaluator[]
  questions: ExamQuestion[]
}) {
  return validateEvaluationMutation({
    input,
    answerSheets,
    evaluators,
    questions,
    requireComplete: true,
  })
}
