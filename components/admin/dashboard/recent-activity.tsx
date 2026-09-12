import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  answerSheetStatusLabels,
  type RecentEvaluationActivity,
} from "@/lib/dashboard"
import type { AnswerSheetStatus } from "@/types/osm"

const statusClasses: Record<RecentEvaluationActivity["status"], string> = {
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  in_progress:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
  assigned:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
}

type RecentActivityProps = {
  activities: RecentEvaluationActivity[]
}

function formatActivityTime(timestamp?: string) {
  if (!timestamp) {
    return "Awaiting submission"
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return "Submitted"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent evaluation activity</CardTitle>
        <CardDescription>
          Latest submitted evaluations followed by active assigned sheets.
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
                    <Badge
                      variant="outline"
                      className={statusClasses[activity.status]}
                    >
                      {
                        answerSheetStatusLabels[
                          activity.status as AnswerSheetStatus
                        ]
                      }
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {activity.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No evaluation activity is available yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
