"use client"

import { DashboardStatCard } from "@/components/admin/dashboard/dashboard-stat-card"
import { DepartmentProgress } from "@/components/admin/dashboard/department-progress"
import { EvaluationProgressChart } from "@/components/admin/dashboard/evaluation-progress-chart"
import { EvaluatorWorkload } from "@/components/admin/dashboard/evaluator-workload"
import { RecentActivity } from "@/components/admin/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import {
  getAdminDashboardSummary,
  getDepartmentEvaluationProgress,
  getEvaluatorWorkload,
  getRecentEvaluationActivity,
} from "@/lib/dashboard"
import { useOsmStore } from "@/stores/osm-store"
import {
  ArrowRight,
  ClipboardList,
  FileCheck2,
  FileStack,
  Gauge,
  UserCheck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { useSyncExternalStore } from "react"

function subscribeToPersistHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useOsmStore.persist.onHydrate(onStoreChange)
  const unsubscribeFinishHydration =
    useOsmStore.persist.onFinishHydration(onStoreChange)

  return () => {
    unsubscribeHydrate()
    unsubscribeFinishHydration()
  }
}

function getClientHydrationSnapshot() {
  return useOsmStore.persist.hasHydrated()
}

function getServerHydrationSnapshot() {
  return false
}

function usePersistedStoreHydrated() {
  return useSyncExternalStore(
    subscribeToPersistHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading admin dashboard">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const isHydrated = usePersistedStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)

  if (!isHydrated) {
    return <DashboardSkeleton />
  }

  const summary = getAdminDashboardSummary({
    students,
    evaluators,
    answerSheets,
    evaluations,
  })
  const departmentProgress = getDepartmentEvaluationProgress({
    departments,
    subjects,
    answerSheets,
  })
  const evaluatorWorkloads = getEvaluatorWorkload({
    evaluators,
    answerSheets,
  })
  const recentActivity = getRecentEvaluationActivity({
    answerSheets,
    evaluations,
    students,
    subjects,
  })
  const adminName =
    currentUser?.role === "admin" ? currentUser.name : "University Admin"

  const statCards = [
    {
      title: "Total Students",
      value: summary.totalStudents,
      description: "Students in the current mock university roster.",
      icon: Users,
    },
    {
      title: "Approved Evaluators",
      value: summary.approvedEvaluators,
      description: "Faculty records currently approved for evaluation.",
      icon: UserCheck,
    },
    {
      title: "Total Answer Sheets",
      value: summary.totalSheets,
      description: "Answer sheets modeled in the demo evaluation pool.",
      icon: FileStack,
    },
    {
      title: "Completed Evaluations",
      value: summary.completedEvaluations,
      description: "Submitted evaluation records in the demo store.",
      icon: FileCheck2,
    },
    {
      title: "Pending Evaluations",
      value: summary.pendingEvaluations,
      description: "Answer sheets not yet marked completed.",
      icon: ClipboardList,
    },
    {
      title: "Evaluation Progress",
      value: `${summary.overallProgress}%`,
      description: `${summary.completedSheets}/${summary.totalSheets} answer sheets completed.`,
      icon: Gauge,
    },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Good morning, {adminName}
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            University Evaluation Overview
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Monitor answer-sheet allocation, evaluator workload, and evaluation
            progress for {universityContext.academicYear}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" render={<Link href="/admin/answer-sheets" />}>
            View Answer Sheets
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
          <Button variant="outline" render={<Link href="/admin/evaluators" />}>
            View Evaluators
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
          <Button variant="outline" render={<Link href="/admin/assignments" />}>
            View Assignments
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Button>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        aria-label="Dashboard summary metrics"
      >
        {statCards.map((statCard) => (
          <DashboardStatCard key={statCard.title} {...statCard} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <EvaluationProgressChart
          statusCounts={summary.statusCounts}
          progress={summary.overallProgress}
          totalSheets={summary.totalSheets}
        />
        <DepartmentProgress departments={departmentProgress} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <EvaluatorWorkload workloads={evaluatorWorkloads} />
        <RecentActivity activities={recentActivity} />
      </section>
    </div>
  )
}
