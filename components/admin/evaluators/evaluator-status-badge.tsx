import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EvaluatorStatus } from "@/types/osm"

export const evaluatorStatusLabels: Record<EvaluatorStatus, string> = {
  pending: "Pending Verification",
  approved: "Approved",
  rejected: "Rejected",
}

const evaluatorStatusClasses: Record<EvaluatorStatus, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected:
    "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300",
}

export function EvaluatorStatusBadge({
  status,
  className,
}: {
  status: EvaluatorStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(evaluatorStatusClasses[status], className)}
    >
      {evaluatorStatusLabels[status]}
    </Badge>
  )
}
