import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { RankingAnalyticsSummary } from "@/lib/rankings"
import type { LucideIcon } from "lucide-react"
import { ClipboardCheck, Gauge, LibraryBig, Users } from "lucide-react"

type AnalyticsSummaryProps = {
  summary: RankingAnalyticsSummary
}

type AnalyticsSummaryCard = {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: AnalyticsSummaryCard) {
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

export function AnalyticsSummary({ summary }: AnalyticsSummaryProps) {
  const cards: AnalyticsSummaryCard[] = [
    {
      title: "Completed Results",
      value: summary.completedResults,
      description: "Submitted evaluations in the current analytics context.",
      icon: ClipboardCheck,
    },
    {
      title: "Students With Results",
      value: summary.studentsWithResults,
      description: "Distinct students represented by submitted results.",
      icon: Users,
    },
    {
      title: "Subjects Evaluated",
      value: summary.subjectsEvaluated,
      description: "Distinct subjects represented by submitted results.",
      icon: LibraryBig,
    },
    {
      title: "Overall Average",
      value: formatPercentage(summary.averagePercentage),
      description: "Calculated from total marks over total maximum marks.",
      icon: Gauge,
    },
  ]

  return (
    <section
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Academic analytics summary"
    >
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </section>
  )
}
