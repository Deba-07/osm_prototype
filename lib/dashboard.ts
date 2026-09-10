import type {
  AnswerSheet,
  AnswerSheetStatus,
  Department,
  Evaluation,
  Evaluator,
  Student,
  Subject,
} from "@/types/osm"
import { answerSheetStatusLabels, answerSheetStatuses } from "@/lib/answer-sheets"

export { answerSheetStatusLabels } from "@/lib/answer-sheets"

export type AnswerSheetStatusCount = {
  status: AnswerSheetStatus
  label: string
  count: number
}

export type AdminDashboardSummary = {
  totalStudents: number
  approvedEvaluators: number
  totalSheets: number
  completedSheets: number
  completedEvaluations: number
  pendingEvaluations: number
  overallProgress: number
  statusCounts: AnswerSheetStatusCount[]
}

export type DepartmentEvaluationProgress = {
  departmentId: string
  departmentName: string
  departmentCode: string
  totalSheets: number
  completedSheets: number
  inProgressSheets: number
  assignedSheets: number
  unassignedSheets: number
  remainingSheets: number
  progress: number
}

export type EvaluatorWorkload = {
  evaluatorId: string
  name: string
  designation: string
  assignedSheets: number
  completedSheets: number
  remainingSheets: number
  inProgressSheets: number
  progress: number
}

export type RecentEvaluationActivity = {
  id: string
  title: string
  detail: string
  status: "completed" | "in_progress" | "assigned"
  timestamp?: string
}

type ActiveActivityAnswerSheet = AnswerSheet & {
  status: "in_progress" | "assigned"
}

function isActiveActivityAnswerSheet(
  answerSheet: AnswerSheet
): answerSheet is ActiveActivityAnswerSheet {
  return (
    answerSheet.status === "in_progress" || answerSheet.status === "assigned"
  )
}

function safePercentage(part: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return Math.round((part / total) * 100)
}

export function getEvaluationStatusCounts(
  answerSheets: AnswerSheet[]
): AnswerSheetStatusCount[] {
  const counts = answerSheetStatuses.reduce<Record<AnswerSheetStatus, number>>(
    (statusCounts, status) => ({
      ...statusCounts,
      [status]: 0,
    }),
    {
      completed: 0,
      in_progress: 0,
      assigned: 0,
      unassigned: 0,
    }
  )

  for (const answerSheet of answerSheets) {
    counts[answerSheet.status] += 1
  }

  return answerSheetStatuses.map((status) => ({
    status,
    label: answerSheetStatusLabels[status],
    count: counts[status],
  }))
}

export function getAdminDashboardSummary({
  students,
  evaluators,
  answerSheets,
  evaluations,
}: {
  students: Student[]
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
}): AdminDashboardSummary {
  const statusCounts = getEvaluationStatusCounts(answerSheets)
  const getStatusCount = (status: AnswerSheetStatus) =>
    statusCounts.find((item) => item.status === status)?.count ?? 0
  const completedSheets = getStatusCount("completed")
  const totalSheets = answerSheets.length

  return {
    totalStudents: students.length,
    approvedEvaluators: evaluators.filter(
      (evaluator) => evaluator.status === "approved"
    ).length,
    totalSheets,
    completedSheets,
    completedEvaluations: evaluations.filter(
      (evaluation) => evaluation.status === "submitted"
    ).length,
    pendingEvaluations: Math.max(totalSheets - completedSheets, 0),
    overallProgress: safePercentage(completedSheets, totalSheets),
    statusCounts,
  }
}

