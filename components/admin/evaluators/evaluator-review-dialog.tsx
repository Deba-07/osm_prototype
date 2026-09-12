"use client"

import {
  EvaluatorStatusBadge,
  evaluatorStatusLabels,
} from "@/components/admin/evaluators/evaluator-status-badge"
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Department, Evaluator, Subject } from "@/types/osm"
import { CheckCircle2, XCircle } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

type VerificationDecision = "approve" | "reject"

type EvaluatorReviewDialogProps = {
  evaluator: Evaluator | null
  departments: Department[]
  subjects: Subject[]
  onOpenChange: (open: boolean) => void
  onApprove: (evaluatorId: string) => void
  onReject: (evaluatorId: string) => void
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

export function EvaluatorReviewDialog({
  evaluator,
  departments,
  subjects,
  onOpenChange,
  onApprove,
  onReject,
}: EvaluatorReviewDialogProps) {
  const [decision, setDecision] = useState<VerificationDecision | null>(null)
  const department = departments.find(
    (item) => item.id === evaluator?.departmentId
  )
  const expertiseSubjects = subjects.filter((subject) =>
    evaluator?.subjectExpertise.includes(subject.id)
  )
  const isPending = evaluator?.status === "pending"

  function handleConfirmDecision() {
    if (!evaluator || !decision) {
      return
    }

    if (decision === "approve") {
      onApprove(evaluator.id)
    } else {
      onReject(evaluator.id)
    }

    setDecision(null)
  }

  return (
    <>
      <Dialog open={Boolean(evaluator)} onOpenChange={onOpenChange}>
        {evaluator ? (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review evaluator registration</DialogTitle>
              <DialogDescription>
                Review faculty details before making a verification decision.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-base font-medium">{evaluator.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {evaluator.email}
                  </p>
                </div>
                <EvaluatorStatusBadge status={evaluator.status} />
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Full Name" value={evaluator.name} />
                <DetailItem label="Email" value={evaluator.email} />
                <DetailItem label="Phone" value={evaluator.phone} />
                <DetailItem label="Faculty ID" value={evaluator.facultyId} />
                <DetailItem
                  label="Department"
                  value={department?.name ?? "Department unavailable"}
                />
                <DetailItem
                  label="Designation"
                  value={evaluator.designation}
                />
                <DetailItem
                  label="Years of Experience"
                  value={`${evaluator.experienceYears} years`}
                />
                <DetailItem
                  label="Current Status"
                  value={evaluatorStatusLabels[evaluator.status]}
                />
              </dl>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Subject Expertise</h3>
                {expertiseSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {expertiseSubjects.map((subject) => (
                      <span
                        key={subject.id}
                        className="rounded-lg border px-2.5 py-1 text-xs"
                      >
                        {subject.code} - {subject.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No subject expertise is recorded.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter showCloseButton>
              {isPending ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDecision("reject")}
                  >
                    <XCircle data-icon="inline-start" className="size-4" />
                    Reject
                  </Button>
                  <Button type="button" onClick={() => setDecision("approve")}>
                    <CheckCircle2
                      data-icon="inline-start"
                      className="size-4"
                    />
                    Approve
                  </Button>
                </>
              ) : null}
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <AlertDialog
        open={Boolean(decision)}
        onOpenChange={(open) => {
          if (!open) {
            setDecision(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "approve"
                ? "Approve evaluator?"
                : "Reject evaluator registration?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision === "approve"
                ? `${
                    evaluator?.name ?? "This evaluator"
                  } will become eligible for answer-sheet assignment.`
                : "This evaluator will not be eligible for answer-sheet assignment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={decision === "reject" ? "destructive" : "default"}
              onClick={handleConfirmDecision}
            >
              {decision === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
