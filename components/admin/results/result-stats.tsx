import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ResultSummary } from "@/lib/results"
import type { LucideIcon } from "lucide-react"
import { ClipboardCheck, Gauge, LibraryBig, Users } from "lucide-react"

type ResultStatsProps = {
  summary: ResultSummary
}

type StatItem = {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function ResultStatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatItem) {
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

export function ResultStats({ summary }: ResultStatsProps) {
  const statItems: StatItem[] = [
    {
      title: "Completed Results",
      value: summary.completedResults,
      description: "Submitted evaluations available as derived results.",
      icon: ClipboardCheck,
    },
    {
      title: "Students Evaluated",
      value: summary.studentsEvaluated,
      description: "Students with at least one completed result.",
      icon: Users,
    },
    {
      title: "Subjects Evaluated",
      value: summary.subjectsEvaluated,
      description: "Subjects represented in submitted evaluations.",
      icon: LibraryBig,
    },
    {
      title: "Average Score",
      value: formatPercentage(summary.averagePercentage),
      description: "Weighted by obtained marks over maximum marks.",
      icon: Gauge,
    },
  ]

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Results summary metrics"
    >
      {statItems.map((item) => (
        <ResultStatCard key={item.title} {...item} />
      ))}
    </section>
  )
}
