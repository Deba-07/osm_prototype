"use client"

import { answerSheets as initialAnswerSheets } from "@/data/answer-sheets"
import { initialEvaluations } from "@/data/evaluations"
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
} from "@/lib/evaluations"
import { validateUploaderRegistration } from "@/lib/uploaders"
import {
  getNextUploadBatchNumber,
  validateUploadBatchInput,
} from "@/lib/upload-batches"
import { canStartPdfProcessing } from "@/lib/pdf-processing"
import { validateScriptMapping } from "@/lib/script-mappings"
import type {
  AnswerSheet,
  AffiliatedCollege,
  AnswerSheetIntakeInput,
  CollegeImportState,
  Exam,
  ExamInCharge,
  Evaluation,
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
} from "@/types/osm"
import { universityContext as initialUniversityContext } from "@/data/university"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type OsmStoreState = {
  currentUser: MockUser | null
  universityContext: typeof initialUniversityContext
  affiliatedColleges: AffiliatedCollege[]
  collegeImport: CollegeImportState
  nodalCentres: NodalCentre[]
  uploaders: Uploader[]
  uploadBatches: UploadBatch[]
  pdfProcessingJobs: PdfProcessingJob[]
  processedScripts: ProcessedScript[]
  scriptMappings: ScriptMapping[]
  students: Student[]
  exams: Exam[]
  questionPapers: QuestionPaper[]
  markingSchemes: MarkingScheme[]
  examInCharges: ExamInCharge[]
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
}

type OsmStoreActions = {
  loginAsAdmin: () => void
  loginAsEvaluator: (evaluatorId: string) => boolean
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
  assignAnswerSheets: (
    input: AnswerSheetAssignmentInput
  ) => AnswerSheetAssignmentResult
  saveEvaluationDraft: (
    input: EvaluationDraftInput
  ) => Evaluation | undefined
  submitEvaluation: (input: EvaluationDraftInput) => Evaluation | undefined
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
        set({ currentUser: demoAdminUser })
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
        })

        return true
      },
      logout: () => {
        set({ currentUser: null })
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

        return submittedEvaluation
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
        universityContext: state.universityContext,
        affiliatedColleges: state.affiliatedColleges,
        collegeImport: state.collegeImport,
        nodalCentres: state.nodalCentres,
        uploaders: state.uploaders,
        uploadBatches: state.uploadBatches,
        pdfProcessingJobs: state.pdfProcessingJobs,
        processedScripts: state.processedScripts,
        scriptMappings: state.scriptMappings,
        students: state.students,
        evaluators: state.evaluators,
        answerSheets: state.answerSheets,
        evaluations: state.evaluations,
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
        }
      },
      version: 1,
    }
  )
)
