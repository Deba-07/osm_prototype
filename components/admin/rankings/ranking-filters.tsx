"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type {
  Department,
  Exam,
  Program,
  Semester,
  Subject,
} from "@/types/osm"
import { RotateCcw, Search } from "lucide-react"

export type RankingView =
  | "university"
  | "department"
  | "semester"
  | "subject"

export type RankingFilterState = {
  searchQuery: string
  semesterId: string
  departmentId: string
  programId: string
  subjectId: string
  examId: string
}

type RankingFiltersProps = {
  activeView: RankingView
  filters: RankingFilterState
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  activeSemesterId: string
  activeDepartmentId: string
  activeSubjectId: string
  activeExamId: string
  onFiltersChange: (filters: RankingFilterState) => void
  onReset: () => void
}

function selectClassName() {
  return cn(
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
  )
}

function updateFilter(
  filters: RankingFilterState,
  key: keyof RankingFilterState,
  value: string
) {
  return {
    ...filters,
    [key]: value,
  }
}

export function RankingFilters({
  activeView,
  filters,
  departments,
  programs,
  semesters,
  subjects,
  exams,
  activeSemesterId,
  activeDepartmentId,
  activeSubjectId,
  activeExamId,
  onFiltersChange,
  onReset,
}: RankingFiltersProps) {
  const showSemester = activeView !== "subject"
  const showDepartment =
    activeView === "department" || activeView === "semester"
  const showProgram = activeView === "semester"
  const showSubjectContext = activeView === "subject"
  const filteredPrograms = filters.departmentId
    ? programs.filter((program) => program.departmentId === filters.departmentId)
    : programs
  const selectedSubject = subjects.find(
    (subject) => subject.id === activeSubjectId
  )
  const filteredExams = selectedSubject
    ? exams.filter((exam) => exam.semesterId === selectedSubject.semesterId)
    : exams

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="space-y-2 md:col-span-2 xl:col-span-1">
          <Label htmlFor="ranking-search">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="ranking-search"
              className="pl-8"
              placeholder="Student name, roll, registration"
              value={filters.searchQuery}
              onChange={(event) =>
                onFiltersChange(
                  updateFilter(filters, "searchQuery", event.target.value)
                )
              }
            />
          </div>
        </div>

        {showSemester ? (
          <div className="space-y-2">
            <Label htmlFor="ranking-semester">Semester</Label>
            <select
              id="ranking-semester"
              className={selectClassName()}
              value={activeSemesterId}
              onChange={(event) =>
                onFiltersChange(
                  updateFilter(filters, "semesterId", event.target.value)
                )
              }
            >
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showDepartment ? (
          <div className="space-y-2">
            <Label htmlFor="ranking-department">Department</Label>
            <select
              id="ranking-department"
              className={selectClassName()}
              value={
                activeView === "department"
                  ? activeDepartmentId
                  : filters.departmentId
              }
              onChange={(event) =>
                onFiltersChange({
                  ...filters,
                  departmentId: event.target.value,
                  programId: "",
                })
              }
            >
              {activeView === "semester" ? (
                <option value="">All departments</option>
              ) : null}
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showProgram ? (
          <div className="space-y-2">
            <Label htmlFor="ranking-program">Program</Label>
            <select
              id="ranking-program"
              className={selectClassName()}
              value={filters.programId}
              onChange={(event) =>
                onFiltersChange(
                  updateFilter(filters, "programId", event.target.value)
                )
              }
            >
              <option value="">All programs</option>
              {filteredPrograms.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.code}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {showSubjectContext ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="ranking-subject">Subject</Label>
              <select
                id="ranking-subject"
                className={selectClassName()}
                value={activeSubjectId}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    subjectId: event.target.value,
                    examId: "",
                  })
                }
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} | {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ranking-exam">Exam</Label>
              <select
                id="ranking-exam"
                className={selectClassName()}
                value={activeExamId}
                onChange={(event) =>
                  onFiltersChange(
                    updateFilter(filters, "examId", event.target.value)
                  )
                }
              >
                {filteredExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onReset}>
          <RotateCcw data-icon="inline-start" className="size-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  )
}
