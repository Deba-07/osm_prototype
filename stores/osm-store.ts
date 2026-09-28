"use client"

import { answerSheets as initialAnswerSheets } from "@/data/answer-sheets"
import { initialEvaluations } from "@/data/evaluations"
import { initialAdminAdjustments } from "@/data/admin-adjustments"
import { initialAuditLogs } from "@/data/audit-logs"
import { initialOperationalConflicts } from "@/data/operational-conflicts"
import { nodalCentres as initialNodalCentres } from "@/data/nodal-centres"
import { uploaders as initialUploaders } from "@/data/uploaders"
import { uploadBatches as initialUploadBatches } from "@/data/upload-batches"
import { pdfProcessingJobs as initialPdfProcessingJobs } from "@/data/pdf-processing"
import { processedScripts as initialProcessedScripts } from "@/data/processed-scripts"
import { scriptMappings as initialScriptMappings } from "@/data/script-mappings"
import {
  affiliatedColleges as initialAffiliatedColleges,
  mockImportedColleges,
} from "@/data/colleges"
import { evaluators as initialEvaluators } from "@/data/evaluators"
import {
  examInCharges as initialExamInCharges,
  exams as initialExams,
  markingSchemes as initialMarkingSchemes,
  questionPapers as initialQuestionPapers,
} from "@/data/exams"
import { departments } from "@/data/departments"
import { programs } from "@/data/programs"
import { examQuestions } from "@/data/questions"
import { semesters } from "@/data/semesters"
import { students as initialStudents } from "@/data/students"
import { subjects } from "@/data/subjects"
import { validateAnswerSheetIntakeInput } from "@/lib/answer-sheets"
import {
  validateAssignment,
  type AnswerSheetAssignmentInput,
  type AnswerSheetAssignmentResult,
} from "@/lib/assignments"
import {
  validateEvaluationDraftInput,
  validateEvaluationSubmissionInput,
  getEvaluationQuestions,
} from "@/lib/evaluations"
import { validateUploaderRegistration } from "@/lib/uploaders"
import {
  getNextUploadBatchNumber,
  validateUploadBatchInput,
} from "@/lib/upload-batches"
import { canStartPdfProcessing } from "@/lib/pdf-processing"
import { validateScriptMapping } from "@/lib/script-mappings"
import { getRemainingEvaluatorSheets, planEvaluatorRedistribution } from "@/lib/conflicts"
import {
  getAdditionalScriptCandidates,
  planAutomaticScriptDistribution,
} from "@/lib/script-distribution"
import { validateAdditionalScriptRequest } from "@/lib/additional-script-requests"
import { calculateFinalMarks, validateAdjustmentInput } from "@/lib/admin-adjustments"
import { additionalScriptRequests as initialAdditionalScriptRequests } from "@/data/additional-script-requests"
import { scriptExceptions as initialScriptExceptions } from "@/data/script-exceptions"
import {
  DEMO_OTP_CODE,
  DEMO_OTP_DURATION_MS,
  DEMO_SESSION_DURATION_MS,
  MAX_DEMO_OTP_ATTEMPTS,
  isDemoOtpExpired,
  isDemoSessionActive,
} from "@/lib/demo-auth"
import type {
  AnswerSheet,
  AffiliatedCollege,
  AnswerSheetIntakeInput,
  CollegeImportState,
  Exam,
  ExamInCharge,
  Evaluation,
  EvaluationSession,
  EvaluationDraftInput,
  Evaluator,
  EvaluatorRegistrationInput,
  MarkingScheme,
  MockUser,
  NodalCentre,
  NodalCentreStatus,
  QuestionPaper,
  Student,
  Uploader,
  UploaderRegistrationInput,
  UploadBatch,
  UploadBatchInput,
  PdfProcessingJob,
  ProcessedScript,
  ScriptMapping,
  ScriptMappingInput,
  ScriptDistributionSummary,
  AdditionalScriptRequest,
  AdditionalScriptRequestInput,
  DemoEvaluatorSession,
  DemoOtpChallenge,
  DemoOtpRequestResult,
  DemoOtpVerificationResult,
  ScriptException,
  AdminAdjustment,
  AuditAction,
  AuditLog,
  OperationalConflict,
} from "@/types/osm"
import { universityContext as initialUniversityContext } from "@/data/university"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type OsmStoreState = {
  currentUser: MockUser | null
  demoOtpChallenge: DemoOtpChallenge | null
  evaluatorSession: DemoEvaluatorSession | null
  universityContext: typeof initialUniversityContext
  affiliatedColleges: AffiliatedCollege[]
  collegeImport: CollegeImportState
  nodalCentres: NodalCentre[]
  uploaders: Uploader[]
  uploadBatches: UploadBatch[]
  pdfProcessingJobs: PdfProcessingJob[]
  processedScripts: ProcessedScript[]
  scriptMappings: ScriptMapping[]
  lastDistributionSummary: ScriptDistributionSummary | null
  additionalScriptRequests: AdditionalScriptRequest[]
  students: Student[]
  exams: Exam[]
  questionPapers: QuestionPaper[]
  markingSchemes: MarkingScheme[]
  examInCharges: ExamInCharge[]
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
  adminAdjustments: AdminAdjustment[]
  auditLogs: AuditLog[]
  finalizedResultIds: string[]
  operationalConflicts: OperationalConflict[]
  evaluationSessions: EvaluationSession[]
  scriptExceptions: ScriptException[]
}

type OsmStoreActions = {
  loginAsAdmin: () => void
  loginAsEvaluator: (evaluatorId: string) => boolean
  requestDemoOtp: (identifier: string) => DemoOtpRequestResult
  verifyDemoOtp: (code: string) => DemoOtpVerificationResult
  verifyEvaluatorSession: (evaluatorId?: string) => boolean
  endEvaluatorSession: () => void
  logout: () => void
  registerEvaluator: (input: EvaluatorRegistrationInput) => Evaluator
  createAnswerSheet: (input: AnswerSheetIntakeInput) => AnswerSheet | undefined
  approveEvaluator: (evaluatorId: string) => boolean
  rejectEvaluator: (evaluatorId: string) => boolean
  importAffiliatedColleges: () => CollegeImportState
  updateNodalCentreStatus: (
    nodalCentreId: string,
    status: NodalCentreStatus
  ) => boolean
  registerUploader: (input: UploaderRegistrationInput) => Uploader | undefined
  approveUploader: (uploaderId: string) => boolean
  rejectUploader: (uploaderId: string, reason?: string) => boolean
  createUploadBatch: (input: UploadBatchInput) => UploadBatch | undefined
  startPdfProcessing: (uploadBatchId: string) => boolean
  advancePdfProcessing: (uploadBatchId: string) => PdfProcessingJob | undefined
  createScriptMapping: (input: ScriptMappingInput) => ScriptMapping | undefined
  correctScriptMapping: (mappingId: string, studentId: string) => boolean
  reviewScriptMapping: (mappingId: string, notes?: string) => boolean
  autoDistributeScripts: () => ScriptDistributionSummary
  requestAdditionalScripts: (
    input: AdditionalScriptRequestInput
  ) => AdditionalScriptRequest | undefined
  approveAdditionalScriptRequest: (
    requestId: string,
    reviewNote?: string
  ) => AdditionalScriptRequest | undefined
  rejectAdditionalScriptRequest: (
    requestId: string,
    reviewNote?: string
  ) => boolean
  assignAnswerSheets: (
    input: AnswerSheetAssignmentInput
  ) => AnswerSheetAssignmentResult
  saveEvaluationDraft: (
    input: EvaluationDraftInput
  ) => Evaluation | undefined
  submitEvaluation: (input: EvaluationDraftInput) => Evaluation | undefined
  applyAdminAdjustment: (input: {
    evaluationId: string
    adjustmentMarks: number
    reason: string
  }) => AdminAdjustment | undefined
  addAuditLog: (input: { action: AuditAction; entityType?: string; entityId?: string; examId?: string; scriptId?: string; description: string; metadata?: Record<string, string | number>; dedupeWindowMs?: number }) => AuditLog | undefined
  finalizeResult: (evaluationId: string) => boolean
  setEvaluatorAvailability: (evaluatorId: string, availability: "available" | "unavailable") => boolean
  redistributeEvaluatorWork: (evaluatorId: string) => { remainingBefore: number; redistributed: number; stillRemaining: number; message?: string }
  startConflictReview: (conflictId: string) => boolean
  resolveConflict: (conflictId: string, resolutionNote: string) => boolean
  startEvaluationSession: (input: {
    evaluatorId: string
    scriptId: string
  }) => EvaluationSession | undefined
  resumeEvaluationSession: (input: {
    evaluatorId: string
    scriptId: string
  }) => EvaluationSession | undefined
  autoSaveEvaluation: (input: EvaluationDraftInput) => Evaluation | undefined
  interruptEvaluationSession: (input: {
    evaluatorId: string
    scriptId: string
  }) => boolean
  completeEvaluationSession: (input: {
    evaluatorId: string
    scriptId: string
  }) => boolean
  startExceptionReview: (exceptionId: string) => boolean
  resolveException: (exceptionId: string, resolutionNote: string) => boolean
  resetDemo: () => void
}

