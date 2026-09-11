import { getEvaluationQuestions } from "@/lib/evaluations"
import type {
  AnswerSheet,
  Department,
  Evaluation,
  Evaluator,
  Exam,
  ExamQuestion,
  Program,
  QuestionMark,
  Semester,
  Student,
  Subject,
} from "@/types/osm"

export type ResultQuestionMark = QuestionMark & {
  isConfigured: boolean
}

export type DerivedResult = {
  id: string
  evaluationId: string
  answerSheetId: string
  studentId: string
  studentName: string
  rollNumber: string
  registrationNumber: string
  departmentId: string
  departmentName: string
  departmentCode: string
  programId: string
  programName: string
  programCode: string
  semesterId: string
  semesterName: string
  semesterNumber: number
  subjectId: string
  subjectCode: string
  subjectName: string
  examId: string
  examName: string
  academicYear: string
  evaluatorId: string
  evaluatorName: string
  evaluatorDesignation: string
  totalMarks: number
  maximumMarks: number
  percentage: number
  questionMarks: ResultQuestionMark[]
  submittedAt?: string
}

export type StudentSubjectResult = DerivedResult

export type ResultSummary = {
  completedResults: number
  studentsEvaluated: number
  subjectsEvaluated: number
  averagePercentage: number
}

export type ResultFilterState = {
  searchQuery: string
  departmentId: string
  programId: string
  semesterId: string
  subjectId: string
  examId: string
}

export type ResultSortKey =
  | "student"
  | "subject"
  | "marks"
  | "percentage"
  | "submittedAt"

export type SortDirection = "asc" | "desc"

export type StudentSemesterResult = {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  registrationNumber: string
  departmentName: string
  programName: string
  semesterId: string
  semesterName: string
  semesterNumber: number
  subjectsCompleted: number
  totalMarks: number
  maximumMarks: number
  percentage: number
  results: DerivedResult[]
}

type ResultRelationshipData = {
  evaluations: Evaluation[]
  students: Student[]
  subjects: Subject[]
  exams: Exam[]
  questions?: ExamQuestion[]
  answerSheets?: AnswerSheet[]
  departments?: Department[]
  programs?: Program[]
  semesters?: Semester[]
  evaluators?: Evaluator[]
}

const resultCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
})

function safePercentage(totalMarks: number, maximumMarks: number) {
  if (maximumMarks <= 0) {
    return 0
  }

  return Number(((totalMarks / maximumMarks) * 100).toFixed(1))
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function includesSearch(value: string | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query))
}

function findById<T extends { id: string }>(
  items: T[] | undefined,
  id: string | undefined
) {
  if (!id) {
    return undefined
  }

  return items?.find((item) => item.id === id)
}

function sortQuestionMarks(questionMarks: ResultQuestionMark[]) {
  return [...questionMarks].sort((first, second) =>
    resultCollator.compare(first.questionNumber, second.questionNumber)
  )
}

export function getSubmittedEvaluations(evaluations: Evaluation[]) {
  return evaluations.filter((evaluation) => evaluation.status === "submitted")
}

export function calculateResultPercentage({
  totalMarks,
  maximumMarks,
}: {
  totalMarks: number
  maximumMarks: number
}) {
  return safePercentage(totalMarks, maximumMarks)
}

export function getResultMaximumMarks({
  evaluation,
  subject,
  questions = [],
}: {
  evaluation: Evaluation
  subject: Subject | undefined
  questions?: ExamQuestion[]
}) {
  const matchingQuestions = getEvaluationQuestions({
    answerSheet: {
      id: evaluation.answerSheetId,
      studentId: evaluation.studentId,
      subjectId: evaluation.subjectId,
      examId: evaluation.examId,
      semesterId: evaluation.semesterId,
      pageImages: [],
      assignedEvaluatorId: evaluation.evaluatorId,
      status: "completed",
    },
    questions,
  })
  const questionMaximum = matchingQuestions.reduce(
    (total, question) => total + question.maximumMarks,
    0
  )

  return questionMaximum > 0 ? questionMaximum : (subject?.maximumMarks ?? 0)
}

