"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { EvaluatorSheetTable } from "@/components/evaluator/evaluator-sheet-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  getCurrentEvaluator,
  resolveEvaluatorSheets,
} from "@/lib/evaluator-dashboard"
import { useOsmStore } from "@/stores/osm-store"
import { useMemo } from "react"

type EvaluatorWorkPageProps = {
  mode: "assigned" | "completed"
}

function EvaluatorWorkSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading evaluator work">
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-[30rem]" />
    </div>
  )
}

export function EvaluatorWorkPage({ mode }: EvaluatorWorkPageProps) {
  const isHydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const students = useOsmStore((state) => state.students)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluator = getCurrentEvaluator(currentUser, evaluators)
  const scopedSheets = useMemo(
    () =>
      evaluator
        ? resolveEvaluatorSheets({
            answerSheets,
            evaluatorId: evaluator.id,
            relationships: {
              students,
              departments,
              programs,
              semesters,
              subjects,
              exams,
              evaluators,
            },
          })
        : [],
    [answerSheets, evaluator, evaluators, students]
  )
  const visibleSheets = useMemo(
    () =>
      scopedSheets.filter((sheet) =>
        mode === "assigned"
          ? sheet.answerSheet.status === "assigned" ||
            sheet.answerSheet.status === "in_progress"
          : sheet.answerSheet.status === "completed"
      ),
    [mode, scopedSheets]
  )

  if (!isHydrated) {
    return <EvaluatorWorkSkeleton />
  }

  if (currentUser?.role !== "evaluator" || !currentUser.evaluatorId) {
    return (
      <EvaluatorAccessState
        title="No evaluator session is active"
        description="Return to the demo login and choose an approved evaluator account to view assigned work."
      />
    )
  }

  if (!evaluator) {
    return (
      <EvaluatorAccessState
        title="Evaluator account not found"
        description="The current mock session does not match an evaluator record in the demo store."
      />
    )
  }

  if (evaluator.status !== "approved") {
    return (
      <EvaluatorAccessState
        title="Evaluator account not approved"
        description="Your evaluator account is not currently approved. University verification is required before answer sheets can be assigned."
      />
    )
  }

  const isAssignedMode = mode === "assigned"

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {evaluator.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          {isAssignedMode ? "Assigned Sheets" : "Completed Evaluations"}
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          {isAssignedMode
            ? "Active answer sheets assigned to your evaluator account."
            : "Submitted evaluations and completed answer sheets assigned to your evaluator account."}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>
            {isAssignedMode ? "Active assigned work" : "Completed work"}
          </CardTitle>
          <CardDescription>
            {isAssignedMode
              ? "Includes sheets with assigned or in-progress status."
              : "Includes only sheets with completed status and submitted evaluation timestamps when available."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EvaluatorSheetTable
            sheets={visibleSheets}
            evaluatorId={evaluator.id}
            evaluations={evaluations}
            emptyMessage={
              isAssignedMode
                ? "No answer sheets have been assigned to you yet."
                : "You have not completed any evaluations yet."
            }
            mode={isAssignedMode ? "active" : "completed"}
          />
        </CardContent>
      </Card>
    </div>
  )
}