export type OsmStore = OsmStoreState & OsmStoreActions

const demoAdminUser: MockUser = {
  id: "demo-admin",
  role: "admin",
  name: "University Admin",
  email: "admin@dsu.demo",
}

function createDemoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const currentExamIds = new Set(initialExams.map((exam) => exam.id))

const legacyExamIdsBySubject = new Map([
  ["exam-2026-sem2-regular:sub-ece-circuits", "exam-2026-sem2-ec102-regular"],
  ["exam-2026-sem2-regular:sub-me-materials", "exam-2026-sem2-me102-regular"],
  ["exam-2026-sem3-midterm:sub-cse-dsa", "exam-2026-sem3-cs203-midterm"],
  ["exam-2026-sem3-midterm:sub-ece-signals", "exam-2026-sem3-ec203-midterm"],
  ["exam-2026-sem3-midterm:sub-me-thermo", "exam-2026-sem3-me203-midterm"],
  ["exam-2026-sem4-regular:sub-cse-dbms", "exam-2026-sem4-cs204-regular"],
  ["exam-2026-sem4-regular:sub-cse-os", "exam-2026-sem4-cs206-regular"],
  ["exam-2026-sem4-regular:sub-ece-digital", "exam-2026-sem4-ec204-regular"],
  ["exam-2026-sem4-regular:sub-me-fluids", "exam-2026-sem4-me204-regular"],
])

function resolveCurrentExamId({
  examId,
  subjectId,
}: {
  examId: string
  subjectId: string
}) {
  if (currentExamIds.has(examId)) {
    return examId
  }

  return legacyExamIdsBySubject.get(`${examId}:${subjectId}`) ?? examId
}

function normalizeExamReferences<T extends { examId: string; subjectId: string }>(
  records: T[]
): T[] {
  return records.map((record) => {
    const examId = resolveCurrentExamId({
      examId: record.examId,
      subjectId: record.subjectId,
    })

    return examId === record.examId ? record : { ...record, examId }
  })
}

function cloneInitialState(): OsmStoreState {
  return {
    currentUser: null,
    demoOtpChallenge: null,
    evaluatorSession: null,
    universityContext: {
      ...initialUniversityContext,
      affiliatedCollegeIds: [...initialUniversityContext.affiliatedCollegeIds],
    },
    affiliatedColleges: initialAffiliatedColleges.map((college) => ({ ...college })),
    collegeImport: {
      status: "ready",
      importedCount: 0,
      validationIssues: [],
    },
    nodalCentres: initialNodalCentres.map((nodalCentre) => ({
      ...nodalCentre,
      superintendent: { ...nodalCentre.superintendent },
    })),
    uploaders: initialUploaders.map((uploader) => ({ ...uploader })),
    uploadBatches: initialUploadBatches.map((batch) => ({
      ...batch,
      scannedPdf: { ...batch.scannedPdf },
      rollSheet: { ...batch.rollSheet },
    })),
    pdfProcessingJobs: initialPdfProcessingJobs.map((job) => ({ ...job })),
    processedScripts: initialProcessedScripts.map((script) => ({ ...script })),
    scriptMappings: initialScriptMappings.map((mapping) => ({
      ...mapping,
      validationIssues: [...mapping.validationIssues],
    })),
    lastDistributionSummary: null,
    additionalScriptRequests: initialAdditionalScriptRequests.map((request) => ({
      ...request,
    })),
    students: initialStudents.map((student) => ({ ...student })),
    exams: initialExams.map((exam) => ({ ...exam })),
    questionPapers: initialQuestionPapers.map((questionPaper) => ({
      ...questionPaper,
    })),
    markingSchemes: initialMarkingSchemes.map((markingScheme) => ({
      ...markingScheme,
    })),
    examInCharges: initialExamInCharges.map((examInCharge) => ({
      ...examInCharge,
    })),
    evaluators: initialEvaluators.map((evaluator) => ({
      ...evaluator,
      subjectExpertise: [...evaluator.subjectExpertise],
    })),
    answerSheets: initialAnswerSheets.map((answerSheet) => ({
      ...answerSheet,
      pageImages: [...answerSheet.pageImages],
    })),
    evaluations: initialEvaluations.map((evaluation) => ({
      ...evaluation,
      questionMarks: evaluation.questionMarks.map((questionMark) => ({
        ...questionMark,
      })),
    })),
    adminAdjustments: initialAdminAdjustments.map((adjustment) => ({ ...adjustment })),
    auditLogs: initialAuditLogs.map((log) => ({ ...log, metadata: log.metadata ? { ...log.metadata } : undefined })),
    finalizedResultIds: ["evaluation-as-cse-dsa-001"],
    operationalConflicts: initialOperationalConflicts.map((conflict) => ({ ...conflict, affectedScriptIds: [...conflict.affectedScriptIds] })),
    evaluationSessions: [
      {
        id: "evaluation-session-demo-stuck-001",
        evaluatorId: "eval-cse-ananya-sen",
        scriptId: "script-batch-002-002",
        status: "interrupted",
        startedAt: "2026-08-22T09:00:00.000Z",
        lastSavedAt: "2026-08-22T09:35:00.000Z",
        interruptedAt: "2026-08-22T09:40:00.000Z",
      },
    ],
    scriptExceptions: initialScriptExceptions.map((exception) => ({ ...exception })),
  }
}

function upsertEvaluation(
  evaluations: Evaluation[],
  nextEvaluation: Evaluation
) {
  let hasReplacedEvaluation = false
  const nextEvaluations: Evaluation[] = []

  for (const evaluation of evaluations) {
    const isSameEvaluationPair =
      evaluation.answerSheetId === nextEvaluation.answerSheetId &&
      evaluation.evaluatorId === nextEvaluation.evaluatorId

    if (!isSameEvaluationPair) {
      nextEvaluations.push(evaluation)
      continue
    }

    if (!hasReplacedEvaluation) {
      nextEvaluations.push(nextEvaluation)
      hasReplacedEvaluation = true
    }
  }

  return hasReplacedEvaluation
    ? nextEvaluations
    : [...nextEvaluations, nextEvaluation]
}

