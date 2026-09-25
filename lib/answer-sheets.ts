import type {
  AnswerSheet,
  AnswerSheetIntakeInput,
  AnswerSheetStatus,
  Department,
  Evaluator,
  Exam,
  Program,
  Semester,
  Student,
  Subject,
} from "@/types/osm"

export const answerSheetStatuses: AnswerSheetStatus[] = [
  "unassigned",
  "assigned",
  "in_progress",
  "completed",
]

export const answerSheetStatusLabels: Record<AnswerSheetStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
}

export type AnswerSheetStatusSummary = {
  total: number
  unassigned: number
  assigned: number
  inProgress: number
  completed: number
}

export type AnswerSheetFilterStatus = AnswerSheetStatus | "all"

export type AnswerSheetFilterState = {
  searchQuery: string
  status: AnswerSheetFilterStatus
  departmentId: string
  semesterId: string
  subjectId: string
  examId: string
}

export type AnswerSheetSortKey = "sheetId" | "student" | "subject" | "status"

export type SortDirection = "asc" | "desc"

export type ResolvedAnswerSheet = {
  answerSheet: AnswerSheet
  student?: Student
  department?: Department
  program?: Program
  semester?: Semester
  subject?: Subject
  exam?: Exam
  evaluator?: Evaluator
  pageCount: number
}

export type AnswerSheetIntakeField =
  | "studentId"
  | "semesterId"
  | "subjectId"
  | "examId"

export type AnswerSheetIntakeValidationResult =
  | {
      success: true
      data: AnswerSheetIntakeInput
    }
  | {
      success: false
      fieldErrors: Partial<Record<AnswerSheetIntakeField, string>>
      message: string
    }

type AnswerSheetRelationshipData = {
  students: Student[]
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  evaluators: Evaluator[]
}

type IntakeValidationData = {
  input: AnswerSheetIntakeInput
  answerSheets: AnswerSheet[]
  students: Student[]
  subjects: Subject[]
  semesters: Semester[]
  exams: Exam[]
}

const searchCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
})

function findById<T extends { id: string }>(
  items: T[],
  id: string | undefined
) {
  if (!id) {
    return undefined
  }

  return items.find((item) => item.id === id)
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function includesSearch(value: string | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query))
}

function getStatusOrder(status: AnswerSheetStatus) {
  return answerSheetStatuses.indexOf(status)
}

export function getAnswerSheetStatusSummary(
  answerSheets: AnswerSheet[]
): AnswerSheetStatusSummary {
  return {
    total: answerSheets.length,
    unassigned: answerSheets.filter(
      (answerSheet) => answerSheet.status === "unassigned"
    ).length,
    assigned: answerSheets.filter(
      (answerSheet) => answerSheet.status === "assigned"
    ).length,
    inProgress: answerSheets.filter(
      (answerSheet) => answerSheet.status === "in_progress"
    ).length,
    completed: answerSheets.filter(
      (answerSheet) => answerSheet.status === "completed"
    ).length,
  }
}

export function resolveAnswerSheetDetails(
  answerSheet: AnswerSheet,
  relationships: AnswerSheetRelationshipData
): ResolvedAnswerSheet {
  const student = findById(relationships.students, answerSheet.studentId)
  const subject = findById(relationships.subjects, answerSheet.subjectId)
  const department = findById(
    relationships.departments,
    subject?.departmentId ?? student?.departmentId
  )
  const program = findById(
    relationships.programs,
    student?.programId ?? subject?.programId
  )
  const semester = findById(
    relationships.semesters,
    answerSheet.semesterId ?? subject?.semesterId
  )
  const exam = findById(relationships.exams, answerSheet.examId)
  const evaluator = findById(
    relationships.evaluators,
    answerSheet.assignedEvaluatorId
  )

  return {
    answerSheet,
    student,
    department,
    program,
    semester,
    subject,
    exam,
    evaluator,
    pageCount: answerSheet.pageImages.length,
  }
}

export function resolveAnswerSheets(
  answerSheets: AnswerSheet[],
  relationships: AnswerSheetRelationshipData
) {
  return answerSheets.map((answerSheet) =>
    resolveAnswerSheetDetails(answerSheet, relationships)
  )
}

