"use client"

import { AnalyticsSummary } from "@/components/admin/rankings/analytics-summary"
import {
  DepartmentPerformance,
  SubjectPerformance,
} from "@/components/admin/rankings/performance-charts"
import {
  IncompleteRankingNotice,
  StudentRankingTable,
  SubjectRankingTable,
  formatMarks,
  formatPercentage,
} from "@/components/admin/rankings/ranking-table"
import {
  RankingFilters,
  type RankingFilterState,
  type RankingView,
} from "@/components/admin/rankings/ranking-filters"
import {
  TopPerformers,
  type TopPerformerItem,
} from "@/components/admin/rankings/top-performers"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { programs } from "@/data/programs"
import { examQuestions } from "@/data/questions"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  getDepartmentPerformanceAnalytics,
  getDepartmentRankings,
  getRankingAnalyticsSummary,
  getSemesterRankings,
  getSubjectPerformanceAnalytics,
  getSubjectRankings,
  getUniversityRankings,
  type RankingAnalyticsFilters,
  type StudentPerformanceRankingEntry,
  type StudentPerformanceRankingSet,
  type SubjectRankingEntry,
} from "@/lib/rankings"
import { deriveResultsFromEvaluations } from "@/lib/results"
import { useOsmStore } from "@/stores/osm-store"
import type { Program } from "@/types/osm"
import { useMemo, useState } from "react"

const rankingViews: Array<{ value: RankingView; label: string }> = [
  { value: "university", label: "University Toppers" },
  { value: "department", label: "Department Toppers" },
  { value: "semester", label: "Semester Toppers" },
  { value: "subject", label: "Subject Toppers" },
]

const defaultFilters: RankingFilterState = {
  searchQuery: "",
  semesterId: "sem-3",
  departmentId: "",
  programId: "",
  subjectId: "",
  examId: "",
}

function RankingsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading rankings">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-lg" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-[42rem]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

function isRankingView(value: string): value is RankingView {
  return rankingViews.some((view) => view.value === value)
}

function getDefaultSemesterId() {
  return semesters.find((semester) => semester.id === "sem-3")?.id ?? ""
}

function getActiveSubjectId({
  requestedSubjectId,
  resultSubjectIds,
}: {
  requestedSubjectId: string
  resultSubjectIds: Set<string>
}) {
  if (requestedSubjectId) {
    return requestedSubjectId
  }

  return (
    subjects.find((subject) => resultSubjectIds.has(subject.id))?.id ??
    subjects[0]?.id ??
    ""
  )
}

function getActiveExamId({
  requestedExamId,
  activeSubjectId,
  resultPairs,
}: {
  requestedExamId: string
  activeSubjectId: string
  resultPairs: Set<string>
}) {
  const selectedSubject = subjects.find(
    (subject) => subject.id === activeSubjectId
  )
  const eligibleExams = selectedSubject
    ? exams.filter(
        (exam) =>
          exam.semesterId === selectedSubject.semesterId &&
          exam.subjectId === selectedSubject.id
      )
    : exams

  if (
    requestedExamId &&
    eligibleExams.some((exam) => exam.id === requestedExamId)
  ) {
    return requestedExamId
  }

  return (
    eligibleExams.find((exam) =>
      resultPairs.has(`${activeSubjectId}:${exam.id}`)
    )?.id ??
    eligibleExams[0]?.id ??
    ""
  )
}

function makeStudentTopPerformers(
  entries: StudentPerformanceRankingEntry[]
): TopPerformerItem[] {
  return entries.slice(0, 3).map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    name: entry.studentName,
    context: `${entry.departmentCode} | ${entry.programCode}`,
    score: formatPercentage(entry.percentage),
    marks: `${formatMarks(entry.totalMarks)} / ${formatMarks(
      entry.maximumMarks
    )} marks`,
    detail: entry.completenessLabel,
  }))
}

function makeSubjectTopPerformers(
  entries: SubjectRankingEntry[]
): TopPerformerItem[] {
  return entries.slice(0, 3).map((entry) => ({
    id: entry.id,
    rank: entry.rank,
    name: entry.studentName,
    context: `${entry.departmentName} | ${entry.subjectCode}`,
    score: formatPercentage(entry.percentage),
    marks: `${formatMarks(entry.totalMarks)} / ${formatMarks(
      entry.maximumMarks
    )} marks`,
    detail: entry.examName,
  }))
}

