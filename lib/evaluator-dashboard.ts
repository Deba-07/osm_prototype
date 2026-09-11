import { resolveAnswerSheets, type ResolvedAnswerSheet } from "@/lib/answer-sheets"
import {
  MAX_ACTIVE_SHEETS_PER_EVALUATOR,
  getEvaluatorAssignmentWorkload,
} from "@/lib/assignments"
import type {
  AnswerSheet,
  Department,
  Evaluation,
  Evaluator,
  Exam,
  MockUser,
  Program,
  Semester,
  Student,
  Subject,
} from "@/types/osm"

export type EvaluatorDashboardStats = {
  totalAssigned: number
  pending: number
  inProgress: number
  completed: number
  progress: number
  activeWorkload: number
  maximumActiveWorkload: number
  availableCapacity: number
}

export type EvaluatorSubjectBreakdown = {
  subjectId: string
  subjectName: string
  subjectCode: string
  totalAssigned: number
  active: number
  pending: number
  inProgress: number
  completed: number
}

export type EvaluatorActivity = {
  id: string
  title: string
  detail: string
  status: "assigned" | "in_progress" | "completed"
  timestamp?: string
}

type EvaluatorRelationshipData = {
  students: Student[]
  departments: Department[]
  programs: Program[]
  subjects: Subject[]
  semesters: Semester[]
  exams: Exam[]
  evaluators: Evaluator[]
}

function safePercentage(part: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

export function getCurrentEvaluator(
  currentUser: MockUser | null,
  evaluators: Evaluator[]
) {
  if (currentUser?.role !== "evaluator" || !currentUser.evaluatorId) {
    return undefined
  }

  return evaluators.find((evaluator) => evaluator.id === currentUser.evaluatorId)
}

export function getEvaluatorSheets(
  answerSheets: AnswerSheet[],
  evaluatorId: string
) {
  return answerSheets.filter(
    (answerSheet) => answerSheet.assignedEvaluatorId === evaluatorId
  )
}

export function getEvaluatorActiveSheets(
  answerSheets: AnswerSheet[],
  evaluatorId: string
) {
  return getEvaluatorSheets(answerSheets, evaluatorId).filter(
    (answerSheet) =>
      answerSheet.status === "assigned" ||
      answerSheet.status === "in_progress"
  )
}

export function getEvaluatorCompletedSheets(
  answerSheets: AnswerSheet[],
  evaluatorId: string
) {
  return getEvaluatorSheets(answerSheets, evaluatorId).filter(
    (answerSheet) => answerSheet.status === "completed"
  )
}

export function resolveEvaluatorSheets({
  answerSheets,
  evaluatorId,
  relationships,
}: {
  answerSheets: AnswerSheet[]
  evaluatorId: string
  relationships: EvaluatorRelationshipData
}) {
  return resolveAnswerSheets(
    getEvaluatorSheets(answerSheets, evaluatorId),
    relationships
  )
}

export function getEvaluatorDashboardStats({
  evaluator,
  answerSheets,
}: {
  evaluator: Evaluator
  answerSheets: AnswerSheet[]
}): EvaluatorDashboardStats {
  const evaluatorSheets = getEvaluatorSheets(answerSheets, evaluator.id)
  const pending = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "assigned"
  ).length
  const inProgress = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "in_progress"
  ).length
  const completed = evaluatorSheets.filter(
    (answerSheet) => answerSheet.status === "completed"
  ).length
  const workload = getEvaluatorAssignmentWorkload({
    evaluator,
    answerSheets,
  })

  return {
    totalAssigned: evaluatorSheets.length,
    pending,
    inProgress,
    completed,
    progress: safePercentage(completed, evaluatorSheets.length),
    activeWorkload: workload.activeSheets,
    maximumActiveWorkload: MAX_ACTIVE_SHEETS_PER_EVALUATOR,
    availableCapacity: workload.availableCapacity,
  }
}

export function getEvaluationSubmittedAt({
  evaluations,
  evaluatorId,
  answerSheetId,
}: {
  evaluations: Evaluation[]
  evaluatorId: string
  answerSheetId: string
}) {
  return evaluations.find(
    (evaluation) =>
      evaluation.evaluatorId === evaluatorId &&
      evaluation.answerSheetId === answerSheetId &&
      evaluation.status === "submitted"
  )?.submittedAt
}

