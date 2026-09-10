"use client"

import { answerSheets as initialAnswerSheets } from "@/data/answer-sheets"
import { initialEvaluations } from "@/data/evaluations"
import { evaluators as initialEvaluators } from "@/data/evaluators"
import { exams } from "@/data/exams"
import { departments } from "@/data/departments"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { students as initialStudents } from "@/data/students"
import { subjects } from "@/data/subjects"
import { validateAnswerSheetIntakeInput } from "@/lib/answer-sheets"
import {
  validateAssignment,
  type AnswerSheetAssignmentInput,
  type AnswerSheetAssignmentResult,
} from "@/lib/assignments"
import type {
  AnswerSheet,
  AnswerSheetIntakeInput,
  Evaluation,
  EvaluationDraftInput,
  Evaluator,
  EvaluatorRegistrationInput,
  MockUser,
  Student,
} from "@/types/osm"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

type OsmStoreState = {
  currentUser: MockUser | null
  students: Student[]
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

function cloneInitialState(): OsmStoreState {
  return {
    currentUser: null,
    students: initialStudents.map((student) => ({ ...student })),
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
          exams,
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
      assignAnswerSheets: (input) => {
        const validation = validateAssignment({
          input,
          answerSheets: get().answerSheets,
          students: get().students,
          departments,
          programs,
          semesters,
          subjects,
          exams,
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
        const answerSheet = get().answerSheets.find(
          (item) => item.id === input.answerSheetId
        )
        const evaluator = get().evaluators.find(
          (item) => item.id === input.evaluatorId && item.status === "approved"
        )

        if (!answerSheet || !evaluator || answerSheet.status === "completed") {
          return undefined
        }

        const now = new Date().toISOString()
        const questionMarks = input.questionMarks.map((questionMark) => ({
          ...questionMark,
        }))
        const totalMarks = questionMarks.reduce(
          (total, questionMark) => total + questionMark.marksAwarded,
          0
        )
        const existingEvaluation = get().evaluations.find(
          (evaluation) =>
            evaluation.answerSheetId === answerSheet.id &&
            evaluation.evaluatorId === evaluator.id
        )
        const draftEvaluation: Evaluation = {
          id: existingEvaluation?.id ?? createDemoId("evaluation"),
          answerSheetId: answerSheet.id,
          evaluatorId: evaluator.id,
          studentId: answerSheet.studentId,
          subjectId: answerSheet.subjectId,
          semesterId: answerSheet.semesterId,
          examId: answerSheet.examId,
          questionMarks,
          totalMarks,
          status: "draft",
          startedAt: existingEvaluation?.startedAt ?? now,
        }

        set((state) => ({
          evaluations: existingEvaluation
            ? state.evaluations.map((evaluation) =>
                evaluation.id === existingEvaluation.id
                  ? draftEvaluation
                  : evaluation
              )
            : [...state.evaluations, draftEvaluation],
          answerSheets: state.answerSheets.map((item) =>
            item.id === answerSheet.id
              ? {
                  ...item,
                  assignedEvaluatorId: evaluator.id,
                  status: "in_progress",
                }
              : item
          ),
        }))

        return draftEvaluation
      },
      submitEvaluation: (input) => {
        const draftEvaluation = get().saveEvaluationDraft(input)

        if (!draftEvaluation) {
          return undefined
        }

        const submittedEvaluation: Evaluation = {
          ...draftEvaluation,
          status: "submitted",
          submittedAt: new Date().toISOString(),
        }

        set((state) => ({
          evaluations: state.evaluations.map((evaluation) =>
            evaluation.id === draftEvaluation.id
              ? submittedEvaluation
              : evaluation
          ),
          answerSheets: state.answerSheets.map((answerSheet) =>
            answerSheet.id === draftEvaluation.answerSheetId
              ? { ...answerSheet, status: "completed" }
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
        students: state.students,
        evaluators: state.evaluators,
        answerSheets: state.answerSheets,
        evaluations: state.evaluations,
      }),
      version: 1,
    }
  )
)