export function filterAnswerSheetDetails(
  answerSheets: ResolvedAnswerSheet[],
  filters: AnswerSheetFilterState
) {
  const normalizedSearch = normalizeSearch(filters.searchQuery)

  return answerSheets.filter((row) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      includesSearch(row.answerSheet.id, normalizedSearch) ||
      includesSearch(row.student?.name, normalizedSearch) ||
      includesSearch(row.student?.rollNumber, normalizedSearch) ||
      includesSearch(row.student?.registrationNumber, normalizedSearch) ||
      includesSearch(row.subject?.name, normalizedSearch) ||
      includesSearch(row.subject?.code, normalizedSearch) ||
      includesSearch(row.exam?.name, normalizedSearch)
    const matchesStatus =
      filters.status === "all" || row.answerSheet.status === filters.status
    const matchesDepartment =
      filters.departmentId.length === 0 ||
      row.department?.id === filters.departmentId
    const matchesSemester =
      filters.semesterId.length === 0 ||
      row.answerSheet.semesterId === filters.semesterId
    const matchesSubject =
      filters.subjectId.length === 0 ||
      row.answerSheet.subjectId === filters.subjectId
    const matchesExam =
      filters.examId.length === 0 || row.answerSheet.examId === filters.examId

    return (
      matchesSearch &&
      matchesStatus &&
      matchesDepartment &&
      matchesSemester &&
      matchesSubject &&
      matchesExam
    )
  })
}

export function sortAnswerSheetDetails(
  answerSheets: ResolvedAnswerSheet[],
  sortKey: AnswerSheetSortKey | null,
  sortDirection: SortDirection
) {
  if (!sortKey) {
    return answerSheets
  }

  return [...answerSheets].sort((first, second) => {
    let result = 0

    if (sortKey === "status") {
      result =
        getStatusOrder(first.answerSheet.status) -
        getStatusOrder(second.answerSheet.status)
    } else {
      const firstValue =
        sortKey === "sheetId"
          ? first.answerSheet.id
          : sortKey === "student"
            ? (first.student?.name ?? "")
            : (first.subject?.name ?? "")
      const secondValue =
        sortKey === "sheetId"
          ? second.answerSheet.id
          : sortKey === "student"
            ? (second.student?.name ?? "")
            : (second.subject?.name ?? "")

      result = searchCollator.compare(firstValue, secondValue)
    }

    return sortDirection === "asc" ? result : -result
  })
}

export function isDuplicateAnswerSheet(
  answerSheets: AnswerSheet[],
  input: AnswerSheetIntakeInput
) {
  return answerSheets.some((answerSheet) => {
    return (
      answerSheet.studentId === input.studentId &&
      answerSheet.subjectId === input.subjectId &&
      answerSheet.examId === input.examId &&
      answerSheet.semesterId === input.semesterId
    )
  })
}

export function getCompatibleSubjectsForIntake({
  student,
  semesterId,
  subjects,
}: {
  student: Student | undefined
  semesterId: string
  subjects: Subject[]
}) {
  if (!student) {
    return []
  }

  return subjects.filter((subject) => {
    const matchesStudentProgram =
      subject.departmentId === student.departmentId &&
      subject.programId === student.programId
    const matchesSemester =
      semesterId.length === 0 || subject.semesterId === semesterId

    return matchesStudentProgram && matchesSemester
  })
}

export function getCompatibleExamsForIntake({
  semesterId,
  subjectId = "",
  exams,
}: {
  semesterId: string
  subjectId?: string
  exams: Exam[]
}) {
  return exams.filter((exam) => {
    const matchesSemester =
      semesterId.length === 0 || exam.semesterId === semesterId
    const matchesSubject =
      subjectId.length === 0 || exam.subjectId === subjectId

    return matchesSemester && matchesSubject
  })
}

export function validateAnswerSheetIntakeInput({
  input,
  answerSheets,
  students,
  subjects,
  semesters,
  exams,
}: IntakeValidationData): AnswerSheetIntakeValidationResult {
  const fieldErrors: Partial<Record<AnswerSheetIntakeField, string>> = {}
  const student = findById(students, input.studentId)
  const semester = findById(semesters, input.semesterId)
  const subject = findById(subjects, input.subjectId)
  const exam = findById(exams, input.examId)

  if (!student) {
    fieldErrors.studentId = "Select a valid student."
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

  if (student && subject) {
    const subjectMatchesStudent =
      subject.departmentId === student.departmentId &&
      subject.programId === student.programId

    if (!subjectMatchesStudent) {
      fieldErrors.subjectId =
        "Select a subject from the student's department and program."
    }
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

  if (subject && exam && exam.subjectId !== subject.id) {
    fieldErrors.examId = "Select an exam configured for the selected subject."
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      success: false,
      fieldErrors,
      message: "Select a valid student, subject, semester, and exam.",
    }
  }

  if (isDuplicateAnswerSheet(answerSheets, input)) {
    return {
      success: false,
      fieldErrors: {
        subjectId:
          "An answer sheet for this student, subject, semester, and exam already exists.",
      },
      message:
        "An answer sheet for this student, subject, semester, and exam already exists.",
    }
  }

  return {
    success: true,
    data: {
      studentId: input.studentId,
      semesterId: input.semesterId,
      subjectId: input.subjectId,
      examId: input.examId,
      pageImages: input.pageImages ? [...input.pageImages] : undefined,
    },
  }
}
