"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { ResultFilterState } from "@/lib/results"
import type {
  Department,
  Exam,
  Program,
  Semester,
  Subject,
} from "@/types/osm"
import { RotateCcw, Search } from "lucide-react"
import { useMemo } from "react"

type ResultFiltersProps = {
  filters: ResultFilterState
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  onFiltersChange: (filters: ResultFilterState) => void
  onReset: () => void
}

function updateFilter(
  filters: ResultFilterState,
  key: keyof ResultFilterState,
  value: string
) {
  return {
    ...filters,
    [key]: value,
  }
}

function selectClassName() {
  return cn(
    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
  )
}

export function ResultFilters({
  filters,
  departments,
  programs,
  semesters,
  subjects,
  exams,
  onFiltersChange,
  onReset,
}: ResultFiltersProps) {
  const filteredExams = useMemo(
    () =>
      exams.filter((exam) => {
        const matchesSemester =
          filters.semesterId.length === 0 ||
          exam.semesterId === filters.semesterId
        const matchesSubject =
          filters.subjectId.length === 0 || exam.subjectId === filters.subjectId

        return matchesSemester && matchesSubject
      }),
    [exams, filters.semesterId, filters.subjectId]
  )

  function handleSemesterChange(value: string) {
    onFiltersChange({
      ...filters,
      semesterId: value,
      examId: "",
    })
  }

  function handleSubjectChange(value: string) {
    onFiltersChange({
      ...filters,
      subjectId: value,
      examId: "",
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(5,minmax(150px,1fr))]">
        <div className="space-y-2">
          <Label htmlFor="result-search">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="result-search"
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

        <div className="space-y-2">
          <Label htmlFor="result-department">Department</Label>
          <select
            id="result-department"
            className={selectClassName()}
            value={filters.departmentId}
            onChange={(event) =>
              onFiltersChange(
                updateFilter(filters, "departmentId", event.target.value)
              )
            }
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-program">Program</Label>
          <select
            id="result-program"
            className={selectClassName()}
            value={filters.programId}
            onChange={(event) =>
              onFiltersChange(
                updateFilter(filters, "programId", event.target.value)
              )
            }
          >
            <option value="">All programs</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-semester">Semester</Label>
          <select
            id="result-semester"
            className={selectClassName()}
            value={filters.semesterId}
            onChange={(event) => handleSemesterChange(event.target.value)}
          >
            <option value="">All semesters</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-subject">Subject</Label>
          <select
            id="result-subject"
            className={selectClassName()}
            value={filters.subjectId}
            onChange={(event) => handleSubjectChange(event.target.value)}
          >
            <option value="">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="result-exam">Exam</Label>
          <select
            id="result-exam"
            className={selectClassName()}
            value={filters.examId}
            onChange={(event) =>
              onFiltersChange(updateFilter(filters, "examId", event.target.value))
            }
          >
            <option value="">All exams</option>
            {filteredExams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>
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
