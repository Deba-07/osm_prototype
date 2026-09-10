import { resolveAnswerSheets, type ResolvedAnswerSheet } from "@/lib/answer-sheets"
import type {
  AnswerSheet,
  AnswerSheetStatus,
  Department,
  Evaluator,
  Exam,
  Program,
  Semester,
  Student,
  Subject,
} from "@/types/osm"

export const MAX_ACTIVE_SHEETS_PER_EVALUATOR = 20

export type AnswerSheetAssignmentInput = {
  departmentId: string
  semesterId: string
  subjectId: string
  examId: string
  evaluatorId: string
  answerSheetIds: string[]
}

export type AssignmentValidationField =
  | "departmentId"
  | "semesterId"
  | "subjectId"
  | "examId"
  | "evaluatorId"
  | "answerSheetIds"

export type AnswerSheetAssignmentResult =
  | {
      success: true
      assignedCount: number
      evaluatorId: string
      answerSheetIds: string[]
    }
  | {
      success: false
      message: string
      fieldErrors?: Partial<Record<AssignmentValidationField, string>>
    }

export type AssignmentSummary = {
  unassignedSheets: number
  activeAssignments: number
  inProgress: number
  approvedEvaluators: number
  completedSheets: number
}

export type EvaluatorAssignmentWorkload = {
  evaluator: Evaluator
  activeSheets: number
  assignedSheets: number
  inProgressSheets: number
  completedSheets: number
  availableCapacity: number
  capacityUsedPercent: number
}

type RelationshipData = {
  students: Student[]
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  evaluators: Evaluator[]
}

type AssignmentValidationData = RelationshipData & {
  input: AnswerSheetAssignmentInput
  answerSheets: AnswerSheet[]
}

type EligibleSheetInput = RelationshipData & {
  answerSheets: AnswerSheet[]
  departmentId: string
  semesterId: string
  subjectId: string
  examId: string
}

const activeAssignmentStatuses: AnswerSheetStatus[] = [
  "assigned",
  "in_progress",
]

function findById<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id)
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids))
}

function safePercentage(part: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

export function getApprovedEvaluators(evaluators: Evaluator[]) {
  return evaluators.filter((evaluator) => evaluator.status === "approved")
}

export function isEvaluatorEligibleForSubject(
  evaluator: Evaluator | undefined,
  subjectId: string
) {
  return Boolean(
    evaluator?.status === "approved" &&
      subjectId.length > 0 &&
      evaluator.subjectExpertise.includes(subjectId)
  )
}

export function getEvaluatorAssignmentWorkload({
  evaluator,
  answerSheets,
}: {
  evaluator: Evaluator
  answerSheets: AnswerSheet[]
}): EvaluatorAssignmentWorkload {
  const evaluatorSheets = answerSheets.filter(
    (answerSheet) => answerSheet.assignedEvaluatorId === evaluator.id
  )
  const assignedSheets = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "assigned"
  ).length
  const inProgressSheets = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "in_progress"
  ).length
  const completedSheets = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "completed"
  ).length
  const activeSheets = assignedSheets + inProgressSheets
  const availableCapacity = Math.max(
    MAX_ACTIVE_SHEETS_PER_EVALUATOR - activeSheets,
    0
  )

  return {
    evaluator,
    activeSheets,
    assignedSheets,
    inProgressSheets,
    completedSheets,
    availableCapacity,
    capacityUsedPercent: safePercentage(
      activeSheets,
      MAX_ACTIVE_SHEETS_PER_EVALUATOR
    ),
  }
}

export function getEvaluatorAssignmentWorkloads({
  evaluators,
  answerSheets,
}: {
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
}) {
  return getApprovedEvaluators(evaluators).map((evaluator) =>
    getEvaluatorAssignmentWorkload({ evaluator, answerSheets })
  )
}

export function getAssignmentSummary({
  answerSheets,
  evaluators,
}: {
  answerSheets: AnswerSheet[]
  evaluators: Evaluator[]
}): AssignmentSummary {
  return {
    unassignedSheets: answerSheets.filter(
      (answerSheet) => answerSheet.status === "unassigned"
    ).length,
    activeAssignments: answerSheets.filter((answerSheet) =>
      activeAssignmentStatuses.includes(answerSheet.status)
    ).length,
    inProgress: answerSheets.filter(
      (answerSheet) => answerSheet.status === "in_progress"
    ).length,
    approvedEvaluators: getApprovedEvaluators(evaluators).length,
    completedSheets: answerSheets.filter(
      (answerSheet) => answerSheet.status === "completed"
    ).length,
  }
}