export function getDepartmentEvaluationProgress({
  departments,
  subjects,
  answerSheets,
}: {
  departments: Department[]
  subjects: Subject[]
  answerSheets: AnswerSheet[]
}): DepartmentEvaluationProgress[] {
  const subjectDepartmentId = new Map(
    subjects.map((subject) => [subject.id, subject.departmentId])
  )

  return departments.map((department) => {
    const departmentAnswerSheets = answerSheets.filter(
      (answerSheet) =>
        subjectDepartmentId.get(answerSheet.subjectId) === department.id
    )
    const completedSheets = departmentAnswerSheets.filter(
      (answerSheet) => answerSheet.status === "completed"
    ).length
    const inProgressSheets = departmentAnswerSheets.filter(
      (answerSheet) => answerSheet.status === "in_progress"
    ).length
    const assignedSheets = departmentAnswerSheets.filter(
      (answerSheet) => answerSheet.status === "assigned"
    ).length
    const unassignedSheets = departmentAnswerSheets.filter(
      (answerSheet) => answerSheet.status === "unassigned"
    ).length
    const totalSheets = departmentAnswerSheets.length

    return {
      departmentId: department.id,
      departmentName: department.name,
      departmentCode: department.code,
      totalSheets,
      completedSheets,
      inProgressSheets,
      assignedSheets,
      unassignedSheets,
      remainingSheets: Math.max(totalSheets - completedSheets, 0),
      progress: safePercentage(completedSheets, totalSheets),
    }
  })
}

export function getEvaluatorWorkload({
  evaluators,
  answerSheets,
}: {
  evaluators: Evaluator[]
  answerSheets: AnswerSheet[]
}): EvaluatorWorkload[] {
  return evaluators
    .filter((evaluator) => evaluator.status === "approved")
    .map((evaluator) => {
      const evaluatorSheets = answerSheets.filter(
        (answerSheet) => answerSheet.assignedEvaluatorId === evaluator.id
      )
      const completedSheets = evaluatorSheets.filter(
        (answerSheet) => answerSheet.status === "completed"
      ).length
      const inProgressSheets = evaluatorSheets.filter(
        (answerSheet) => answerSheet.status === "in_progress"
      ).length
      const assignedSheets = evaluatorSheets.length

      return {
        evaluatorId: evaluator.id,
        name: evaluator.name,
        designation: evaluator.designation,
        assignedSheets,
        completedSheets,
        remainingSheets: Math.max(assignedSheets - completedSheets, 0),
        inProgressSheets,
        progress: safePercentage(completedSheets, assignedSheets),
      }
    })
}

export function getRecentEvaluationActivity({
  answerSheets,
  evaluations,
  students,
  subjects,
  limit = 6,
}: {
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
  students: Student[]
  subjects: Subject[]
  limit?: number
}): RecentEvaluationActivity[] {
  const answerSheetById = new Map(
    answerSheets.map((answerSheet) => [answerSheet.id, answerSheet])
  )
  const studentById = new Map(students.map((student) => [student.id, student]))
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]))

  const completedActivities = evaluations
    .filter((evaluation) => evaluation.status === "submitted")
    .flatMap((evaluation): RecentEvaluationActivity[] => {
      const answerSheet = answerSheetById.get(evaluation.answerSheetId)
      const student = studentById.get(evaluation.studentId)
      const subject = subjectById.get(evaluation.subjectId)

      if (!answerSheet) {
        return []
      }

      return [
        {
          id: `activity-${evaluation.id}`,
          title: `Answer sheet ${answerSheet.id.toUpperCase()} completed`,
          detail: [
            subject ? `${subject.code} - ${subject.name}` : "Subject unavailable",
            student?.name,
          ]
            .filter(Boolean)
            .join(" | "),
          status: "completed",
          timestamp: evaluation.submittedAt,
        },
      ]
    })
    .sort((first, second) => {
      const firstTime = first.timestamp ? Date.parse(first.timestamp) : 0
      const secondTime = second.timestamp ? Date.parse(second.timestamp) : 0

      return secondTime - firstTime
    })

  const activeActivities = answerSheets
    .filter(isActiveActivityAnswerSheet)
    .slice(0, limit)
    .map((answerSheet) => {
      const subject = subjectById.get(answerSheet.subjectId)
      const student = studentById.get(answerSheet.studentId)
      const isInProgress = answerSheet.status === "in_progress"

      return {
        id: `activity-${answerSheet.id}`,
        title: `Answer sheet ${answerSheet.id.toUpperCase()} ${
          isInProgress ? "currently in progress" : "assigned"
        }`,
        detail: [
          subject ? `${subject.code} - ${subject.name}` : "Subject unavailable",
          student?.name,
        ]
          .filter(Boolean)
          .join(" | "),
        status: answerSheet.status,
      }
    })

  return [...completedActivities, ...activeActivities].slice(0, limit)
}
