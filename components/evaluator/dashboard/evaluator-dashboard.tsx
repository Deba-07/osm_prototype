"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { EvaluatorSheetTable } from "@/components/evaluator/evaluator-sheet-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import type { ResolvedAnswerSheet } from "@/lib/answer-sheets"
import {
  getContinueEvaluationSheet,
  getCurrentEvaluator,
  getEvaluatorDashboardStats,
  getEvaluatorRecentActivity,
  getEvaluatorSubjectBreakdown,
  resolveEvaluatorSheets,
  type EvaluatorActivity,
  type EvaluatorDashboardStats,
  type EvaluatorSubjectBreakdown,
} from "@/lib/evaluator-dashboard"
import { useOsmStore } from "@/stores/osm-store"
import type { Department, Evaluator } from "@/types/osm"
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Gauge,
  ListTodo,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

function EvaluatorDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading evaluator dashboard">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

function getDepartmentName(
  evaluator: Evaluator,
  evaluatorDepartments: Department[]
) {
  return (
    evaluatorDepartments.find(
      (department) => department.id === evaluator.departmentId
    )?.name ?? "Department unavailable"
  )
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
}) {
  return (
    <Card size="sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-1 text-2xl tabular-nums">
              {value}
            </CardTitle>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function EvaluatorStats({ stats }: { stats: EvaluatorDashboardStats }) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
      aria-label="Evaluator workload summary"
    >
      <StatCard
        title="Total Assigned"
        value={stats.totalAssigned}
        description="All answer sheets currently assigned to this evaluator."
        icon={BookOpenCheck}
      />
      <StatCard
        title="Pending"
        value={stats.pending}
        description="Assigned sheets that have not been started yet."
        icon={ListTodo}
      />
      <StatCard
        title="In Progress"
        value={stats.inProgress}
        description="Assigned sheets with evaluation activity underway."
        icon={Clock3}
      />
      <StatCard
        title="Completed"
        value={stats.completed}
        description="Answer sheets with submitted evaluations."
        icon={CheckCircle2}
      />
      <StatCard
        title="Progress"
        value={`${stats.progress}%`}
        description={`${stats.completed}/${stats.totalAssigned} assigned sheets completed.`}
        icon={Gauge}
      />
      <StatCard
        title="Active Workload"
        value={`${stats.activeWorkload}/${stats.maximumActiveWorkload}`}
        description={`${stats.availableCapacity} active slots remain available.`}
        icon={ClipboardList}
      />
    </section>
  )
}

