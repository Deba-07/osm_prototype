import { DashboardStatCard } from "@/components/admin/dashboard/dashboard-stat-card"
import type { EvaluatorStatus } from "@/types/osm"
import { ShieldCheck, UserCheck, UserRoundX, Users } from "lucide-react"

type EvaluatorStatsProps = {
  counts: Record<"all" | EvaluatorStatus, number>
}

export function EvaluatorStats({ counts }: EvaluatorStatsProps) {
  const stats = [
    {
      title: "Total Evaluators",
      value: counts.all,
      description: "Seeded and newly registered evaluator records.",
      icon: Users,
    },
    {
      title: "Pending Verification",
      value: counts.pending,
      description: "Registrations awaiting admin decision.",
      icon: ShieldCheck,
    },
    {
      title: "Approved",
      value: counts.approved,
      description: "Eligible for future answer-sheet assignment.",
      icon: UserCheck,
    },
    {
      title: "Rejected",
      value: counts.rejected,
      description: "Not eligible for future assignment.",
      icon: UserRoundX,
    },
  ]

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Evaluator summary metrics"
    >
      {stats.map((stat) => (
        <DashboardStatCard key={stat.title} {...stat} />
      ))}
    </section>
  )
}
