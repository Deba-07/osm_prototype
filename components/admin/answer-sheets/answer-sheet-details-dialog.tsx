"use client"

import { AnswerSheetStatusBadge } from "@/components/admin/answer-sheets/answer-sheet-status-badge"
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
  answerSheetStatusLabels,
  type ResolvedAnswerSheet,
} from "@/lib/answer-sheets"
import { FileText } from "lucide-react"
import type { ReactNode } from "react"

type AnswerSheetDetailsDialogProps = {
  row: ResolvedAnswerSheet | null
  onOpenChange: (open: boolean) => void
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

export function AnswerSheetDetailsDialog({
  row,
  onOpenChange,
}: AnswerSheetDetailsDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      {row ? (
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Answer Sheet Details</DialogTitle>
            <DialogDescription>
              Inspect the academic record, assignment state, and modeled scan
              page count for this answer sheet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-medium uppercase">
                  {row.answerSheet.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {row.subject?.code ?? "Subject code unavailable"} |{" "}
                  {row.student?.rollNumber ?? "Roll number unavailable"}
                </p>
              </div>
              <AnswerSheetStatusBadge status={row.answerSheet.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem
                label="Answer Sheet ID"
                value={<span className="uppercase">{row.answerSheet.id}</span>}
              />
              <DetailItem
                label="Student"
                value={row.student?.name ?? "Student unavailable"}
              />
              <DetailItem
                label="Roll Number"
                value={row.student?.rollNumber ?? "Roll number unavailable"}
              />
              <DetailItem
                label="Registration Number"
                value={
                  row.student?.registrationNumber ??
                  "Registration number unavailable"
                }
              />
              <DetailItem
                label="Department"
                value={row.department?.name ?? "Department unavailable"}
              />
              <DetailItem
                label="Program"
                value={row.program?.name ?? "Program unavailable"}
              />
              <DetailItem
                label="Semester"
                value={row.semester?.name ?? "Semester unavailable"}
              />
              <DetailItem
                label="Subject"
                value={row.subject?.name ?? "Subject unavailable"}
              />
              <DetailItem
                label="Subject Code"
                value={row.subject?.code ?? "Code unavailable"}
              />
              <DetailItem
                label="Exam"
                value={row.exam?.name ?? "Exam unavailable"}
              />
              <DetailItem
                label="Academic Year"
                value={row.exam?.academicYear ?? "Academic year unavailable"}
              />
              <DetailItem
                label="Current Status"
                value={answerSheetStatusLabels[row.answerSheet.status]}
              />
              <DetailItem
                label="Assigned Evaluator"
                value={
                  row.evaluator?.name ??
                  (row.answerSheet.assignedEvaluatorId
                    ? "Evaluator unavailable"
                    : "Not assigned")
                }
              />
              <DetailItem
                label="Number of Scanned Pages"
                value={row.pageCount}
              />
            </dl>

            <Separator />

            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">
                  Scanned Answer Sheet Preview
                </h3>
                <p className="text-sm text-muted-foreground">
                  Demo scan assets have not been added yet.
                </p>
              </div>
              <div className="rounded-lg border border-dashed bg-muted/20 p-6 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                  <FileText className="size-5" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-medium">
                  Scan preview unavailable
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  {row.pageCount > 0
                    ? `${row.pageCount} modeled scan pages are recorded for this sheet, but static demo images are not present in this prototype.`
                    : "This simulated intake record has no persisted scan assets yet."}
                </p>
              </div>
            </section>
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
