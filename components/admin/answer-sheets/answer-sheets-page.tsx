"use client"

import { AddAnswerSheetDialog } from "@/components/admin/answer-sheets/add-answer-sheet-dialog"
import { AnswerSheetDetailsDialog } from "@/components/admin/answer-sheets/answer-sheet-details-dialog"
import { AnswerSheetFilters } from "@/components/admin/answer-sheets/answer-sheet-filters"
import { AnswerSheetStats } from "@/components/admin/answer-sheets/answer-sheet-stats"
import { AnswerSheetTable } from "@/components/admin/answer-sheets/answer-sheet-table"
import { Button } from "@/components/ui/button"
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
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  filterAnswerSheetDetails,
  getAnswerSheetStatusSummary,
  resolveAnswerSheets,
  sortAnswerSheetDetails,
  type AnswerSheetFilterState,
  type AnswerSheetSortKey,
  type SortDirection,
} from "@/lib/answer-sheets"
import { useOsmStore } from "@/stores/osm-store"
import { ChevronLeft, ChevronRight, FilePlus2 } from "lucide-react"
import { useMemo, useState } from "react"

const rowsPerPage = 10

const defaultFilters: AnswerSheetFilterState = {
  searchQuery: "",
  status: "all",
  departmentId: "",
  semesterId: "",
  subjectId: "",
  examId: "",
}

function AnswerSheetsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading answer sheets">
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
      <Skeleton className="h-[34rem]" />
    </div>
  )
}

export function AnswerSheetsPage() {
  const isHydrated = useOsmStoreHydrated()
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const createAnswerSheet = useOsmStore((state) => state.createAnswerSheet)
  const [filters, setFilters] =
    useState<AnswerSheetFilterState>(defaultFilters)
  const [sortKey, setSortKey] = useState<AnswerSheetSortKey | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAnswerSheetId, setSelectedAnswerSheetId] = useState<
    string | null
  >(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const statusSummary = useMemo(
    () => getAnswerSheetStatusSummary(answerSheets),
    [answerSheets]
  )
  const resolvedAnswerSheets = useMemo(
    () =>
      resolveAnswerSheets(answerSheets, {
        students,
        departments,
        programs,
        semesters,
        subjects,
        exams,
        evaluators,
      }),
    [answerSheets, students, evaluators]
  )
  const filteredAnswerSheets = useMemo(
    () => filterAnswerSheetDetails(resolvedAnswerSheets, filters),
    [filters, resolvedAnswerSheets]
  )
  const sortedAnswerSheets = useMemo(
    () =>
      sortAnswerSheetDetails(filteredAnswerSheets, sortKey, sortDirection),
    [filteredAnswerSheets, sortDirection, sortKey]
  )
  const totalPages = Math.max(
    Math.ceil(sortedAnswerSheets.length / rowsPerPage),
    1
  )
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * rowsPerPage
  const paginatedAnswerSheets = sortedAnswerSheets.slice(
    pageStartIndex,
    pageStartIndex + rowsPerPage
  )
  const selectedAnswerSheet =
    resolvedAnswerSheets.find(
      (row) => row.answerSheet.id === selectedAnswerSheetId
    ) ?? null

  function handleFiltersChange(nextFilters: AnswerSheetFilterState) {
    setFilters(nextFilters)
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  function handleSort(nextSortKey: AnswerSheetSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      )
    } else {
      setSortKey(nextSortKey)
      setSortDirection("asc")
    }

    setCurrentPage(1)
  }

  function handleAnswerSheetCreated() {
    setFilters(defaultFilters)
    setSortKey(null)
    setSortDirection("asc")
    setCurrentPage(1)
  }

  if (!isHydrated) {
    return <AnswerSheetsSkeleton />
  }

  const visibleStart =
    sortedAnswerSheets.length === 0 ? 0 : pageStartIndex + 1
  const visibleEnd = Math.min(
    pageStartIndex + paginatedAnswerSheets.length,
    sortedAnswerSheets.length
  )
  const emptyMessage =
    answerSheets.length === 0
      ? "No answer sheets are available yet. Add an answer sheet to begin the evaluation workflow."
      : "No answer sheets match the selected filters."

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            University Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Answer Sheet Management
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            View, filter, inspect, and simulate intake of student answer-sheet
            records for {universityContext.academicYear}.
          </p>
        </div>
        <Button type="button" onClick={() => setIsAddDialogOpen(true)}>
          <FilePlus2 data-icon="inline-start" className="size-4" />
          Add Answer Sheet
        </Button>
      </section>

      <AnswerSheetStats counts={statusSummary} />

      <Card>
        <CardHeader>
          <CardTitle>Answer-sheet records</CardTitle>
          <CardDescription>
            Existing seeded sheets and simulated intake records from the
            persisted demo store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnswerSheetFilters
            filters={filters}
            departments={departments}
            semesters={semesters}
            subjects={subjects}
            exams={exams}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          <AnswerSheetTable
            rows={paginatedAnswerSheets}
            emptyMessage={emptyMessage}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onInspect={setSelectedAnswerSheetId}
          />

          <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {visibleStart}-{visibleEnd} of{" "}
              {sortedAnswerSheets.length} answer sheets
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safeCurrentPage <= 1}
                onClick={() =>
                  setCurrentPage(Math.max(safeCurrentPage - 1, 1))
                }
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="sr-only">Previous page</span>
              </Button>
              <span className="min-w-24 text-center tabular-nums">
                Page {safeCurrentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                disabled={safeCurrentPage >= totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(safeCurrentPage + 1, totalPages))
                }
              >
                <ChevronRight className="size-4" aria-hidden="true" />
                <span className="sr-only">Next page</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnswerSheetDetailsDialog
        row={selectedAnswerSheet}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnswerSheetId(null)
          }
        }}
      />

      <AddAnswerSheetDialog
        open={isAddDialogOpen}
        answerSheets={answerSheets}
        students={students}
        departments={departments}
        programs={programs}
        semesters={semesters}
        subjects={subjects}
        exams={exams}
        createAnswerSheet={createAnswerSheet}
        onOpenChange={setIsAddDialogOpen}
        onCreated={handleAnswerSheetCreated}
      />
    </div>
  )
}
