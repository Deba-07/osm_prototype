import { students } from "@/data/students"
import type { AnswerSheet, AnswerSheetStatus } from "@/types/osm"

type SheetPlan = {
  status: AnswerSheetStatus
  assignedEvaluatorId?: string
}

const cseStudents = students.filter(
  (student) => student.programId === "prog-btech-cse"
)
const eceStudents = students.filter(
  (student) => student.programId === "prog-btech-ece"
)
const meStudents = students.filter(
  (student) => student.programId === "prog-btech-me"
)

const cseSemester4Students = cseStudents.filter(
  (student) => student.currentSemesterId === "sem-4"
)
const eceSemester4Students = eceStudents.filter(
  (student) => student.currentSemesterId === "sem-4"
)
const meSemester4Students = meStudents.filter(
  (student) => student.currentSemesterId === "sem-4"
)

function pageImages(answerSheetId: string) {
  return [
    `/demo/answer-sheets/${answerSheetId}/page-1.jpg`,
    `/demo/answer-sheets/${answerSheetId}/page-2.jpg`,
  ]
}

function buildPlans(
  completed: number,
  inProgress: number,
  assigned: number,
  completedEvaluatorId: string,
  activeEvaluatorId = completedEvaluatorId
) {
  return [
    ...Array.from({ length: completed }, () => ({
      status: "completed" as const,
      assignedEvaluatorId: completedEvaluatorId,
    })),
    ...Array.from({ length: inProgress }, () => ({
      status: "in_progress" as const,
      assignedEvaluatorId: activeEvaluatorId,
    })),
    ...Array.from({ length: assigned }, () => ({
      status: "assigned" as const,
      assignedEvaluatorId: activeEvaluatorId,
    })),
  ]
}

function buildAnswerSheets({
  series,
  studentIds,
  subjectId,
  examId,
  semesterId,
  plans,
}: {
  series: string
  studentIds: string[]
  subjectId: string
  examId: string
  semesterId: string
  plans: SheetPlan[]
}) {
  return studentIds.map((studentId, index) => {
    const id = `as-${series}-${String(index + 1).padStart(3, "0")}`
    const plan = plans[index] ?? { status: "unassigned" as const }

    return {
      id,
      studentId,
      subjectId,
      examId,
      semesterId,
      pageImages: pageImages(id),
      assignedEvaluatorId: plan.assignedEvaluatorId,
      status: plan.status,
    }
  })
}

export const answerSheets: AnswerSheet[] = [
  ...buildAnswerSheets({
    series: "cse-dsa",
    studentIds: cseStudents.map((student) => student.id),
    subjectId: "sub-cse-dsa",
    examId: "exam-2026-sem3-midterm",
    semesterId: "sem-3",
    plans: buildPlans(3, 3, 3, "eval-cse-ananya-sen"),
  }),
  ...buildAnswerSheets({
    series: "ece-signals",
    studentIds: eceStudents.map((student) => student.id),
    subjectId: "sub-ece-signals",
    examId: "exam-2026-sem3-midterm",
    semesterId: "sem-3",
    plans: buildPlans(4, 2, 3, "eval-ece-meera-iyer"),
  }),
  ...buildAnswerSheets({
    series: "me-thermo",
    studentIds: meStudents.map((student) => student.id),
    subjectId: "sub-me-thermo",
    examId: "exam-2026-sem3-midterm",
    semesterId: "sem-3",
    plans: [],
  }),
  ...buildAnswerSheets({
    series: "cse-dbms",
    studentIds: cseSemester4Students.map((student) => student.id),
    subjectId: "sub-cse-dbms",
    examId: "exam-2026-sem4-regular",
    semesterId: "sem-4",
    plans: buildPlans(2, 1, 2, "eval-cse-ananya-sen", "eval-cse-rohit-nair"),
  }),
  ...buildAnswerSheets({
    series: "ece-digital",
    studentIds: eceSemester4Students.map((student) => student.id),
    subjectId: "sub-ece-digital",
    examId: "exam-2026-sem4-regular",
    semesterId: "sem-4",
    plans: buildPlans(2, 1, 2, "eval-ece-meera-iyer"),
  }),
  ...buildAnswerSheets({
    series: "me-fluids",
    studentIds: meSemester4Students.map((student) => student.id),
    subjectId: "sub-me-fluids",
    examId: "exam-2026-sem4-regular",
    semesterId: "sem-4",
    plans: [],
  }),
]