function getStudentRankingEmptyMessage({
  totalResults,
  rankingSet,
  searchQuery,
}: {
  totalResults: number
  rankingSet: StudentPerformanceRankingSet
  searchQuery: string
}) {
  if (totalResults === 0) {
    return "No ranking data is available yet. Rankings will appear after evaluations are completed."
  }

  if (rankingSet.candidateCount > 0 && rankingSet.eligibleCount === 0) {
    return "No students currently have enough completed results for this semester ranking."
  }

  if (searchQuery.trim().length > 0) {
    return "No ranking data matches the selected filters."
  }

  return "No ranking data matches the selected filters."
}

function getSubjectRankingEmptyMessage({
  totalResults,
  subjectContextResultCount,
  searchQuery,
}: {
  totalResults: number
  subjectContextResultCount: number
  searchQuery: string
}) {
  if (totalResults === 0) {
    return "No ranking data is available yet. Rankings will appear after evaluations are completed."
  }

  if (subjectContextResultCount === 0) {
    return "No submitted results are available for this subject."
  }

  if (searchQuery.trim().length > 0) {
    return "No ranking data matches the selected filters."
  }

  return "No ranking data matches the selected filters."
}

function getAnalyticsFilters({
  activeView,
  filters,
  activeSemesterId,
  activeDepartmentId,
  activeSubjectId,
  activeExamId,
}: {
  activeView: RankingView
  filters: RankingFilterState
  activeSemesterId: string
  activeDepartmentId: string
  activeSubjectId: string
  activeExamId: string
}): RankingAnalyticsFilters {
  if (activeView === "department") {
    return {
      semesterId: activeSemesterId,
      departmentId: activeDepartmentId,
    }
  }

  if (activeView === "semester") {
    return {
      semesterId: activeSemesterId,
      departmentId: filters.departmentId || undefined,
      programId: filters.programId || undefined,
    }
  }

  if (activeView === "subject") {
    return {
      subjectId: activeSubjectId,
      examId: activeExamId,
    }
  }

  return {
    semesterId: activeSemesterId,
  }
}

