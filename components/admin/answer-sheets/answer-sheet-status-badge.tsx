import { Badge } from "@/components/ui/badge"
import { answerSheetStatusLabels } from "@/lib/answer-sheets"
import type { AnswerSheetStatus } from "@/types/osm"

const answerSheetStatusClassNames: Record<AnswerSheetStatus, string> = {
  unassigned:
    "border-border bg-muted/60 text-muted-foreground dark:bg-muted/40",
  assigned:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
  in_progress:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
}

export function AnswerSheetStatusBadge({
  status,
}: {
  status: AnswerSheetStatus
}) {
  return (
    <Badge variant="outline" className={answerSheetStatusClassNames[status]}>
      {answerSheetStatusLabels[status]}
    </Badge>
  )
}