function ContinueEvaluation({
  sheet,
}: {
  sheet: ResolvedAnswerSheet | undefined
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue Evaluation</CardTitle>
        <CardDescription>
          Resume the in-progress answer sheet assigned to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sheet ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/25 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-base font-medium uppercase">
                    {sheet.answerSheet.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {sheet.subject?.name ?? "Subject unavailable"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sheet.subject?.code ?? "Code unavailable"} |{" "}
                    {sheet.semester?.name ?? "Semester unavailable"} |{" "}
                    {sheet.exam?.name ?? "Exam unavailable"}
                  </p>
                </div>
                <Badge variant="outline">In Progress</Badge>
              </div>
            </div>
            <Button
              render={<Link href={`/evaluator/evaluate/${sheet.answerSheet.id}`} />}
            >
              Continue Evaluation
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No evaluations are currently in progress.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function NextAssignedWork({
  sheets,
  evaluatorId,
  evaluations,
}: {
  sheets: Parameters<typeof EvaluatorSheetTable>[0]["sheets"]
  evaluatorId: string
  evaluations: Parameters<typeof EvaluatorSheetTable>[0]["evaluations"]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Next Assigned Sheets</CardTitle>
            <CardDescription>
              Pending sheets ready for question-wise evaluation.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/evaluator/assigned" />}>
            View all
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <EvaluatorSheetTable
          sheets={sheets}
          evaluatorId={evaluatorId}
          evaluations={evaluations}
          emptyMessage="You have no pending assigned answer sheets."
          mode="active"
        />
      </CardContent>
    </Card>
  )
}

function RecentActivityList({ activities }: { activities: EvaluatorActivity[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Work</CardTitle>
        <CardDescription>
          Evaluator-specific activity derived from assigned sheets and
          submitted evaluations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <ol className="space-y-4">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <Badge variant="outline">
                      {activity.status === "in_progress"
                        ? "In Progress"
                        : activity.status === "completed"
                          ? "Completed"
                          : "Assigned"}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {activity.detail}
                  </p>
                  {activity.timestamp ? (
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(activity.timestamp))}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No recent evaluator activity is available yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SubjectWorkload({
  breakdown,
}: {
  breakdown: EvaluatorSubjectBreakdown[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Breakdown</CardTitle>
        <CardDescription>
          Assigned work grouped by subject for this evaluator.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {breakdown.length > 0 ? (
          <div className="space-y-4">
            {breakdown.map((subject) => (
              <div key={subject.subjectId} className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{subject.subjectName}</p>
                    <p className="text-xs text-muted-foreground">
                      {subject.subjectCode}
                    </p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {subject.active} active
                  </Badge>
                </div>
                <Progress
                  value={
                    subject.totalAssigned > 0
                      ? Math.round(
                          (subject.completed / subject.totalAssigned) * 100
                        )
                      : 0
                  }
                  aria-label={`${subject.subjectName} completion progress`}
                />
                <p className="text-xs text-muted-foreground">
                  {subject.pending} pending | {subject.inProgress} in progress |{" "}
                  {subject.completed} completed
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No answer sheets have been assigned to you yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function EvaluatorDashboard() {
  const isHydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const students = useOsmStore((state) => state.students)
  const evaluations = useOsmStore((state) => state.evaluations)

  const evaluator = getCurrentEvaluator(currentUser, evaluators)

  const evaluatorSheets = useMemo(
    () =>
      evaluator
        ? resolveEvaluatorSheets({
            answerSheets,
            evaluatorId: evaluator.id,
            relationships: {
              students,
              departments,
              programs,
              semesters,
              subjects,
              exams,
              evaluators,
            },
          })
        : [],
    [answerSheets, evaluator, evaluators, students]
  )
  const stats = useMemo(
    () =>
      evaluator
        ? getEvaluatorDashboardStats({ evaluator, answerSheets })
        : null,
    [answerSheets, evaluator]
  )
  const continueSheet = useMemo(
    () =>
      evaluator
        ? getContinueEvaluationSheet({
            sheets: evaluatorSheets,
            evaluations,
            evaluatorId: evaluator.id,
          })
        : undefined,
    [evaluations, evaluator, evaluatorSheets]
  )
  const pendingSheets = useMemo(
    () =>
      evaluatorSheets
        .filter((sheet) => sheet.answerSheet.status === "assigned")
        .slice(0, 5),
    [evaluatorSheets]
  )
  const recentActivity = useMemo(
    () =>
      evaluator
        ? getEvaluatorRecentActivity({
            sheets: evaluatorSheets,
            evaluations,
            evaluatorId: evaluator.id,
          })
        : [],
    [evaluations, evaluator, evaluatorSheets]
  )
  const subjectBreakdown = useMemo(
    () => getEvaluatorSubjectBreakdown(evaluatorSheets),
    [evaluatorSheets]
  )

  if (!isHydrated) {
    return <EvaluatorDashboardSkeleton />
  }

  if (currentUser?.role !== "evaluator" || !currentUser.evaluatorId) {
    return (
      <EvaluatorAccessState
        title="No evaluator session is active"
        description="Return to the demo login and choose an approved evaluator account to view assigned work."
      />
    )
  }

  if (!evaluator) {
    return (
      <EvaluatorAccessState
        title="Evaluator account not found"
        description="The current mock session does not match an evaluator record in the demo store."
      />
    )
  }

  if (evaluator.status !== "approved") {
    return (
      <EvaluatorAccessState
        title="Evaluator account not approved"
        description="Your evaluator account is not currently approved. University verification is required before answer sheets can be assigned."
      />
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Welcome, {evaluator.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Your Evaluation Dashboard
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Review assigned answer sheets and track your evaluation progress for{" "}
            {getDepartmentName(evaluator, departments)}.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/evaluator/assigned" />}>
          View Assigned Work
          <ArrowRight data-icon="inline-end" className="size-4" />
        </Button>
      </section>

      <EvaluatorStats stats={stats} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ContinueEvaluation sheet={continueSheet} />
        <SubjectWorkload breakdown={subjectBreakdown} />
      </section>

      <NextAssignedWork
        sheets={pendingSheets}
        evaluatorId={evaluator.id}
        evaluations={evaluations}
      />

      <RecentActivityList activities={recentActivity} />
    </div>
  )
}