export const useOsmStore = create<OsmStore>()(
  persist(
    (set, get) => ({
      ...cloneInitialState(),
      loginAsAdmin: () => {
        set({
          currentUser: demoAdminUser,
          demoOtpChallenge: null,
          evaluatorSession: null,
        })
      },
      addAuditLog: ({ action, entityType, entityId, examId, scriptId, description, metadata, dedupeWindowMs = 0 }) => {
        const currentUser = get().currentUser
        const now = new Date().toISOString()
        const latest = get().auditLogs[0]
        if (dedupeWindowMs && latest?.action === action && latest.entityId === entityId && Date.parse(now) - Date.parse(latest.timestamp) < dedupeWindowMs) return latest
        const log: AuditLog = { id: createDemoId("audit"), action, actorId: currentUser?.id, actorName: currentUser?.name, actorRole: currentUser?.role, entityType, entityId, examId, scriptId, description, timestamp: now, metadata }
        set((state) => ({ auditLogs: [log, ...state.auditLogs] }))
        return log
      },
      loginAsEvaluator: (evaluatorId) => {
        const evaluator = get().evaluators.find(
          (item) => item.id === evaluatorId && item.status === "approved"
        )

        if (!evaluator) {
          return false
        }

        set({
          currentUser: {
            id: `demo-user-${evaluator.id}`,
            role: "evaluator",
            name: evaluator.name,
            email: evaluator.email,
            evaluatorId: evaluator.id,
            departmentId: evaluator.departmentId,
          },
          demoOtpChallenge: null,
          evaluatorSession: null,
        })

        return true
      },
      requestDemoOtp: (identifier) => {
        const normalizedIdentifier = identifier.trim().toLowerCase()
        const evaluator = get().evaluators.find(
          (item) =>
            item.id === identifier || item.email.toLowerCase() === normalizedIdentifier
        )

        if (!evaluator) {
          return { success: false, message: "No evaluator matches that email." }
        }

        if (evaluator.status !== "approved") {
          return {
            success: false,
            message: "Only approved evaluators can request a Demo OTP.",
          }
        }

        const requestedAt = new Date()
        const challenge: DemoOtpChallenge = {
          id: createDemoId("otp"),
          evaluatorId: evaluator.id,
          code: DEMO_OTP_CODE,
          status: "pending",
          requestedAt: requestedAt.toISOString(),
          expiresAt: new Date(
            requestedAt.getTime() + DEMO_OTP_DURATION_MS
          ).toISOString(),
          attempts: 0,
        }

        set({
          currentUser: {
            id: `demo-user-${evaluator.id}`,
            role: "evaluator",
            name: evaluator.name,
            email: evaluator.email,
            evaluatorId: evaluator.id,
            departmentId: evaluator.departmentId,
          },
          demoOtpChallenge: challenge,
          evaluatorSession: null,
        })

        return { success: true, challenge }
      },
      verifyDemoOtp: (code) => {
        const challenge = get().demoOtpChallenge
        const evaluatorId = get().currentUser?.evaluatorId

        if (!challenge || !evaluatorId || challenge.evaluatorId !== evaluatorId) {
          return { success: false, message: "Request a new Demo OTP first." }
        }

        if (challenge.status === "failed") {
          return {
            success: false,
            message: "Demo OTP attempts are exhausted. Request a new OTP.",
          }
        }

        if (isDemoOtpExpired(challenge)) {
          const expiredChallenge = { ...challenge, status: "expired" as const }
          set({ demoOtpChallenge: expiredChallenge })
          return {
            success: false,
            message: "Demo OTP expired. Request a new OTP.",
          }
        }

        if (code.trim() !== challenge.code) {
          const attempts = challenge.attempts + 1
          const failed = attempts >= MAX_DEMO_OTP_ATTEMPTS
          set({
            demoOtpChallenge: {
              ...challenge,
              attempts,
              status: failed ? "failed" : "pending",
            },
          })
          return {
            success: false,
            message: failed
              ? "Demo OTP attempts exhausted. Request a new OTP."
              : "Invalid Demo OTP.",
          }
        }

        const verifiedAt = new Date()
        const session: DemoEvaluatorSession = {
          id: createDemoId("session"),
          evaluatorId,
          status: "active",
          startedAt: verifiedAt.toISOString(),
          lastVerifiedAt: verifiedAt.toISOString(),
          expiresAt: new Date(
            verifiedAt.getTime() + DEMO_SESSION_DURATION_MS
          ).toISOString(),
        }
        set({
          demoOtpChallenge: {
            ...challenge,
            status: "verified",
            verifiedAt: verifiedAt.toISOString(),
          },
          evaluatorSession: session,
        })
        return { success: true, session }
      },
      verifyEvaluatorSession: (evaluatorId) => {
        const session = get().evaluatorSession
        if (isDemoSessionActive(session, evaluatorId)) return true

        if (session?.status === "active") {
          set({ evaluatorSession: { ...session, status: "expired" } })
        }
        return false
      },
      endEvaluatorSession: () => {
        const session = get().evaluatorSession
        set({
          currentUser: null,
          evaluatorSession: session
            ? { ...session, status: "ended" }
            : null,
          evaluationSessions: get().evaluationSessions.map((item) =>
            item.status === "active"
              ? {
                  ...item,
                  status: "interrupted",
                  interruptedAt: new Date().toISOString(),
                }
              : item
          ),
        })
      },
      logout: () => {
        const session = get().evaluatorSession
        set({
          currentUser: null,
          evaluatorSession: session
            ? { ...session, status: "ended" }
            : null,
          evaluationSessions: get().evaluationSessions.map((item) =>
            item.status === "active"
              ? {
                  ...item,
                  status: "interrupted",
                  interruptedAt: new Date().toISOString(),
                }
              : item
          ),
        })
      },
      registerEvaluator: (input) => {
        const evaluator: Evaluator = {
          ...input,
          id: createDemoId("eval"),
          status: "pending",
        }

        set((state) => ({
          evaluators: [...state.evaluators, evaluator],
        }))

        return evaluator
      },
      createAnswerSheet: (input) => {
        const validation = validateAnswerSheetIntakeInput({
          input,
          answerSheets: get().answerSheets,
          students: get().students,
          subjects,
          semesters,
          exams: get().exams,
        })

        if (!validation.success) {
          return undefined
        }

        const answerSheet: AnswerSheet = {
          id: createDemoId("as"),
          studentId: validation.data.studentId,
          subjectId: validation.data.subjectId,
          examId: validation.data.examId,
          semesterId: validation.data.semesterId,
          pageImages: validation.data.pageImages
            ? [...validation.data.pageImages]
            : [],
          status: "unassigned",
        }

        set((state) => ({
          answerSheets: [answerSheet, ...state.answerSheets],
        }))

        return answerSheet
      },
      approveEvaluator: (evaluatorId) => {
        const evaluator = get().evaluators.find(
          (item) => item.id === evaluatorId
        )

        if (!evaluator || evaluator.status !== "pending") {
          return false
        }

        set((state) => ({
          evaluators: state.evaluators.map((evaluator) =>
            evaluator.id === evaluatorId
              ? { ...evaluator, status: "approved" }
              : evaluator
          ),
        }))

        get().addAuditLog({
          action: "evaluator_approved",
          entityType: "evaluator",
          entityId: evaluator.id,
          description: `Evaluator ${evaluator.name} approved.`,
        })

        return true
      },
      rejectEvaluator: (evaluatorId) => {
        const evaluator = get().evaluators.find(
          (item) => item.id === evaluatorId
        )

        if (!evaluator || evaluator.status !== "pending") {
          return false
        }

        set((state) => ({
          evaluators: state.evaluators.map((evaluator) =>
            evaluator.id === evaluatorId
              ? { ...evaluator, status: "rejected" }
              : evaluator
          ),
        }))

        return true
      },
      importAffiliatedColleges: () => {
        const importedIds = new Set(get().affiliatedColleges.map((college) => college.id))
        const newColleges = mockImportedColleges.filter(
          (college) => !importedIds.has(college.id)
        )
        const processedAt = new Date().toISOString()
        const nextState: CollegeImportState = {
          status: "imported",
          importedCount: newColleges.length,
          validationIssues: [],
          processedAt,
        }

        set((state) => ({
          affiliatedColleges: [
            ...state.affiliatedColleges,
            ...newColleges.map((college) => ({ ...college, importedAt: processedAt })),
          ],
          universityContext: {
            ...state.universityContext,
            affiliatedCollegeIds: [
              ...state.universityContext.affiliatedCollegeIds,
              ...newColleges.map((college) => college.id),
            ],
          },
          collegeImport: nextState,
        }))

        return nextState
      },
      updateNodalCentreStatus: (nodalCentreId, status) => {
        const nodalCentre = get().nodalCentres.find(
          (item) => item.id === nodalCentreId
        )

        if (!nodalCentre || nodalCentre.status === status) {
          return false
        }

        set((state) => ({
          nodalCentres: state.nodalCentres.map((item) =>
            item.id === nodalCentreId ? { ...item, status } : item
          ),
        }))

        return true
      },
      registerUploader: (input) => {
        const validationError = validateUploaderRegistration({
          input,
          uploaders: get().uploaders,
          affiliatedColleges: get().affiliatedColleges,
          nodalCentres: get().nodalCentres,
        })

        if (validationError) return undefined

        const uploader: Uploader = {
          ...input,
          email: input.email.trim().toLowerCase(),
          name: input.name.trim(),
          id: createDemoId("uploader"),
          status: "pending",
          registeredAt: new Date().toISOString(),
        }

        set((state) => ({ uploaders: [uploader, ...state.uploaders] }))
        return uploader
      },
      approveUploader: (uploaderId) => {
        const uploader = get().uploaders.find((item) => item.id === uploaderId)
        if (!uploader || uploader.status !== "pending") return false

        set((state) => ({
          uploaders: state.uploaders.map((item) =>
            item.id === uploaderId
              ? {
                  ...item,
                  status: "approved",
                  approvedAt: new Date().toISOString(),
                  rejectedAt: undefined,
                  rejectionReason: undefined,
                }
              : item
          ),
        }))
        return true
      },
      rejectUploader: (uploaderId, reason) => {
        const uploader = get().uploaders.find((item) => item.id === uploaderId)
        if (!uploader || uploader.status !== "pending") return false

        set((state) => ({
          uploaders: state.uploaders.map((item) =>
            item.id === uploaderId
              ? {
                  ...item,
                  status: "rejected",
                  rejectedAt: new Date().toISOString(),
                  rejectionReason: reason?.trim() || undefined,
                  approvedAt: undefined,
                }
              : item
          ),
        }))
        return true
      },
      createUploadBatch: (input) => {
        const validationError = validateUploadBatchInput({
          input,
          exams: get().exams,
          nodalCentres: get().nodalCentres,
          uploaders: get().uploaders,
        })

        if (validationError) return undefined

        const uploadedAt = new Date().toISOString()
        const uploadBatch: UploadBatch = {
          ...input,
          id: createDemoId("batch"),
          batchNumber: getNextUploadBatchNumber(get().uploadBatches),
          status: "ready_for_processing",
          uploadedAt,
          scannedPdf: { ...input.scannedPdf },
          rollSheet: { ...input.rollSheet },
        }

        set((state) => ({
          uploadBatches: [uploadBatch, ...state.uploadBatches],
        }))

        const exam = get().exams.find((item) => item.id === uploadBatch.examId)
        const nodalCentre = get().nodalCentres.find((item) => item.id === uploadBatch.nodalCentreId)
        const uploader = get().uploaders.find((item) => item.id === uploadBatch.uploaderId)
        get().addAuditLog({
          action: "batch_uploaded",
          entityType: "upload-batch",
          entityId: uploadBatch.id,
          examId: uploadBatch.examId,
          description: `Batch ${uploadBatch.batchNumber} uploaded for ${exam?.name ?? "exam"}.`,
          metadata: { nodalCentre: nodalCentre?.name ?? "Unavailable", uploader: uploader?.name ?? "Unavailable" },
        })

        return uploadBatch
      },
      startPdfProcessing: (uploadBatchId) => {
        const batch = get().uploadBatches.find(
          (item) => item.id === uploadBatchId
        )
        const existingJob = get().pdfProcessingJobs.find(
          (item) => item.uploadBatchId === uploadBatchId
        )
        const validationError = canStartPdfProcessing({
          batch,
          job: existingJob,
        })

        if (validationError || existingJob?.status === "completed") {
          return false
        }

        const nextJob: PdfProcessingJob = {
          id: existingJob?.id ?? "pdf-job-" + uploadBatchId,
          uploadBatchId,
          status: "detecting_pages",
          totalPages: 32,
          detectedPages: 0,
          processedPages: 0,
          generatedScripts: 0,
          progress: 20,
          startedAt: existingJob?.startedAt ?? new Date().toISOString(),
        }

        set((state) => ({
          pdfProcessingJobs: existingJob
            ? state.pdfProcessingJobs.map((job) =>
                job.uploadBatchId === uploadBatchId ? nextJob : job
              )
            : [...state.pdfProcessingJobs, nextJob],
        }))

        return true
      },
      advancePdfProcessing: (uploadBatchId) => {
        const job = get().pdfProcessingJobs.find(
          (item) => item.uploadBatchId === uploadBatchId
        )

        if (!job || job.status === "received" || job.status === "completed") {
          return job
        }

        let nextJob: PdfProcessingJob
        let generatedScript: ProcessedScript | undefined

        if (job.status === "detecting_pages") {
          nextJob = {
            ...job,
            status: "splitting_pages",
            detectedPages: 32,
            progress: 40,
          }
        } else if (job.status === "splitting_pages") {
          nextJob = {
            ...job,
            status: "generating_scripts",
            detectedPages: 32,
            processedPages: 32,
            progress: 80,
          }
        } else {
          const completedAt = new Date().toISOString()
          nextJob = {
            ...job,
            status: "completed",
            totalPages: 32,
            detectedPages: 32,
            processedPages: 32,
            generatedScripts: 1,
            progress: 100,
            completedAt,
          }
          generatedScript = {
            id: "script-" + uploadBatchId + "-001",
            uploadBatchId,
            pageCount: 32,
            startPage: 1,
            endPage: 32,
            status: "generated",
            coverPageProtected: true,
            generatedAt: completedAt,
          }
        }

        set((state) => ({
          pdfProcessingJobs: state.pdfProcessingJobs.map((item) =>
            item.uploadBatchId === uploadBatchId ? nextJob : item
          ),
          processedScripts: generatedScript
            ? [
                ...state.processedScripts.filter(
                  (script) => script.uploadBatchId !== uploadBatchId
                ),
                generatedScript,
              ]
            : state.processedScripts,
        }))

        if (nextJob.status === "completed") {
          const processedBatch = get().uploadBatches.find((item) => item.id === uploadBatchId)
          const processedExamId = processedBatch?.examId
          get().addAuditLog({
            action: "pdf_processed",
            entityType: "processing-job",
            entityId: nextJob.id,
            examId: processedExamId,
            scriptId: generatedScript?.id,
            description: `PDF processed for ${uploadBatchId}; ${nextJob.generatedScripts} script(s) generated.`,
            metadata: { batchId: uploadBatchId, generatedScripts: nextJob.generatedScripts },
          })
        }

        return nextJob
      },
      createScriptMapping: (input) => {
        const validation = validateScriptMapping({
          input,
          scripts: get().processedScripts,
          students: get().students,
          batches: get().uploadBatches,
          exams: get().exams,
          mappings: get().scriptMappings,
        })

        if (!validation.script) return undefined

        const now = new Date().toISOString()
        const mapping: ScriptMapping = {
          id: createDemoId("mapping"),
          scriptId: validation.script.id,
          studentId: input.studentId,
          rollNumber: input.rollNumber?.trim() || undefined,
          startPage: validation.script.startPage,
          endPage: validation.script.endPage,
          pageCount: validation.script.pageCount,
          status: validation.status,
          validationIssues: validation.issues,
          reviewed: false,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({ scriptMappings: [mapping, ...state.scriptMappings] }))
        return mapping
      },
      correctScriptMapping: (mappingId, studentId) => {
        const mapping = get().scriptMappings.find((item) => item.id === mappingId)
        const student = get().students.find((item) => item.id === studentId)
        if (!mapping || !student) return false

        const candidate = {
          ...mapping,
          studentId: student.id,
          rollNumber: student.rollNumber,
        }
        const validation = validateScriptMapping({
          mapping: candidate,
          input: {
            scriptId: candidate.scriptId,
            studentId: candidate.studentId,
            rollNumber: candidate.rollNumber,
          },
          scripts: get().processedScripts,
          students: get().students,
          batches: get().uploadBatches,
          exams: get().exams,
          mappings: get().scriptMappings,
        })

        set((state) => ({
          scriptMappings: state.scriptMappings.map((item) =>
            item.id === mappingId
              ? {
                  ...item,
                  studentId: student.id,
                  rollNumber: student.rollNumber,
                  status: validation.status,
                  validationIssues: validation.issues,
                  reviewed: false,
                  reviewedAt: undefined,
                  reviewNotes: undefined,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }))

        return true
      },
      reviewScriptMapping: (mappingId, notes) => {
        const mapping = get().scriptMappings.find((item) => item.id === mappingId)
        if (!mapping) return false

        set((state) => ({
          scriptMappings: state.scriptMappings.map((item) =>
            item.id === mappingId
              ? {
                  ...item,
                  reviewed: true,
                  reviewedAt: new Date().toISOString(),
                  reviewNotes: notes?.trim() || item.reviewNotes,
                  updatedAt: new Date().toISOString(),
                }
              : item
          ),
        }))

        return true
      },
      autoDistributeScripts: () => {
        const state = get()
        const contextByScript = new Map(
          state.scriptMappings
            .filter((mapping) => mapping.status === "valid")
            .map((mapping) => {
              const script = state.processedScripts.find(
                (item) => item.id === mapping.scriptId
              )
              const batch = script
                ? state.uploadBatches.find(
                    (item) => item.id === script.uploadBatchId
                  )
                : undefined
              const exam = batch
                ? state.exams.find((item) => item.id === batch.examId)
                : undefined
              const student = mapping.studentId
                ? state.students.find((item) => item.id === mapping.studentId)
                : undefined

              return [
                mapping.scriptId,
                script && exam && student && student.rollNumber === mapping.rollNumber
                  ? { script, exam, student }
                  : undefined,
              ] as const
            })
            .filter((entry): entry is readonly [string, { script: ProcessedScript; exam: Exam; student: Student }] => Boolean(entry[1]))
        )
        const bridgeSheets: AnswerSheet[] = []

        for (const [scriptId, context] of contextByScript) {
          const hasBridge = state.answerSheets.some(
            (sheet) => sheet.processedScriptId === scriptId
          )
          if (hasBridge) continue

          const bridgeId = `as-script-${scriptId}`
          bridgeSheets.push({
            id: bridgeId,
            studentId: context.student.id,
            subjectId: context.exam.subjectId,
            examId: context.exam.id,
            semesterId: context.exam.semesterId,
            pageImages: [
              `/demo/answer-sheets/${bridgeId}/page-1.jpg`,
              `/demo/answer-sheets/${bridgeId}/page-2.jpg`,
            ],
            processedScriptId: context.script.id,
            status: "unassigned",
          })
        }

        const answerSheetsWithBridges = [...state.answerSheets, ...bridgeSheets]
        const plan = planAutomaticScriptDistribution({
          scripts: state.processedScripts,
          mappings: state.scriptMappings,
          students: state.students,
          batches: state.uploadBatches,
          exams: state.exams,
          evaluators: state.evaluators,
          answerSheets: answerSheetsWithBridges,
        })
        const assignmentsByScript = new Map(
          plan.assignments.map((assignment) => [assignment.scriptId, assignment])
        )
        const nextAnswerSheets = answerSheetsWithBridges.map((sheet) => {
          const assignment = sheet.processedScriptId
            ? assignmentsByScript.get(sheet.processedScriptId)
            : undefined
          return assignment
            ? {
                ...sheet,
                assignedEvaluatorId: assignment.evaluatorId,
                status: "assigned" as const,
              }
            : sheet
        })
        const completedPlan = planAutomaticScriptDistribution({
          scripts: state.processedScripts,
          mappings: state.scriptMappings,
          students: state.students,
          batches: state.uploadBatches,
          exams: state.exams,
          evaluators: state.evaluators,
          answerSheets: nextAnswerSheets,
        })

        set({
          answerSheets: nextAnswerSheets,
          lastDistributionSummary: completedPlan.summary,
        })

        if (completedPlan.summary.distributed > 0) {
          const firstAssignment = plan.assignments[0]
          get().addAuditLog({
            action: "script_assigned",
            entityType: "script-distribution",
            entityId: firstAssignment?.scriptId ?? "automatic-distribution",
            scriptId: firstAssignment?.scriptId,
            examId: firstAssignment ? get().processedScripts.find((script) => script.id === firstAssignment.scriptId)?.uploadBatchId ? get().uploadBatches.find((batch) => batch.id === get().processedScripts.find((script) => script.id === firstAssignment.scriptId)?.uploadBatchId)?.examId : undefined : undefined,
            description: `${completedPlan.summary.distributed} script(s) assigned through automatic distribution.`,
            metadata: { assignedCount: completedPlan.summary.distributed },
          })
        }

        return completedPlan.summary
      },
      requestAdditionalScripts: (input) => {
        const evaluator = get().evaluators.find(
          (item) => item.id === input.evaluatorId
        )
        const validation = validateAdditionalScriptRequest({
          input,
          evaluator,
          answerSheets: get().answerSheets,
          requests: get().additionalScriptRequests,
        })
        if (!validation.success) return undefined

        const request: AdditionalScriptRequest = {
          id: createDemoId("additional-request"),
          evaluatorId: input.evaluatorId,
          requestedCount: input.requestedCount,
          status: "pending",
          reason: input.reason?.trim() || undefined,
          requestedAt: new Date().toISOString(),
        }
        set((state) => ({
          additionalScriptRequests: [
            request,
            ...state.additionalScriptRequests,
          ],
        }))
        return request
      },
      approveAdditionalScriptRequest: (requestId, reviewNote) => {
        const state = get()
        const request = state.additionalScriptRequests.find(
          (item) => item.id === requestId
        )
        const evaluator = request
          ? state.evaluators.find((item) => item.id === request.evaluatorId)
          : undefined
        const evaluatorSheets = evaluator
          ? state.answerSheets.filter(
              (answerSheet) => answerSheet.assignedEvaluatorId === evaluator.id
            )
          : []
        const evaluatorCanReceiveAdditional =
          evaluator?.status === "approved" &&
          evaluatorSheets.length > 0 &&
          evaluatorSheets.every((answerSheet) => answerSheet.status === "completed")
        if (
          !request ||
          request.status !== "pending" ||
          !evaluator ||
          !evaluatorCanReceiveAdditional
        ) {
          return undefined
        }

        const candidates = getAdditionalScriptCandidates({
          evaluator,
          requestedCount: request.requestedCount,
          scripts: state.processedScripts,
          mappings: state.scriptMappings,
          students: state.students,
          batches: state.uploadBatches,
          exams: state.exams,
          answerSheets: state.answerSheets,
        })
        const bridgeSheets: AnswerSheet[] = candidates
          .filter((candidate) => !candidate.answerSheet)
          .map((candidate) => {
            const bridgeId = `as-script-${candidate.script.id}`
            return {
              id: bridgeId,
              studentId: candidate.student.id,
              subjectId: candidate.exam.subjectId,
              examId: candidate.exam.id,
              semesterId: candidate.exam.semesterId,
              pageImages: [
                `/demo/answer-sheets/${bridgeId}/page-1.jpg`,
                `/demo/answer-sheets/${bridgeId}/page-2.jpg`,
              ],
              processedScriptId: candidate.script.id,
              status: "unassigned" as const,
            }
          })
        const answerSheetsWithBridges = [...state.answerSheets, ...bridgeSheets]
        const selectedCandidates = getAdditionalScriptCandidates({
          evaluator,
          requestedCount: request.requestedCount,
          scripts: state.processedScripts,
          mappings: state.scriptMappings,
          students: state.students,
          batches: state.uploadBatches,
          exams: state.exams,
          answerSheets: answerSheetsWithBridges,
        })
        const selectedScriptIds = new Set(
          selectedCandidates.map((candidate) => candidate.script.id)
        )
        const nextAnswerSheets = answerSheetsWithBridges.map((answerSheet) =>
          answerSheet.processedScriptId && selectedScriptIds.has(answerSheet.processedScriptId)
            ? {
                ...answerSheet,
                assignedEvaluatorId: evaluator.id,
                status: "assigned" as const,
              }
            : answerSheet
        )
        const approvedRequest: AdditionalScriptRequest = {
          ...request,
          status: "approved",
          approvedCount: selectedCandidates.length,
          reviewedAt: new Date().toISOString(),
          reviewNote: reviewNote?.trim() || undefined,
        }

        set((currentState) => ({
          answerSheets: nextAnswerSheets,
          additionalScriptRequests: currentState.additionalScriptRequests.map(
            (item) => (item.id === requestId ? approvedRequest : item)
          ),
          lastDistributionSummary: null,
        }))
        return approvedRequest
      },
      rejectAdditionalScriptRequest: (requestId, reviewNote) => {
        const request = get().additionalScriptRequests.find(
          (item) => item.id === requestId
        )
        if (!request || request.status !== "pending") return false

        set((state) => ({
          additionalScriptRequests: state.additionalScriptRequests.map((item) =>
            item.id === requestId
              ? {
                  ...item,
                  status: "rejected" as const,
                  reviewedAt: new Date().toISOString(),
                  reviewNote: reviewNote?.trim() || undefined,
                }
              : item
          ),
        }))
        return true
      },
      assignAnswerSheets: (input) => {
        const validation = validateAssignment({
          input,
          answerSheets: get().answerSheets,
          students: get().students,
          departments,
          programs,
          semesters,
          subjects,
          exams: get().exams,
          evaluators: get().evaluators,
        })

        if (!validation.success) {
          return validation
        }

        const answerSheetIdSet = new Set(validation.answerSheetIds)

        set((state) => ({
          answerSheets: state.answerSheets.map((answerSheet) =>
            answerSheetIdSet.has(answerSheet.id)
              ? {
                  ...answerSheet,
                  assignedEvaluatorId: validation.evaluatorId,
                  status: "assigned",
                }
              : answerSheet
          ),
        }))

        return validation
      },
      startEvaluationSession: ({ evaluatorId, scriptId }) => {
        const existingSession = get().evaluationSessions.find(
          (session) =>
            session.evaluatorId === evaluatorId && session.scriptId === scriptId
        )
        const blockingSession = get().evaluationSessions.find(
          (session) =>
            session.evaluatorId === evaluatorId &&
            (session.status === "active" || session.status === "interrupted")
        )

        if (blockingSession && blockingSession.scriptId !== scriptId) {
          return undefined
        }

        if (existingSession?.status === "active") {
          return existingSession
        }

        const now = new Date().toISOString()
        const nextSession: EvaluationSession = existingSession
          ? {
              ...existingSession,
              status: "active",
              resumedAt: now,
            }
          : {
              id: createDemoId("evaluation-session"),
              evaluatorId,
              scriptId,
              status: "active",
              startedAt: now,
            }

        set((state) => ({
          evaluationSessions: state.evaluationSessions.some(
            (session) => session.id === nextSession.id
          )
            ? state.evaluationSessions.map((session) =>
                session.id === nextSession.id ? nextSession : session
              )
            : [...state.evaluationSessions, nextSession],
          answerSheets: state.answerSheets.map((answerSheet) =>
            (answerSheet.processedScriptId ?? answerSheet.id) === scriptId &&
            answerSheet.assignedEvaluatorId === evaluatorId &&
            answerSheet.status === "assigned"
              ? { ...answerSheet, status: "in_progress" }
              : answerSheet
          ),
        }))

        if (!existingSession || existingSession.status === "interrupted") {
          get().addAuditLog({
            action: "evaluation_started",
            entityType: "evaluation-session",
            entityId: nextSession.id,
            scriptId,
            examId: get().answerSheets.find((sheet) => (sheet.processedScriptId ?? sheet.id) === scriptId)?.examId,
            description: `Evaluation started for ${scriptId}.`,
          })
        }

        return nextSession
      },
      resumeEvaluationSession: ({ evaluatorId, scriptId }) => {
        const session = get().evaluationSessions.find(
          (item) =>
            item.evaluatorId === evaluatorId &&
            item.scriptId === scriptId &&
            item.status === "interrupted"
        )

        return session
          ? get().startEvaluationSession({ evaluatorId, scriptId })
          : undefined
      },
      autoSaveEvaluation: (input) => {
        const savedEvaluation = get().saveEvaluationDraft(input)

        if (!savedEvaluation) {
          return undefined
        }

        const answerSheet = get().answerSheets.find(
          (item) => item.id === input.answerSheetId
        )
        const scriptId = answerSheet?.processedScriptId ?? input.answerSheetId
        const now = new Date().toISOString()

        set((state) => ({
          evaluationSessions: state.evaluationSessions.map((session) =>
            session.evaluatorId === input.evaluatorId &&
            session.scriptId === scriptId &&
            session.status === "active"
              ? { ...session, lastSavedAt: now }
              : session
          ),
        }))

        get().addAuditLog({
          action: "marks_saved",
          entityType: "evaluation",
          entityId: savedEvaluation.id,
          scriptId,
          examId: savedEvaluation.examId,
          description: `Evaluation marks saved for ${scriptId}.`,
          dedupeWindowMs: 30_000,
        })

        return savedEvaluation
      },
      interruptEvaluationSession: ({ evaluatorId, scriptId }) => {
        const session = get().evaluationSessions.find(
          (item) =>
            item.evaluatorId === evaluatorId &&
            item.scriptId === scriptId &&
            item.status === "active"
        )

        if (!session) {
          return false
        }

        set((state) => ({
          evaluationSessions: state.evaluationSessions.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  status: "interrupted",
                  interruptedAt: new Date().toISOString(),
                }
              : item
          ),
        }))

        return true
      },
      completeEvaluationSession: ({ evaluatorId, scriptId }) => {
        const session = get().evaluationSessions.find(
          (item) =>
            item.evaluatorId === evaluatorId &&
            item.scriptId === scriptId &&
            item.status === "active"
        )

        if (!session) {
          return false
        }

        set((state) => ({
          evaluationSessions: state.evaluationSessions.map((item) =>
            item.id === session.id
              ? {
                  ...item,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : item
          ),
        }))

        return true
      },
      startExceptionReview: (exceptionId) => {
        const exception = get().scriptExceptions.find(
          (item) => item.id === exceptionId
        )
        const currentUser = get().currentUser
        const reviewerId = currentUser?.role === "admin"
          ? currentUser.id
          : undefined

        if (!exception || exception.status !== "open") {
          return false
        }

        const now = new Date().toISOString()
        set((state) => ({
          scriptExceptions: state.scriptExceptions.map((item) =>
            item.id === exceptionId
              ? {
                  ...item,
                  status: "under_review",
                  reviewedAt: now,
                  reviewedBy: reviewerId,
                  updatedAt: now,
                }
              : item
          ),
        }))

        return true
      },
      resolveException: (exceptionId, resolutionNote) => {
        const exception = get().scriptExceptions.find(
          (item) => item.id === exceptionId
        )
        const note = resolutionNote.trim()
        const currentUser = get().currentUser
        const resolverId = currentUser?.role === "admin"
          ? currentUser.id
          : undefined

        if (!exception || exception.status !== "under_review" || !note) {
          return false
        }

        const now = new Date().toISOString()
        set((state) => ({
          scriptExceptions: state.scriptExceptions.map((item) =>
            item.id === exceptionId
              ? {
                  ...item,
                  status: "resolved",
                  resolutionNote: note,
                  resolvedAt: now,
                  resolvedBy: resolverId,
                  updatedAt: now,
                }
              : item
          ),
        }))

        return true
      },
      saveEvaluationDraft: (input) => {
        const validation = validateEvaluationDraftInput({
          input,
          answerSheets: get().answerSheets,
          evaluators: get().evaluators,
          questions: examQuestions,
        })

        if (!validation.success) {
          return undefined
        }

        const now = new Date().toISOString()
        const questionMarks = validation.questionMarks.map((questionMark) => ({
          ...questionMark,
        }))
        const existingEvaluation = get().evaluations.find(
          (evaluation) =>
            evaluation.answerSheetId === validation.answerSheet.id &&
            evaluation.evaluatorId === validation.evaluator.id
        )
        const draftEvaluation: Evaluation = {
          id: existingEvaluation?.id ?? createDemoId("evaluation"),
          answerSheetId: validation.answerSheet.id,
          evaluatorId: validation.evaluator.id,
          studentId: validation.answerSheet.studentId,
          subjectId: validation.answerSheet.subjectId,
          semesterId: validation.answerSheet.semesterId,
          examId: validation.answerSheet.examId,
          questionMarks,
          totalMarks: validation.totalMarks,
          status: "draft",
          startedAt: existingEvaluation?.startedAt ?? now,
        }

        set((state) => ({
          evaluations: upsertEvaluation(state.evaluations, draftEvaluation),
          answerSheets: state.answerSheets.map((item) =>
            item.id === validation.answerSheet.id
              ? {
                  ...item,
                  assignedEvaluatorId: validation.evaluator.id,
                  status: "in_progress",
                }
              : item
          ),
          evaluationSessions: state.evaluationSessions.map((session) =>
            session.evaluatorId === validation.evaluator.id &&
            session.scriptId ===
              (validation.answerSheet.processedScriptId ?? validation.answerSheet.id) &&
            session.status === "active"
              ? { ...session, lastSavedAt: now }
              : session
          ),
        }))

        return draftEvaluation
      },
      submitEvaluation: (input) => {
        const validation = validateEvaluationSubmissionInput({
          input,
          answerSheets: get().answerSheets,
          evaluators: get().evaluators,
          questions: examQuestions,
        })

        if (!validation.success) {
          return undefined
        }

        const now = new Date().toISOString()
        const existingEvaluation = get().evaluations.find(
          (evaluation) =>
            evaluation.answerSheetId === validation.answerSheet.id &&
            evaluation.evaluatorId === validation.evaluator.id
        )
        const submittedEvaluation: Evaluation = {
          id: existingEvaluation?.id ?? createDemoId("evaluation"),
          answerSheetId: validation.answerSheet.id,
          evaluatorId: validation.evaluator.id,
          studentId: validation.answerSheet.studentId,
          subjectId: validation.answerSheet.subjectId,
          semesterId: validation.answerSheet.semesterId,
          examId: validation.answerSheet.examId,
          questionMarks: validation.questionMarks.map((questionMark) => ({
            ...questionMark,
          })),
          totalMarks: validation.totalMarks,
          status: "submitted",
          startedAt: existingEvaluation?.startedAt ?? now,
          submittedAt: now,
        }

        set((state) => ({
          evaluations: upsertEvaluation(state.evaluations, submittedEvaluation),
          answerSheets: state.answerSheets.map((answerSheet) =>
            answerSheet.id === validation.answerSheet.id
              ? {
                  ...answerSheet,
                  assignedEvaluatorId: validation.evaluator.id,
                  status: "completed",
                }
              : answerSheet
          ),
        }))

        const answerSheet = get().answerSheets.find((item) => item.id === submittedEvaluation.answerSheetId)
        get().addAuditLog({
          action: "evaluation_submitted",
          entityType: "evaluation",
          entityId: submittedEvaluation.id,
          scriptId: answerSheet?.processedScriptId ?? submittedEvaluation.answerSheetId,
          examId: submittedEvaluation.examId,
          description: `Evaluation submitted for ${answerSheet?.processedScriptId ?? submittedEvaluation.answerSheetId}.`,
        })

        get().completeEvaluationSession({
          evaluatorId: validation.evaluator.id,
          scriptId:
            validation.answerSheet.processedScriptId ?? validation.answerSheet.id,
        })

        return submittedEvaluation
      },
      applyAdminAdjustment: ({ evaluationId, adjustmentMarks, reason }) => {
        const state = get()
        const currentUser = state.currentUser
        const evaluation = state.evaluations.find((item) => item.id === evaluationId)
        const answerSheet = evaluation
          ? state.answerSheets.find((item) => item.id === evaluation.answerSheetId)
          : undefined
        const subject = evaluation
          ? subjects.find((item) => item.id === evaluation.subjectId)
          : undefined
        const maximumMarks = evaluation
          ? Math.max(
              getEvaluationQuestions({
                answerSheet: answerSheet ?? {
                  id: evaluation.answerSheetId,
                  studentId: evaluation.studentId,
                  subjectId: evaluation.subjectId,
                  examId: evaluation.examId,
                  semesterId: evaluation.semesterId,
                  pageImages: [],
                  assignedEvaluatorId: evaluation.evaluatorId,
                  status: "completed",
                },
                questions: examQuestions,
              }).reduce((total, question) => total + question.maximumMarks, 0),
              subject?.maximumMarks ?? 0
            )
          : 0
        const validationError = validateAdjustmentInput({
          evaluation,
          adjustmentMarks,
          reason,
          maximumMarks,
        })

        if (currentUser?.role !== "admin" || validationError || !evaluation) {
          return undefined
        }

        const mapping = state.scriptMappings.find(
          (item) => item.studentId === evaluation.studentId && item.status === "valid"
        )
        const scriptId = answerSheet?.processedScriptId ?? mapping?.scriptId ?? evaluation.answerSheetId
        const now = new Date().toISOString()
        const existing = state.adminAdjustments.find((item) => item.evaluationId === evaluationId)
        const adjustment: AdminAdjustment = {
          id: existing?.id ?? createDemoId("admin-adjustment"),
          evaluationId,
          scriptId,
          evaluatorMarks: evaluation.totalMarks,
          adjustmentMarks,
          finalMarks: calculateFinalMarks(evaluation.totalMarks, adjustmentMarks),
          reason: reason.trim(),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
          createdBy: existing?.createdBy ?? currentUser.id,
        }

        set((currentState) => ({
          adminAdjustments: [
            ...currentState.adminAdjustments.filter((item) => item.evaluationId !== evaluationId),
            adjustment,
          ],
        }))
        get().addAuditLog({
          action: "admin_adjustment",
          entityType: "evaluation",
          entityId: evaluationId,
          scriptId,
          examId: evaluation.examId,
          description: `Administrative adjustment applied: ${evaluation.totalMarks} + ${adjustmentMarks} = ${adjustment.finalMarks}.`,
          metadata: { scriptId, evaluatorMarks: evaluation.totalMarks, adjustmentMarks, finalMarks: adjustment.finalMarks },
        })
        return adjustment
      },
      finalizeResult: (evaluationId) => {
        const evaluation = get().evaluations.find((item) => item.id === evaluationId)
        if (!evaluation || evaluation.status !== "submitted" || get().finalizedResultIds.includes(evaluationId)) return false
        set((state) => ({ finalizedResultIds: [...state.finalizedResultIds, evaluationId] }))
        get().addAuditLog({
          action: "result_finalized",
          entityType: "result",
          entityId: evaluationId,
          examId: evaluation.examId,
          scriptId: get().answerSheets.find((sheet) => sheet.id === evaluation.answerSheetId)?.processedScriptId,
          description: `Result finalized for ${evaluation.studentId}.`,
        })
        return true
      },
      setEvaluatorAvailability: (evaluatorId, availability) => {
        const evaluator = get().evaluators.find((item) => item.id === evaluatorId)
        if (!evaluator || evaluator.status !== "approved" || evaluator.availability === availability) return false
        set((state) => ({ evaluators: state.evaluators.map((item) => item.id === evaluatorId ? { ...item, availability } : item) }))
        return true
      },
      redistributeEvaluatorWork: (evaluatorId) => {
        const state = get()
        const evaluator = state.evaluators.find((item) => item.id === evaluatorId)
        if (!evaluator || evaluator.status !== "approved" || evaluator.availability !== "unavailable") return { remainingBefore: 0, redistributed: 0, stillRemaining: 0, message: "Mark an approved evaluator unavailable before redistribution." }
        const remainingSheets = getRemainingEvaluatorSheets({ evaluatorId, answerSheets: state.answerSheets, evaluations: state.evaluations })
        if (remainingSheets.length === 0) return { remainingBefore: 0, redistributed: 0, stillRemaining: 0, message: "No remaining scripts to redistribute." }
        const plan = planEvaluatorRedistribution({ unavailableEvaluatorId: evaluatorId, remainingSheets, answerSheets: state.answerSheets, evaluators: state.evaluators })
        set((currentState) => ({ answerSheets: currentState.answerSheets.map((sheet) => { const assignment = plan.assignments.find((item) => item.answerSheetId === sheet.id); return assignment ? { ...sheet, assignedEvaluatorId: assignment.evaluatorId, status: "assigned" as const } : sheet }) }))
        return { remainingBefore: remainingSheets.length, redistributed: plan.assignments.length, stillRemaining: plan.remainingSheetIds.length, message: plan.assignments.length === 0 ? "No eligible evaluator capacity available." : undefined }
      },
      startConflictReview: (conflictId) => {
        const conflict = get().operationalConflicts.find((item) => item.id === conflictId)
        if (!conflict || conflict.status !== "detected") return false
        const now = new Date().toISOString()
        set((state) => ({ operationalConflicts: state.operationalConflicts.map((item) => item.id === conflictId ? { ...item, status: "under_review", reviewedAt: now } : item) }))
        return true
      },
      resolveConflict: (conflictId, resolutionNote) => {
        const conflict = get().operationalConflicts.find((item) => item.id === conflictId)
        const note = resolutionNote.trim()
        if (!conflict || conflict.status !== "under_review" || !note) return false
        const now = new Date().toISOString()
        set((state) => ({ operationalConflicts: state.operationalConflicts.map((item) => item.id === conflictId ? { ...item, status: "resolved", resolutionNote: note, resolvedAt: now } : item) }))
        return true
      },
      resetDemo: () => {
        set(cloneInitialState())
      },
    }),
    {
      name: "osm-demo-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        demoOtpChallenge: state.demoOtpChallenge,
        evaluatorSession: state.evaluatorSession,
        universityContext: state.universityContext,
        affiliatedColleges: state.affiliatedColleges,
        collegeImport: state.collegeImport,
        nodalCentres: state.nodalCentres,
        uploaders: state.uploaders,
        uploadBatches: state.uploadBatches,
        pdfProcessingJobs: state.pdfProcessingJobs,
        processedScripts: state.processedScripts,
        scriptMappings: state.scriptMappings,
        lastDistributionSummary: state.lastDistributionSummary,
        additionalScriptRequests: state.additionalScriptRequests,
        students: state.students,
        evaluators: state.evaluators,
        answerSheets: state.answerSheets,
        evaluations: state.evaluations,
        adminAdjustments: state.adminAdjustments,
        evaluationSessions: state.evaluationSessions,
        scriptExceptions: state.scriptExceptions,
        auditLogs: state.auditLogs,
        finalizedResultIds: state.finalizedResultIds,
        operationalConflicts: state.operationalConflicts,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<OsmStoreState> | undefined

        return {
          ...currentState,
          ...persisted,
          exams: currentState.exams,
          questionPapers: currentState.questionPapers,
          markingSchemes: currentState.markingSchemes,
          examInCharges: currentState.examInCharges,
          answerSheets: persisted?.answerSheets
            ? normalizeExamReferences(persisted.answerSheets)
            : currentState.answerSheets,
          evaluations: persisted?.evaluations
            ? normalizeExamReferences(persisted.evaluations)
            : currentState.evaluations,
          adminAdjustments: persisted?.adminAdjustments ?? currentState.adminAdjustments,
          evaluationSessions: persisted?.evaluationSessions ?? currentState.evaluationSessions,
          scriptExceptions: persisted?.scriptExceptions ?? currentState.scriptExceptions,
          auditLogs: persisted?.auditLogs ?? currentState.auditLogs,
          finalizedResultIds: persisted?.finalizedResultIds ?? currentState.finalizedResultIds,
          operationalConflicts: persisted?.operationalConflicts ?? currentState.operationalConflicts,
        }
      },
      version: 1,
    }
  )
)
