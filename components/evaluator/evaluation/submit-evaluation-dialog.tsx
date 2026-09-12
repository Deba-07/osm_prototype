"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2 } from "lucide-react"

type SubmitEvaluationDialogProps = {
  open: boolean
  studentName: string
  subjectName: string
  evaluatedQuestions: number
  totalQuestions: number
  totalMarks: string
  maximumMarks: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

function SummaryItem({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  )
}

export function SubmitEvaluationDialog({
  open,
  studentName,
  subjectName,
  evaluatedQuestions,
  totalQuestions,
  totalMarks,
  maximumMarks,
  onOpenChange,
  onConfirm,
}: SubmitEvaluationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <AlertDialogTitle>Submit Evaluation?</AlertDialogTitle>
          <AlertDialogDescription>
            Once submitted, this evaluation becomes read-only in the current
            prototype.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <dl className="grid gap-4 rounded-lg border bg-muted/25 p-4 sm:grid-cols-2">
          <SummaryItem label="Student" value={studentName} />
          <SummaryItem label="Subject" value={subjectName} />
          <SummaryItem
            label="Questions Evaluated"
            value={`${evaluatedQuestions} / ${totalQuestions}`}
          />
          <SummaryItem
            label="Final Score"
            value={`${totalMarks} / ${maximumMarks}`}
          />
        </dl>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Submit Evaluation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
