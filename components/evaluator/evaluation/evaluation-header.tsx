import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { answerSheetStatusLabels } from "@/lib/answer-sheets"
import type { EvaluationCompletion } from "@/lib/evaluations"
import type { ResolvedAnswerSheet } from "@/lib/answer-sheets"
import type { AnswerSheetStatus } from "@/types/osm"

type EvaluationHeaderProps = {
  details: ResolvedAnswerSheet
  totalMarks: number
  maximumMarks: number
  completion: EvaluationCompletion
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

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function ContextItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium">{value}</dd>
    </div>
  )
}

export function EvaluationHeader({
  details,
  totalMarks,
  maximumMarks,
  completion,
}: EvaluationHeaderProps) {
  const { answerSheet } = details
  const contextItems = [
    {
      label: "Answer Sheet ID",
      value: answerSheet.id.toUpperCase(),
    },
    {
      label: "Student Name",
      value: details.student?.name ?? "Student unavailable",
    },
    {
      label: "Roll Number",
      value: details.student?.rollNumber ?? "Roll number unavailable",
    },
    {
      label: "Registration Number",
      value:
        details.student?.registrationNumber ??
        "Registration number unavailable",
    },
    {
      label: "Department",
      value: details.department?.name ?? "Department unavailable",
    },
    {
      label: "Program",
      value: details.program?.name ?? "Program unavailable",
    },
    {
      label: "Semester",
      value: details.semester?.name ?? "Semester unavailable",
    },
    {
      label: "Subject",
      value: details.subject?.name ?? "Subject unavailable",
    },
    {
      label: "Subject Code",
      value: details.subject?.code ?? "Subject code unavailable",
    },
    {
      label: "Exam",
      value: details.exam?.name ?? "Exam unavailable",
    },
    {
      label: "Academic Year",
      value: details.exam?.academicYear ?? "Academic year unavailable",
    },
    {
      label: "Current Status",
      value: answerSheetStatusLabels[answerSheet.status],
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={statusClassNames[answerSheet.status]}
              >
                {answerSheetStatusLabels[answerSheet.status]}
              </Badge>
              <Badge variant="secondary" className="tabular-nums">
                {completion.evaluatedQuestions}/{completion.totalQuestions}{" "}
                saved questions evaluated
              </Badge>
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              {details.subject?.name ?? "Evaluation Workspace"}
            </CardTitle>
            <CardDescription>
              {details.student?.name ?? "Student unavailable"} |{" "}
              {details.exam?.name ?? "Exam unavailable"}
            </CardDescription>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Saved Total
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {formatMarks(totalMarks)} / {formatMarks(maximumMarks)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contextItems.map((item) => (
            <ContextItem
              key={item.label}
              label={item.label}
              value={item.value}
            />
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
