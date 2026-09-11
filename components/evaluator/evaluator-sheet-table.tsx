import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { answerSheetStatusLabels } from "@/lib/answer-sheets"
import { getEvaluationSubmittedAt } from "@/lib/evaluator-dashboard"
import type { Evaluation } from "@/types/osm"
import type { ResolvedAnswerSheet } from "@/lib/answer-sheets"
import type { AnswerSheetStatus } from "@/types/osm"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

type EvaluatorSheetTableProps = {
  sheets: ResolvedAnswerSheet[]
  evaluatorId: string
  evaluations: Evaluation[]
  emptyMessage: string
  mode: "active" | "completed"
}

const statusClassNames: Record<AnswerSheetStatus, string> = {
  unassigned:
    "border-border bg-muted/60 text-muted-foreground dark:bg-muted/40",
  assigned:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
  in_progress:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  completed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
}

function formatSubmittedAt(timestamp?: string) {
  if (!timestamp) {
    return "Not available"
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function StatusBadge({ status }: { status: AnswerSheetStatus }) {
  return (
    <Badge variant="outline" className={statusClassNames[status]}>
      {answerSheetStatusLabels[status]}
    </Badge>
  )
}

export function EvaluatorSheetTable({
  sheets,
  evaluatorId,
  evaluations,
  emptyMessage,
  mode,
}: EvaluatorSheetTableProps) {
  if (sheets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sheet ID</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Exam</TableHead>
          {mode === "completed" ? <TableHead>Completed On</TableHead> : null}
          <TableHead>Status</TableHead>
          {mode === "active" ? (
            <TableHead className="text-right">Action</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sheets.map((sheet) => {
          const submittedAt = getEvaluationSubmittedAt({
            evaluations,
            evaluatorId,
            answerSheetId: sheet.answerSheet.id,
          })

          return (
            <TableRow key={sheet.answerSheet.id}>
              <TableCell className="font-medium uppercase">
                {sheet.answerSheet.id}
              </TableCell>
              <TableCell>
                <div className="min-w-56 space-y-1">
                  <p>{sheet.subject?.name ?? "Subject unavailable"}</p>
                  <p className="text-xs text-muted-foreground">
                    {sheet.subject?.code ?? "Code unavailable"}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {sheet.semester?.name ?? "Semester unavailable"}
              </TableCell>
              <TableCell>
                <div className="min-w-64 space-y-1">
                  <p>{sheet.exam?.name ?? "Exam unavailable"}</p>
                  <p className="text-xs text-muted-foreground">
                    {sheet.exam?.academicYear ?? "Academic year unavailable"}
                  </p>
                </div>
              </TableCell>
              {mode === "completed" ? (
                <TableCell>{formatSubmittedAt(submittedAt)}</TableCell>
              ) : null}
              <TableCell>
                <StatusBadge status={sheet.answerSheet.status} />
              </TableCell>
              {mode === "active" ? (
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        href={`/evaluator/evaluate/${sheet.answerSheet.id}`}
                      />
                    }
                  >
                    {sheet.answerSheet.status === "in_progress"
                      ? "Continue"
                      : "Open"}
                    <ArrowRight data-icon="inline-end" className="size-4" />
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
