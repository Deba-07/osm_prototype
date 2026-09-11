"use client"

import { ResultDetails } from "@/components/admin/results/result-details"
import { ResultFilters } from "@/components/admin/results/result-filters"
import { ResultStats } from "@/components/admin/results/result-stats"
import { ResultsTable } from "@/components/admin/results/results-table"
import { StudentResultView } from "@/components/admin/results/student-result-view"
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
import { examQuestions } from "@/data/questions"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  deriveResultsFromEvaluations,
  filterResults,
  getResultSummary,
  sortResults,
  type ResultFilterState,
  type ResultSortKey,
  type SortDirection,
} from "@/lib/results"
import { useOsmStore } from "@/stores/osm-store"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

const rowsPerPage = 10

const defaultFilters: ResultFilterState = {
  searchQuery: "",
  departmentId: "",
  programId: "",
  semesterId: "",
  subjectId: "",
  examId: "",
}

function ResultsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading results">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[36rem]" />
      <Skeleton className="h-[28rem]" />
    </div>
  )
}

export function ResultsPage() {
  const isHydrated = useOsmStoreHydrated()
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const [filters, setFilters] = useState<ResultFilterState>(defaultFilters)
  const [sortKey, setSortKey] = useState<ResultSortKey>("submittedAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState("")

  const results = useMemo(
    () =>
      deriveResultsFromEvaluations({
        evaluations,
        students,
        subjects,
        exams,
        questions: examQuestions,
        answerSheets,
        departments,
        programs,
        semesters,
        evaluators,
      }),
    [answerSheets, evaluations, evaluators, students]
  )
  const summary = useMemo(() => getResultSummary(results), [results])
  const filteredResults = useMemo(
    () => filterResults(results, filters),
    [filters, results]
  )
  const sortedResults = useMemo(
    () => sortResults(filteredResults, sortKey, sortDirection),
    [filteredResults, sortDirection, sortKey]
  )
  const totalPages = Math.max(Math.ceil(sortedResults.length / rowsPerPage), 1)
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStartIndex = (safeCurrentPage - 1) * rowsPerPage
  const paginatedResults = sortedResults.slice(
    pageStartIndex,
    pageStartIndex + rowsPerPage
  )
  const selectedResult =
    results.find((result) => result.id === selectedResultId) ?? null

  function handleFiltersChange(nextFilters: ResultFilterState) {
    setFilters(nextFilters)
    setCurrentPage(1)
  }

  function handleResetFilters() {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  function handleSort(nextSortKey: ResultSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      )
    } else {
      setSortKey(nextSortKey)
      setSortDirection(nextSortKey === "submittedAt" ? "desc" : "asc")
    }

    setCurrentPage(1)
  }

  function handleViewResult(resultId: string) {
    const result = results.find((item) => item.id === resultId)

    if (result) {
      setSelectedStudentId(result.studentId)
    }

    setSelectedResultId(resultId)
  }

  if (!isHydrated) {
    return <ResultsPageSkeleton />
  }

  const visibleStart = sortedResults.length === 0 ? 0 : pageStartIndex + 1
  const visibleEnd = Math.min(
    pageStartIndex + paginatedResults.length,
    sortedResults.length
  )
  const emptyMessage =
    results.length === 0
      ? "No completed evaluation results are available yet. Results will appear after evaluators submit their evaluations."
      : "No results match the selected filters."

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          University Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Academic Results
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Explore submitted evaluation results, question-wise marks, and
          student semester performance for {universityContext.academicYear}.
        </p>
      </section>

      <ResultStats summary={summary} />

      <Card>
        <CardHeader>
          <CardTitle>Completed Evaluation Results</CardTitle>
          <CardDescription>
            Read-only academic results derived from submitted evaluations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResultFilters
            filters={filters}
            departments={departments}
            programs={programs}
            semesters={semesters}
            subjects={subjects}
            exams={exams}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          <ResultsTable
            results={paginatedResults}
            emptyMessage={emptyMessage}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewResult={handleViewResult}
          />

          <div className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {visibleStart}-{visibleEnd} of {sortedResults.length}{" "}
              results
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

      <StudentResultView
        results={results}
        selectedStudentId={selectedStudentId}
        onSelectedStudentIdChange={setSelectedStudentId}
        onViewResult={handleViewResult}
      />

      <ResultDetails
        result={selectedResult}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedResultId(null)
          }
        }}
      />
    </div>
  )
}
