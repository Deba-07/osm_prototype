import { answerSheets } from "@/data/answer-sheets"
import { examQuestions } from "@/data/questions"
import type { AnswerSheet, Evaluation, QuestionMark } from "@/types/osm"

type CompletedAssignedAnswerSheet = AnswerSheet & {
  status: "completed"
  assignedEvaluatorId: string
}

type InProgressAssignedAnswerSheet = AnswerSheet & {
  status: "in_progress"
  assignedEvaluatorId: string
}

function isCompletedAssignedAnswerSheet(
  answerSheet: AnswerSheet
): answerSheet is CompletedAssignedAnswerSheet {
  return answerSheet.status === "completed" && Boolean(answerSheet.assignedEvaluatorId)
}

function isInProgressAssignedAnswerSheet(
  answerSheet: AnswerSheet
): answerSheet is InProgressAssignedAnswerSheet {
  return answerSheet.status === "in_progress" && Boolean(answerSheet.assignedEvaluatorId)
}

function buildQuestionMarks(
  answerSheetIndex: number,
  subjectId: string,
  examId: string
): QuestionMark[] {
  return examQuestions
    .filter(
      (question) =>
        question.subjectId === subjectId && question.examId === examId
    )
    .map((question, questionIndex) => ({
      questionId: question.id,
      questionNumber: question.questionNumber,
      maximumMarks: question.maximumMarks,
      marksAwarded: Math.max(
        0,
        question.maximumMarks - ((answerSheetIndex + questionIndex) % 5)
      ),
    }))
}

function buildDraftQuestionMarks(
  answerSheetIndex: number,
  subjectId: string,
  examId: string
): QuestionMark[] {
  return examQuestions
    .filter(
      (question) =>
        question.subjectId === subjectId && question.examId === examId
    )
    .map((question, questionIndex) => ({
      questionId: question.id,
      questionNumber: question.questionNumber,
      maximumMarks: question.maximumMarks,
      marksAwarded:
        questionIndex < 3
          ? Math.max(
              0,
              question.maximumMarks - ((answerSheetIndex + questionIndex) % 6)
            )
          : null,
    }))
}

const completedEvaluations: Evaluation[] = answerSheets
  .filter(isCompletedAssignedAnswerSheet)
  .map((answerSheet, index) => {
    const questionMarks = buildQuestionMarks(
      index,
      answerSheet.subjectId,
      answerSheet.examId
    )

    return {
      id: `evaluation-${answerSheet.id}`,
      answerSheetId: answerSheet.id,
      evaluatorId: answerSheet.assignedEvaluatorId,
      studentId: answerSheet.studentId,
      subjectId: answerSheet.subjectId,
      semesterId: answerSheet.semesterId,
      examId: answerSheet.examId,
      questionMarks,
      totalMarks: questionMarks.reduce(
        (total, question) => total + (question.marksAwarded ?? 0),
        0
      ),
      status: "submitted",
      startedAt: `2026-08-${String(10 + index).padStart(2, "0")}T09:30:00.000Z`,
      submittedAt: `2026-08-${String(10 + index).padStart(2, "0")}T12:10:00.000Z`,
    }
  })

const draftEvaluations: Evaluation[] = answerSheets
  .filter(isInProgressAssignedAnswerSheet)
  .map((answerSheet, index) => {
    const questionMarks = buildDraftQuestionMarks(
      index,
      answerSheet.subjectId,
      answerSheet.examId
    )

    return {
      id: `evaluation-draft-${answerSheet.id}`,
      answerSheetId: answerSheet.id,
      evaluatorId: answerSheet.assignedEvaluatorId,
      studentId: answerSheet.studentId,
      subjectId: answerSheet.subjectId,
      semesterId: answerSheet.semesterId,
      examId: answerSheet.examId,
      questionMarks,
      totalMarks: questionMarks.reduce(
        (total, question) => total + (question.marksAwarded ?? 0),
        0
      ),
      status: "draft",
      startedAt: `2026-08-${String(20 + index).padStart(2, "0")}T09:45:00.000Z`,
    }
  })

export const initialEvaluations: Evaluation[] = [
  ...completedEvaluations,
  ...draftEvaluations,
]
