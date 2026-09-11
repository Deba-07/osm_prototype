"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DerivedResult } from "@/lib/results"
import type { ReactNode } from "react"

type ResultDetailsProps = {
  result: DerivedResult | null
  onOpenChange: (open: boolean) => void
}

function formatMarks(value: number | null) {
  if (value === null) {
    return "Not available"
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
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

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export function ResultDetails({ result, onOpenChange }: ResultDetailsProps) {
  return (
    <Dialog open={Boolean(result)} onOpenChange={onOpenChange}>
      {result ? (
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Result Details</DialogTitle>
            <DialogDescription>
              Read-only result derived from the submitted evaluation record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-medium">{result.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  {result.rollNumber} | {result.subjectCode} |{" "}
                  {result.semesterName}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatMarks(result.totalMarks)} /{" "}
                  {formatMarks(result.maximumMarks)}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {formatPercentage(result.percentage)}
                </p>
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Student Information</h3>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Name" value={result.studentName} />
                <DetailItem label="Roll Number" value={result.rollNumber} />
                <DetailItem
                  label="Registration Number"
                  value={result.registrationNumber}
                />
                <DetailItem label="Department" value={result.departmentName} />
                <DetailItem label="Program" value={result.programName} />
                <DetailItem label="Semester" value={result.semesterName} />
              </dl>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Examination</h3>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Subject" value={result.subjectName} />
                <DetailItem label="Subject Code" value={result.subjectCode} />
                <DetailItem label="Exam" value={result.examName} />
                <DetailItem label="Academic Year" value={result.academicYear} />
                <DetailItem
                  label="Evaluator"
                  value={`${result.evaluatorName} | ${result.evaluatorDesignation}`}
                />
                <DetailItem
                  label="Submitted On"
                  value={formatSubmittedAt(result.submittedAt)}
                />
                <DetailItem
                  label="Answer Sheet ID"
                  value={
                    <span className="uppercase">{result.answerSheetId}</span>
                  }
                />
              </dl>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-medium">Question-wise Marks</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.questionMarks.map((questionMark) => (
                    <TableRow key={questionMark.questionId}>
                      <TableCell>
                        Question {questionMark.questionNumber}
                      </TableCell>
                      <TableCell>
                        {questionMark.isConfigured
                          ? "Configured"
                          : "Question reference unavailable"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMarks(questionMark.marksAwarded)} /{" "}
                        {formatMarks(questionMark.maximumMarks)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>

            <div className="grid gap-4 rounded-lg border bg-muted/25 p-4 sm:grid-cols-2">
              <DetailItem
                label="Total"
                value={`${formatMarks(result.totalMarks)} / ${formatMarks(
                  result.maximumMarks
                )}`}
              />
              <DetailItem
                label="Percentage"
                value={formatPercentage(result.percentage)}
              />
            </div>
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
