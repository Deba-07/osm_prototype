export type UniversityContext = {
  id: string
  name: string
  code: string
  academicYear: string
}

export type Department = {
  id: string
  name: string
  code: string
}

export type Program = {
  id: string
  departmentId: string
  name: string
  code: string
}

export type Semester = {
  id: string
  number: number
  name: string
}

export type Subject = {
  id: string
  departmentId: string
  programId: string
  semesterId: string
  code: string
  name: string
  maximumMarks: number
}

export type Student = {
  id: string
  rollNumber: string
  registrationNumber: string
  name: string
  departmentId: string
  programId: string
  currentSemesterId: string
}

export type EvaluatorStatus = "pending" | "approved" | "rejected"

export type Evaluator = {
  id: string
  name: string
  email: string
  phone: string
  facultyId: string
  departmentId: string
  designation: string
  subjectExpertise: string[]
  experienceYears: number
  status: EvaluatorStatus
}

export type Exam = {
  id: string
  name: string
  academicYear: string
  semesterId: string
}

export type ExamQuestion = {
  id: string
  subjectId: string
  examId: string
  questionNumber: string
  maximumMarks: number
}

export type AnswerSheetStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "completed"

export type AnswerSheet = {
  id: string
  studentId: string
  subjectId: string
  examId: string
  semesterId: string
  pageImages: string[]
  assignedEvaluatorId?: string
  status: AnswerSheetStatus
}

export type AnswerSheetIntakeInput = Omit<
  AnswerSheet,
  "id" | "assignedEvaluatorId" | "status" | "pageImages"
> & {
  pageImages?: string[]
}

export type QuestionMark = {
  questionId: string
  questionNumber: string
  maximumMarks: number
  marksAwarded: number
}

export type EvaluationStatus = "draft" | "submitted"

export type Evaluation = {
  id: string
  answerSheetId: string
  evaluatorId: string
  studentId: string
  subjectId: string
  semesterId: string
  examId: string
  questionMarks: QuestionMark[]
  totalMarks: number
  status: EvaluationStatus
  startedAt?: string
  submittedAt?: string
}

export type MockUserRole = "admin" | "evaluator"

export type MockUser = {
  id: string
  role: MockUserRole
  name: string
  email: string
  evaluatorId?: string
  departmentId?: string
}

export type EvaluatorRegistrationInput = Omit<Evaluator, "id" | "status">

export type EvaluationDraftInput = {
  answerSheetId: string
  evaluatorId: string
  questionMarks: QuestionMark[]
}