export function resolveResultQuestionMarks({
  evaluation,
  questions = [],
}: {
  evaluation: Evaluation
  questions?: ExamQuestion[]
}): ResultQuestionMark[] {
  if (questions.length === 0) {
    return sortQuestionMarks(
      evaluation.questionMarks.map((questionMark) => ({
        ...questionMark,
        isConfigured: false,
      }))
    )
  }

  const answerSheetLike = {
    id: evaluation.answerSheetId,
    studentId: evaluation.studentId,
    subjectId: evaluation.subjectId,
    examId: evaluation.examId,
    semesterId: evaluation.semesterId,
    pageImages: [],
    assignedEvaluatorId: evaluation.evaluatorId,
    status: "completed" as const,
  }
  const configuredQuestions = getEvaluationQuestions({
    answerSheet: answerSheetLike,
    questions,
  })
  const configuredQuestionIds = new Set(
    configuredQuestions.map((question) => question.id)
  )
  const markByQuestionId = new Map(
    evaluation.questionMarks.map((questionMark) => [
      questionMark.questionId,
      questionMark,
    ])
  )
  const configuredQuestionMarks = configuredQuestions.map((question) => {
    const questionMark = markByQuestionId.get(question.id)

    return {
      questionId: question.id,
      questionNumber: question.questionNumber,
      maximumMarks: question.maximumMarks,
      marksAwarded: questionMark?.marksAwarded ?? null,
      isConfigured: true,
    }
  })
  const unconfiguredQuestionMarks = evaluation.questionMarks
    .filter((questionMark) => !configuredQuestionIds.has(questionMark.questionId))
    .map((questionMark) => ({
      ...questionMark,
      isConfigured: false,
    }))

  return [
    ...configuredQuestionMarks,
    ...sortQuestionMarks(unconfiguredQuestionMarks),
  ]
}

export function deriveResult({
  evaluation,
  students,
  subjects,
  exams,
  questions,
  answerSheets,
  departments,
  programs,
  semesters,
  evaluators,
}: Omit<ResultRelationshipData, "evaluations"> & {
  evaluation: Evaluation
}): DerivedResult | undefined {
  if (evaluation.status !== "submitted") {
    return undefined
  }

  const student = findById(students, evaluation.studentId)
  const subject = findById(subjects, evaluation.subjectId)
  const exam = findById(exams, evaluation.examId)

  if (!student || !subject || !exam) {
    return undefined
  }

  const answerSheet = findById(answerSheets, evaluation.answerSheetId)
  const department = findById(
    departments,
    student.departmentId ?? subject.departmentId
  )
  const program = findById(programs, student.programId ?? subject.programId)
  const semester = findById(
    semesters,
    evaluation.semesterId ?? subject.semesterId
  )
  const evaluator = findById(evaluators, evaluation.evaluatorId)
  const maximumMarks = getResultMaximumMarks({
    evaluation,
    subject,
    questions,
  })
  const totalMarks = Number(evaluation.totalMarks.toFixed(2))

  return {
    id: `result-${evaluation.id}`,
    evaluationId: evaluation.id,
    answerSheetId: answerSheet?.id ?? evaluation.answerSheetId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    registrationNumber: student.registrationNumber,
    departmentId: department?.id ?? student.departmentId,
    departmentName: department?.name ?? "Department unavailable",
    departmentCode: department?.code ?? "Department unavailable",
    programId: program?.id ?? student.programId,
    programName: program?.name ?? "Program unavailable",
    programCode: program?.code ?? "Program unavailable",
    semesterId: semester?.id ?? evaluation.semesterId,
    semesterName: semester?.name ?? "Semester unavailable",
    semesterNumber: semester?.number ?? 0,
    subjectId: subject.id,
    subjectCode: subject.code,
    subjectName: subject.name,
    examId: exam.id,
    examName: exam.name,
    academicYear: exam.academicYear,
    evaluatorId: evaluator?.id ?? evaluation.evaluatorId,
    evaluatorName: evaluator?.name ?? "Evaluator unavailable",
    evaluatorDesignation: evaluator?.designation ?? "Designation unavailable",
    totalMarks,
    maximumMarks,
    percentage: calculateResultPercentage({ totalMarks, maximumMarks }),
    questionMarks: resolveResultQuestionMarks({ evaluation, questions }),
    submittedAt: evaluation.submittedAt,
  }
}

export function deriveResultsFromEvaluations({
  evaluations,
  students,
  subjects,
  exams,
  questions = [],
  answerSheets = [],
  departments = [],
  programs = [],
  semesters = [],
  evaluators = [],
}: ResultRelationshipData): StudentSubjectResult[] {
  return getSubmittedEvaluations(evaluations).flatMap((evaluation) => {
    const result = deriveResult({
      evaluation,
      students,
      subjects,
      exams,
      questions,
      answerSheets,
      departments,
      programs,
      semesters,
      evaluators,
    })

    return result ? [result] : []
  })
}