export function getEligibleUnassignedSheets({
  answerSheets,
  students,
  departments,
  programs,
  semesters,
  subjects,
  exams,
  evaluators,
  departmentId,
  semesterId,
  subjectId,
  examId,
}: EligibleSheetInput): ResolvedAnswerSheet[] {
  if (
    departmentId.length === 0 ||
    semesterId.length === 0 ||
    subjectId.length === 0 ||
    examId.length === 0
  ) {
    return []
  }

  const subject = findById(subjects, subjectId)
  const exam = findById(exams, examId)

  if (
    !subject ||
    !exam ||
    subject.departmentId !== departmentId ||
    subject.semesterId !== semesterId ||
    exam.semesterId !== semesterId
  ) {
    return []
  }

  return resolveAnswerSheets(
    answerSheets.filter((answerSheet) => {
      return (
        answerSheet.status === "unassigned" &&
        answerSheet.subjectId === subjectId &&
        answerSheet.semesterId === semesterId &&
        answerSheet.examId === examId
      )
    }),
    {
      students,
      departments,
      programs,
      semesters,
      subjects,
      exams,
      evaluators,
    }
  )
}

export function validateAssignment({
  input,
  answerSheets,
  departments,
  semesters,
  subjects,
  exams,
  evaluators,
}: AssignmentValidationData): AnswerSheetAssignmentResult {
  const fieldErrors: Partial<Record<AssignmentValidationField, string>> = {}
  const department = findById(departments, input.departmentId)
  const semester = findById(semesters, input.semesterId)
  const subject = findById(subjects, input.subjectId)
  const exam = findById(exams, input.examId)
  const evaluator = findById(evaluators, input.evaluatorId)
  const selectedSheetIds = uniqueIds(input.answerSheetIds)

  if (!department) {
    fieldErrors.departmentId = "Select a valid department."
  }

  if (!semester) {
    fieldErrors.semesterId = "Select a valid semester."
  }

  if (!subject) {
    fieldErrors.subjectId = "Select a valid subject."
  }

  if (!exam) {
    fieldErrors.examId = "Select a valid exam."
  }

  if (!evaluator) {
    fieldErrors.evaluatorId = "Select a valid evaluator."
  } else if (evaluator.status !== "approved") {
    fieldErrors.evaluatorId = "Only approved evaluators can receive sheets."
  }

  if (input.answerSheetIds.length === 0) {
    fieldErrors.answerSheetIds = "Select at least one answer sheet."
  } else if (selectedSheetIds.length !== input.answerSheetIds.length) {
    fieldErrors.answerSheetIds = "Select each answer sheet only once."
  }

  if (department && subject && subject.departmentId !== department.id) {
    fieldErrors.subjectId = "Select a subject from the chosen department."
  }

  if (semester && subject && subject.semesterId !== semester.id) {
    fieldErrors.subjectId = "Select a subject from the chosen semester."
  }

  if (semester && exam && exam.semesterId !== semester.id) {
    fieldErrors.examId = "Select an exam from the chosen semester."
  }

  if (subject && exam && subject.semesterId !== exam.semesterId) {
    fieldErrors.examId = "Select an exam for the selected subject semester."
  }

  if (
    evaluator &&
    evaluator.status === "approved" &&
    subject &&
    !isEvaluatorEligibleForSubject(evaluator, subject.id)
  ) {
    fieldErrors.evaluatorId =
      "Select an approved evaluator with matching subject expertise."
  }

  for (const answerSheetId of selectedSheetIds) {
    const answerSheet = findById(answerSheets, answerSheetId)

    if (!answerSheet) {
      fieldErrors.answerSheetIds = "Every selected answer sheet must exist."
      break
    }

    if (answerSheet.status !== "unassigned") {
      fieldErrors.answerSheetIds =
        "Only currently unassigned answer sheets can be assigned."
      break
    }

    if (
      answerSheet.subjectId !== input.subjectId ||
      answerSheet.semesterId !== input.semesterId ||
      answerSheet.examId !== input.examId
    ) {
      fieldErrors.answerSheetIds =
        "Selected sheets must match the chosen subject, semester, and exam."
      break
    }

    const answerSheetSubject = findById(subjects, answerSheet.subjectId)

    if (answerSheetSubject?.departmentId !== input.departmentId) {
      fieldErrors.answerSheetIds =
        "Selected sheets must match the chosen department."
      break
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
      message: "Review the assignment selections before continuing.",
    }
  }

  if (!evaluator) {
    return {
      success: false,
      fieldErrors: {
        evaluatorId: "Select a valid evaluator.",
      },
      message: "Select a valid evaluator.",
    }
  }

  const workload = getEvaluatorAssignmentWorkload({
    evaluator,
    answerSheets,
  })

  if (workload.availableCapacity <= 0) {
    return {
      success: false,
      fieldErrors: {
        evaluatorId: `This evaluator already has ${MAX_ACTIVE_SHEETS_PER_EVALUATOR} active answer sheets.`,
      },
      message: "This evaluator currently has no assignment capacity.",
    }
  }

  if (selectedSheetIds.length > workload.availableCapacity) {
    return {
      success: false,
      fieldErrors: {
        answerSheetIds: `Select no more than ${workload.availableCapacity} answer sheets for this evaluator.`,
      },
      message:
        "Selected answer sheets exceed the evaluator's available capacity.",
    }
  }

  return {
    success: true,
    assignedCount: selectedSheetIds.length,
    evaluatorId: evaluator.id,
    answerSheetIds: selectedSheetIds,
  }
}