function StudentRankingPanel({
  title,
  description,
  topDescription,
  rankingSet,
  emptyMessage,
}: {
  title: string
  description: string
  topDescription: string
  rankingSet: StudentPerformanceRankingSet
  emptyMessage: string
}) {
  return (
    <div className="space-y-5">
      <TopPerformers
        title={title}
        description={topDescription}
        performers={makeStudentTopPerformers(rankingSet.entries)}
        emptyMessage={emptyMessage}
      />

      <IncompleteRankingNotice entries={rankingSet.incompleteEntries} />

      <section className="space-y-3" aria-label={`${title} table`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Ranking Table</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              {rankingSet.eligibleCount} eligible
            </Badge>
            <Badge variant="outline">
              {rankingSet.incompleteCount} incomplete
            </Badge>
          </div>
        </div>
        <StudentRankingTable
          entries={rankingSet.entries}
          emptyMessage={emptyMessage}
        />
      </section>
    </div>
  )
}

function SubjectRankingPanel({
  subjectRankings,
  emptyMessage,
}: {
  subjectRankings: SubjectRankingEntry[]
  emptyMessage: string
}) {
  return (
    <div className="space-y-5">
      <TopPerformers
        title="Subject Toppers"
        description="Students ranked within the selected subject and exam only."
        performers={makeSubjectTopPerformers(subjectRankings)}
        emptyMessage={emptyMessage}
      />

      <section className="space-y-3" aria-label="Subject toppers table">
        <div className="space-y-1">
          <h3 className="text-base font-medium">Ranking Table</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Subject rankings compare submitted results from the same subject
            and exam context.
          </p>
        </div>
        <SubjectRankingTable
          entries={subjectRankings}
          emptyMessage={emptyMessage}
        />
      </section>
    </div>
  )
}

function getProgramOptions(departmentId: string): Program[] {
  if (!departmentId) {
    return programs
  }

  return programs.filter((program) => program.departmentId === departmentId)
}

export function RankingsPage() {
  const isHydrated = useOsmStoreHydrated()
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const [activeView, setActiveView] = useState<RankingView>("university")
  const [filters, setFilters] =
    useState<RankingFilterState>(defaultFilters)

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
  const resultSubjectIds = useMemo(
    () => new Set(results.map((result) => result.subjectId)),
    [results]
  )
  const resultPairs = useMemo(
    () =>
      new Set(
        results.map((result) => `${result.subjectId}:${result.examId}`)
      ),
    [results]
  )
  const activeSemesterId = filters.semesterId || getDefaultSemesterId()
  const activeDepartmentId =
    filters.departmentId || departments[0]?.id || ""
  const activeSubjectId = getActiveSubjectId({
    requestedSubjectId: filters.subjectId,
    resultSubjectIds,
  })
  const activeExamId = getActiveExamId({
    requestedExamId: filters.examId,
    activeSubjectId,
    resultPairs,
  })

  const universityRankings = useMemo(
    () =>
      getUniversityRankings({
        results,
        subjects,
        semesterId: activeSemesterId,
        searchQuery: filters.searchQuery,
      }),
    [activeSemesterId, filters.searchQuery, results]
  )
  const departmentRankings = useMemo(
    () =>
      getDepartmentRankings({
        results,
        subjects,
        departmentId: activeDepartmentId,
        semesterId: activeSemesterId,
        searchQuery: filters.searchQuery,
      }),
    [activeDepartmentId, activeSemesterId, filters.searchQuery, results]
  )
  const semesterRankings = useMemo(
    () =>
      getSemesterRankings({
        results,
        subjects,
        semesterId: activeSemesterId,
        departmentId: filters.departmentId,
        programId: filters.programId,
        searchQuery: filters.searchQuery,
      }),
    [
      activeSemesterId,
      filters.departmentId,
      filters.programId,
      filters.searchQuery,
      results,
    ]
  )
  const subjectContextRankings = useMemo(
    () =>
      getSubjectRankings({
        results,
        subjectId: activeSubjectId,
        examId: activeExamId,
      }),
    [activeExamId, activeSubjectId, results]
  )
  const subjectRankings = useMemo(
    () =>
      getSubjectRankings({
        results,
        subjectId: activeSubjectId,
        examId: activeExamId,
        searchQuery: filters.searchQuery,
      }),
    [activeExamId, activeSubjectId, filters.searchQuery, results]
  )
  const analyticsFilters = getAnalyticsFilters({
    activeView,
    filters,
    activeSemesterId,
    activeDepartmentId,
    activeSubjectId,
    activeExamId,
  })
  const analyticsSummary = useMemo(
    () =>
      getRankingAnalyticsSummary({
        results,
        filters: analyticsFilters,
      }),
    [analyticsFilters, results]
  )
  const departmentAnalytics = useMemo(
    () =>
      getDepartmentPerformanceAnalytics({
        results,
        departments,
        filters: analyticsFilters,
      }),
    [analyticsFilters, results]
  )
  const subjectAnalytics = useMemo(
    () =>
      getSubjectPerformanceAnalytics({
        results,
        subjects,
        filters: analyticsFilters,
      }),
    [analyticsFilters, results]
  )

  function handleFiltersChange(nextFilters: RankingFilterState) {
    const selectedProgram = programs.find(
      (program) => program.id === nextFilters.programId
    )
    const shouldClearProgram =
      nextFilters.departmentId &&
      selectedProgram &&
      selectedProgram.departmentId !== nextFilters.departmentId

    setFilters({
      ...nextFilters,
      programId: shouldClearProgram ? "" : nextFilters.programId,
    })
  }

  function handleResetFilters() {
    setFilters(defaultFilters)
  }

  if (!isHydrated) {
    return <RankingsPageSkeleton />
  }

  const activeSemester = semesters.find(
    (semester) => semester.id === activeSemesterId
  )
  const activeDepartment = departments.find(
    (department) => department.id === activeDepartmentId
  )
  const activeSubject = subjects.find(
    (subject) => subject.id === activeSubjectId
  )
  const activeExam = exams.find((exam) => exam.id === activeExamId)
  const selectedProgram = programs.find(
    (program) => program.id === filters.programId
  )
  const analyticsContext = [
    activeView === "subject" ? activeSubject?.code : activeSemester?.name,
    activeView === "department" ? activeDepartment?.name : null,
    activeView === "semester" && filters.departmentId
      ? departments.find((department) => department.id === filters.departmentId)
          ?.name
      : null,
    activeView === "semester" ? selectedProgram?.code : null,
    activeView === "subject" ? activeExam?.name : null,
  ]
    .filter(Boolean)
    .join(" | ")
  const universityEmptyMessage = getStudentRankingEmptyMessage({
    totalResults: results.length,
    rankingSet: universityRankings,
    searchQuery: filters.searchQuery,
  })
  const departmentEmptyMessage = getStudentRankingEmptyMessage({
    totalResults: results.length,
    rankingSet: departmentRankings,
    searchQuery: filters.searchQuery,
  })
  const semesterEmptyMessage = getStudentRankingEmptyMessage({
    totalResults: results.length,
    rankingSet: semesterRankings,
    searchQuery: filters.searchQuery,
  })
  const subjectEmptyMessage = getSubjectRankingEmptyMessage({
    totalResults: results.length,
    subjectContextResultCount: subjectContextRankings.length,
    searchQuery: filters.searchQuery,
  })

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          University Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Academic Rankings & Analytics
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Review derived topper views and academic performance analytics for{" "}
          {universityContext.academicYear}.
        </p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Rankings</CardTitle>
              <CardDescription>
                Calculated from submitted evaluation results; no manual ranks
                are stored.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Competition ranking</Badge>
              <Badge variant="outline">Weighted scores</Badge>
              <Badge variant="outline">No zero-filled gaps</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Tabs
            value={activeView}
            onValueChange={(value) => {
              const nextValue = String(value)

              if (isRankingView(nextValue)) {
                setActiveView(nextValue)
              }
            }}
          >
            <TabsList className="max-w-full justify-start overflow-x-auto">
              {rankingViews.map((view) => (
                <TabsTrigger key={view.value} value={view.value}>
                  {view.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="rounded-lg border bg-muted/20 p-4">
              <RankingFilters
                activeView={activeView}
                filters={filters}
                departments={departments}
                programs={getProgramOptions(filters.departmentId)}
                semesters={semesters}
                subjects={subjects}
                exams={exams}
                activeSemesterId={activeSemesterId}
                activeDepartmentId={activeDepartmentId}
                activeSubjectId={activeSubjectId}
                activeExamId={activeExamId}
                onFiltersChange={handleFiltersChange}
                onReset={handleResetFilters}
              />
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
              Semester rankings require completed submitted results for every
              configured subject in each student program and semester. Missing
              subject results are excluded from ranked rows, never counted as
              zero.
            </div>

            <TabsContent value="university">
              <StudentRankingPanel
                title="University Toppers"
                description="University ranking uses complete program-semester result summaries for the selected semester."
                topDescription={`Top complete student performances for ${
                  activeSemester?.name ?? "the selected semester"
                }.`}
                rankingSet={universityRankings}
                emptyMessage={universityEmptyMessage}
              />
            </TabsContent>

            <TabsContent value="department">
              <StudentRankingPanel
                title="Department Toppers"
                description="Department ranking includes only students belonging to the selected department."
                topDescription={`Top complete student performances in ${
                  activeDepartment?.name ?? "the selected department"
                } for ${activeSemester?.name ?? "the selected semester"}.`}
                rankingSet={departmentRankings}
                emptyMessage={departmentEmptyMessage}
              />
            </TabsContent>

            <TabsContent value="semester">
              <StudentRankingPanel
                title="Semester Toppers"
                description="Semester ranking can be scoped by department or program when reviewing comparable cohorts."
                topDescription={`Top complete student performances for ${
                  activeSemester?.name ?? "the selected semester"
                }.`}
                rankingSet={semesterRankings}
                emptyMessage={semesterEmptyMessage}
              />
            </TabsContent>

            <TabsContent value="subject">
              <SubjectRankingPanel
                subjectRankings={subjectRankings}
                emptyMessage={subjectEmptyMessage}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-label="Academic analytics">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-normal">
            Academic Analytics
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Weighted performance analytics for{" "}
            {analyticsContext || "the current ranking context"}.
          </p>
        </div>

        <AnalyticsSummary summary={analyticsSummary} />

        <div className="grid gap-4 xl:grid-cols-2">
          <DepartmentPerformance entries={departmentAnalytics} />
          <SubjectPerformance entries={subjectAnalytics} />
        </div>
      </section>
    </div>
  )
}