export function getResultSummary(results: DerivedResult[]): ResultSummary {
  const totalMarks = results.reduce((total, result) => total + result.totalMarks, 0)
  const maximumMarks = results.reduce(
    (total, result) => total + result.maximumMarks,
    0
  )

  return {
    completedResults: results.length,
    studentsEvaluated: new Set(results.map((result) => result.studentId)).size,
    subjectsEvaluated: new Set(results.map((result) => result.subjectId)).size,
    averagePercentage: calculateResultPercentage({ totalMarks, maximumMarks }),
  }
}

export function filterResults(
  results: DerivedResult[],
  filters: ResultFilterState
) {
  const query = normalizeSearch(filters.searchQuery)

  return results.filter((result) => {
    const matchesSearch =
      query.length === 0 ||
      includesSearch(result.studentName, query) ||
      includesSearch(result.rollNumber, query) ||
      includesSearch(result.registrationNumber, query)
    const matchesDepartment =
      filters.departmentId.length === 0 ||
      result.departmentId === filters.departmentId
    const matchesProgram =
      filters.programId.length === 0 || result.programId === filters.programId
    const matchesSemester =
      filters.semesterId.length === 0 ||
      result.semesterId === filters.semesterId
    const matchesSubject =
      filters.subjectId.length === 0 || result.subjectId === filters.subjectId
    const matchesExam =
      filters.examId.length === 0 || result.examId === filters.examId

    return (
      matchesSearch &&
      matchesDepartment &&
      matchesProgram &&
      matchesSemester &&
      matchesSubject &&
      matchesExam
    )
  })
}

export function sortResults(
  results: DerivedResult[],
  sortKey: ResultSortKey,
  sortDirection: SortDirection
) {
  return [...results].sort((first, second) => {
    let result = 0

    if (sortKey === "student") {
      result = resultCollator.compare(first.studentName, second.studentName)
    }

    if (sortKey === "subject") {
      result = resultCollator.compare(first.subjectName, second.subjectName)
    }

    if (sortKey === "marks") {
      result = first.totalMarks - second.totalMarks
    }

    if (sortKey === "percentage") {
      result = first.percentage - second.percentage
    }

    if (sortKey === "submittedAt") {
      result =
        Date.parse(first.submittedAt ?? "") -
        Date.parse(second.submittedAt ?? "")
    }

    return sortDirection === "asc" ? result : -result
  })
}

export function getStudentResults(
  results: DerivedResult[],
  studentId: string
) {
  return results
    .filter((result) => result.studentId === studentId)
    .sort((first, second) => {
      if (first.semesterNumber !== second.semesterNumber) {
        return first.semesterNumber - second.semesterNumber
      }

      return resultCollator.compare(first.subjectName, second.subjectName)
    })
}

export function getStudentSemesterResults(
  results: DerivedResult[],
  studentId?: string
): StudentSemesterResult[] {
  const filteredResults = studentId
    ? getStudentResults(results, studentId)
    : [...results]
  const groupedResults = new Map<string, StudentSemesterResult>()

  for (const result of filteredResults) {
    const key = `${result.studentId}:${result.semesterId}`
    const current = groupedResults.get(key) ?? {
      id: key,
      studentId: result.studentId,
      studentName: result.studentName,
      rollNumber: result.rollNumber,
      registrationNumber: result.registrationNumber,
      departmentName: result.departmentName,
      programName: result.programName,
      semesterId: result.semesterId,
      semesterName: result.semesterName,
      semesterNumber: result.semesterNumber,
      subjectsCompleted: 0,
      totalMarks: 0,
      maximumMarks: 0,
      percentage: 0,
      results: [],
    }

    current.results.push(result)
    current.subjectsCompleted = current.results.length
    current.totalMarks = Number(
      current.results
        .reduce((total, item) => total + item.totalMarks, 0)
        .toFixed(2)
    )
    current.maximumMarks = current.results.reduce(
      (total, item) => total + item.maximumMarks,
      0
    )
    current.percentage = calculateResultPercentage({
      totalMarks: current.totalMarks,
      maximumMarks: current.maximumMarks,
    })
    current.results = sortResults(current.results, "subject", "asc")

    groupedResults.set(key, current)
  }

  return Array.from(groupedResults.values()).sort((first, second) => {
    if (first.studentName !== second.studentName) {
      return resultCollator.compare(first.studentName, second.studentName)
    }

    return first.semesterNumber - second.semesterNumber
  })
}
