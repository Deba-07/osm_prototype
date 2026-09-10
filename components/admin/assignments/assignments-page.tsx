"use client"

import { AssignmentStats } from "@/components/admin/assignments/assignment-stats"
import { CreateAssignmentDialog } from "@/components/admin/assignments/create-assignment-dialog"
import { EvaluatorWorkloadOverview } from "@/components/admin/assignments/evaluator-workload-overview"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  getAssignmentSummary,
  getEvaluatorAssignmentWorkloads,
} from "@/lib/assignments"
import { useOsmStore } from "@/stores/osm-store"
import { ClipboardCheck } from "lucide-react"
import { useMemo, useState } from "react"

function AssignmentsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading assignments">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[30rem]" />
    </div>
  )
}

export function AssignmentsPage() {
  const isHydrated = useOsmStoreHydrated()
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const assignAnswerSheets = useOsmStore((state) => state.assignAnswerSheets)
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const summary = useMemo(
    () => getAssignmentSummary({ answerSheets, evaluators }),
    [answerSheets, evaluators]
  )
  const workloads = useMemo(
    () => getEvaluatorAssignmentWorkloads({ evaluators, answerSheets }),
    [answerSheets, evaluators]
  )

  if (!isHydrated) {
    return <AssignmentsSkeleton />
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            University Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Answer Sheet Assignments
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Assign eligible unassigned answer sheets to approved evaluators for{" "}
            {universityContext.academicYear}.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setIsAssignmentDialogOpen(true)}
        >
          <ClipboardCheck data-icon="inline-start" className="size-4" />
          Assign Answer Sheets
        </Button>
      </section>

      <AssignmentStats summary={summary} />

      <EvaluatorWorkloadOverview
        workloads={workloads}
        departments={departments}
        subjects={subjects}
      />

      <CreateAssignmentDialog
        open={isAssignmentDialogOpen}
        answerSheets={answerSheets}
        students={students}
        evaluators={evaluators}
        departments={departments}
        programs={programs}
        semesters={semesters}
        subjects={subjects}
        exams={exams}
        assignAnswerSheets={assignAnswerSheets}
        onOpenChange={setIsAssignmentDialogOpen}
      />
    </div>
  )
}
