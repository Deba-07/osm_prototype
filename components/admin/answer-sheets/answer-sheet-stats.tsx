import { DashboardStatCard } from "@/components/admin/dashboard/dashboard-stat-card"
import type { AnswerSheetStatusSummary } from "@/lib/answer-sheets"
import {
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileStack,
  Inbox,
} from "lucide-react"

type AnswerSheetStatsProps = {
  counts: AnswerSheetStatusSummary
}

export function AnswerSheetStats({ counts }: AnswerSheetStatsProps) {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      aria-label="Answer-sheet summary metrics"
    >
      <DashboardStatCard
        title="Total Sheets"
        value={counts.total}
        description="Answer sheets currently modeled in the demo store."
        icon={FileStack}
      />
      <DashboardStatCard
        title="Unassigned"
        value={counts.unassigned}
        description="Sheets ready for the assignment workflow."
        icon={Inbox}
      />
      <DashboardStatCard
        title="Assigned"
        value={counts.assigned}
        description="Sheets owned by an approved evaluator."
        icon={ClipboardCheck}
      />
      <DashboardStatCard
        title="In Progress"
        value={counts.inProgress}
        description="Sheets with draft evaluation activity underway."
        icon={Clock3}
      />
      <DashboardStatCard
        title="Completed"
        value={counts.completed}
        description="Sheets marked complete by submitted evaluations."
        icon={FileCheck2}
      />
    </section>
  )
}
