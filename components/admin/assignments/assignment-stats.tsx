import { DashboardStatCard } from "@/components/admin/dashboard/dashboard-stat-card"
import type { AssignmentSummary } from "@/lib/assignments"
import {
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Inbox,
  UserCheck,
} from "lucide-react"

type AssignmentStatsProps = {
  summary: AssignmentSummary
}

export function AssignmentStats({ summary }: AssignmentStatsProps) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Assignment summary metrics"
    >
      <DashboardStatCard
        title="Unassigned Sheets"
        value={summary.unassignedSheets}
        description="Sheets ready to be distributed to approved evaluators."
        icon={Inbox}
      />
      <DashboardStatCard
        title="Active Assignments"
        value={summary.activeAssignments}
        description="Sheets currently assigned or in progress."
        icon={ClipboardCheck}
      />
      <DashboardStatCard
        title="In Progress"
        value={summary.inProgress}
        description="Assigned sheets with draft evaluation work underway."
        icon={Clock3}
      />
      <DashboardStatCard
        title="Approved Evaluators"
        value={summary.approvedEvaluators}
        description="Faculty currently eligible for new assignments."
        icon={UserCheck}
      />
      <DashboardStatCard
        title="Completed Sheets"
        value={summary.completedSheets}
        description="Completed sheets that no longer consume capacity."
        icon={FileCheck2}
      />
    </section>
  )
}
