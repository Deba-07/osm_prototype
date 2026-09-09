import type { ExamQuestion } from "@/types/osm"

const questionSets = [
  { examId: "exam-2026-sem2-regular", subjectId: "sub-ece-circuits" },
  { examId: "exam-2026-sem2-regular", subjectId: "sub-me-materials" },
  { examId: "exam-2026-sem3-midterm", subjectId: "sub-cse-dsa" },
  { examId: "exam-2026-sem3-midterm", subjectId: "sub-ece-signals" },
  { examId: "exam-2026-sem3-midterm", subjectId: "sub-me-thermo" },
  { examId: "exam-2026-sem4-regular", subjectId: "sub-cse-dbms" },
  { examId: "exam-2026-sem4-regular", subjectId: "sub-cse-os" },
  { examId: "exam-2026-sem4-regular", subjectId: "sub-ece-digital" },
  { examId: "exam-2026-sem4-regular", subjectId: "sub-me-fluids" },
] as const

export const examQuestions: ExamQuestion[] = questionSets.flatMap(
  ({ examId, subjectId }) =>
    [1, 2, 3, 4, 5].map((questionNumber) => ({
      id: `question-${examId}-${subjectId}-${questionNumber}`,
      subjectId,
      examId,
      questionNumber: String(questionNumber),
      maximumMarks: 20,
    }))
)
