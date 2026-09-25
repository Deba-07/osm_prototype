export type UniversityContext = {
  id: string
  name: string
  code: string
  academicYear: string
  examInChargeId: string
  city: string
  state: string
  country: string
  pin: string
  affiliatedCollegeIds: string[]
}

export type AffiliatedCollegeStatus = "active" | "inactive"

export type AffiliatedCollege = {
  id: string
  name: string
  code: string
  city: string
  state: string
  instituteId: string
  status: AffiliatedCollegeStatus
  importedAt?: string
}

export type CollegeImportStatus =
  | "ready"
  | "processing"
  | "imported"
  | "validation_issue"

export type CollegeImportState = {
  status: CollegeImportStatus
  importedCount: number
  validationIssues: string[]
  processedAt?: string
}

export type NodalCentreStatus = "active" | "inactive" | "pending"

export type CentreSuperintendent = {
  name: string
  email: string
  phone: string
}

export type NodalCentre = {
  id: string
  name: string
  code: string
  instituteId: string
  affiliatedCollegeId: string
  address: string
  city: string
  state: string
  country: string
  pin: string
  superintendent: CentreSuperintendent
  status: NodalCentreStatus
  createdAt: string
}

export type UploaderStatus = "pending" | "approved" | "rejected"

export type Uploader = {
  id: string
  name: string
  email: string
  phone?: string
  collegeId: string
  nodalCentreId: string
  status: UploaderStatus
  registeredAt: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

export type UploaderRegistrationInput = Pick<
  Uploader,
  "name" | "email" | "collegeId" | "nodalCentreId"
> & {
  phone?: string
}

export type ScannedPdfMetadata = {
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
  demoReference: string
}

export type RollSheetMetadata = {
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: string
  demoReference: string
}

export type UploadBatchStatus =
  | "draft"
  | "uploaded"
  | "ready_for_processing"
  | "failed"

export type UploadBatch = {
  id: string
  batchNumber: string
  nodalCentreId: string
  uploaderId: string
  examId: string
  scannedPdf: ScannedPdfMetadata
  rollSheet: RollSheetMetadata
  status: UploadBatchStatus
  uploadedAt: string
  remarks?: string
}

export type UploadBatchInput = {
  nodalCentreId: string
  uploaderId: string
  examId: string
  scannedPdf: ScannedPdfMetadata
  rollSheet: RollSheetMetadata
  remarks?: string
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

export type ExamPaperType = "regular" | "midterm" | "supplementary"

export type ExamStatus = "draft" | "ready" | "scheduled" | "completed"

export type ExamDocumentStatus = "draft" | "approved" | "published"

export type QuestionPaper = {
  id: string
  title: string
  fileName: string
  uploadedAt: string
  status: ExamDocumentStatus
}

export type MarkingScheme = {
  id: string
  title: string
  totalMarks: number
  passingMarks: number
  version: string
  uploadedAt: string
  status: ExamDocumentStatus
}

export type ExamInCharge = {
  id: string
  name: string
  email: string
  phone: string
  departmentId: string
  designation: string
}

export type Exam = {
  id: string
  name: string
  academicYear: string
  semesterId: string
  subjectId: string
  paperType: ExamPaperType
  examDate: string
  questionPaperId: string
  markingSchemeId: string
  examInChargeId: string
  status: ExamStatus
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
  marksAwarded: number | null
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