export function getContinueEvaluationSheet({
  sheets,
  evaluations,
  evaluatorId,
}: {
  sheets: ResolvedAnswerSheet[]
  evaluations: Evaluation[]
  evaluatorId: string
}) {
  const inProgressSheets = sheets.filter(
    (sheet) => sheet.answerSheet.status === "in_progress"
  )

  return [...inProgressSheets].sort((first, second) => {
    const firstStartedAt =
      evaluations.find(
        (evaluation) =>
          evaluation.evaluatorId === evaluatorId &&
          evaluation.answerSheetId === first.answerSheet.id
      )?.startedAt ?? ""
    const secondStartedAt =
      evaluations.find(
        (evaluation) =>
          evaluation.evaluatorId === evaluatorId &&
          evaluation.answerSheetId === second.answerSheet.id
      )?.startedAt ?? ""

    return secondStartedAt.localeCompare(firstStartedAt)
  })[0]
}

export function getEvaluatorSubjectBreakdown(
  sheets: ResolvedAnswerSheet[]
): EvaluatorSubjectBreakdown[] {
  const breakdown = new Map<string, EvaluatorSubjectBreakdown>()

  for (const sheet of sheets) {
    const subjectId = sheet.subject?.id ?? sheet.answerSheet.subjectId
    const current = breakdown.get(subjectId) ?? {
      subjectId,
      subjectName: sheet.subject?.name ?? "Subject unavailable",
      subjectCode: sheet.subject?.code ?? "Code unavailable",
      totalAssigned: 0,
      active: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
    }

    current.totalAssigned += 1

    if (sheet.answerSheet.status === "assigned") {
      current.pending += 1
      current.active += 1
    }

    if (sheet.answerSheet.status === "in_progress") {
      current.inProgress += 1
      current.active += 1
    }

    if (sheet.answerSheet.status === "completed") {
      current.completed += 1
    }

    breakdown.set(subjectId, current)
  }

  return Array.from(breakdown.values()).sort(
    (first, second) => second.active - first.active
  )
}

export function getEvaluatorRecentActivity({
  sheets,
  evaluations,
  evaluatorId,
  limit = 6,
}: {
  sheets: ResolvedAnswerSheet[]
  evaluations: Evaluation[]
  evaluatorId: string
  limit?: number
}): EvaluatorActivity[] {
  const completedActivities = sheets
    .filter((sheet) => sheet.answerSheet.status === "completed")
    .map((sheet): EvaluatorActivity => {
      const submittedAt = getEvaluationSubmittedAt({
        evaluations,
        evaluatorId,
        answerSheetId: sheet.answerSheet.id,
      })

      return {
        id: `completed-${sheet.answerSheet.id}`,
        title: `Completed ${sheet.answerSheet.id.toUpperCase()}`,
        detail: [
          sheet.subject
            ? `${sheet.subject.code} - ${sheet.subject.name}`
            : "Subject unavailable",
          sheet.exam?.name,
        ]
          .filter(Boolean)
          .join(" | "),
        status: "completed",
        timestamp: submittedAt,
      }
    })
    .sort((first, second) => {
      const firstTime = first.timestamp ? Date.parse(first.timestamp) : 0
      const secondTime = second.timestamp ? Date.parse(second.timestamp) : 0

      return secondTime - firstTime
    })

  const inProgressActivities = sheets
    .filter((sheet) => sheet.answerSheet.status === "in_progress")
    .map(
      (sheet): EvaluatorActivity => ({
        id: `in-progress-${sheet.answerSheet.id}`,
        title: `Evaluation in progress`,
        detail: [
          sheet.answerSheet.id.toUpperCase(),
          sheet.subject?.code,
          sheet.semester?.name,
        ]
          .filter(Boolean)
          .join(" | "),
        status: "in_progress",
      })
    )

  const assignedActivities = sheets
    .filter((sheet) => sheet.answerSheet.status === "assigned")
    .slice(0, limit)
    .map(
      (sheet): EvaluatorActivity => ({
        id: `assigned-${sheet.answerSheet.id}`,
        title: `Assigned ${sheet.answerSheet.id.toUpperCase()}`,
        detail: [
          sheet.subject
            ? `${sheet.subject.code} - ${sheet.subject.name}`
            : "Subject unavailable",
          sheet.exam?.name,
        ]
          .filter(Boolean)
          .join(" | "),
        status: "assigned",
      })
    )

  return [
    ...completedActivities,
    ...inProgressActivities,
    ...assignedActivities,
  ].slice(0, limit)
}
