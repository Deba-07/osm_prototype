"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  answerSheetStatusLabels,
  answerSheetStatuses,
  type AnswerSheetFilterState,
} from "@/lib/answer-sheets"
import { cn } from "@/lib/utils"
import type { Department, Exam, Semester, Subject } from "@/types/osm"
import { RotateCcw, Search } from "lucide-react"
import { useMemo } from "react"

type AnswerSheetFiltersProps = {
  filters: AnswerSheetFilterState
  departments: Department[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  onFiltersChange: (filters: AnswerSheetFilterState) => void
  onReset: () => void
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function AnswerSheetFilters({
  filters,
  departments,
  semesters,
  subjects,
  exams,
  onFiltersChange,
  onReset,
}: AnswerSheetFiltersProps) {
  const filteredSubjects = useMemo(
    () =>
      subjects.filter((subject) => {
        const matchesDepartment =
          filters.departmentId.length === 0 ||
          subject.departmentId === filters.departmentId
        const matchesSemester =
          filters.semesterId.length === 0 ||
          subject.semesterId === filters.semesterId

        return matchesDepartment && matchesSemester
      }),
    [filters.departmentId, filters.semesterId, subjects]
  )
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

  function setFilter<Key extends keyof AnswerSheetFilterState>(
    key: Key,
    value: AnswerSheetFilterState[Key]
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  function handleDepartmentChange(value: string) {
    onFiltersChange({
      ...filters,
      departmentId: value,
      subjectId: "",
    })
  }

  function handleSemesterChange(value: string) {
    onFiltersChange({
      ...filters,
      semesterId: value,
      subjectId: "",
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
      <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.4fr)_repeat(5,minmax(150px,1fr))_auto]">
        <div className="space-y-2">
          <Label htmlFor="answer-sheet-search">Search</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="answer-sheet-search"
              type="search"
              value={filters.searchQuery}
              onChange={(event) =>
                setFilter("searchQuery", event.target.value)
              }
              placeholder="Sheet ID, student, roll no, subject"
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer-sheet-status">Status</Label>
          <select
            id="answer-sheet-status"
            className={selectClassName}
            value={filters.status}
            onChange={(event) =>
              setFilter(
                "status",
                event.target.value as AnswerSheetFilterState["status"]
              )
            }
          >
            <option value="all">All statuses</option>
            {answerSheetStatuses.map((status) => (
              <option key={status} value={status}>
                {answerSheetStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer-sheet-department">Department</Label>
          <select
            id="answer-sheet-department"
            className={selectClassName}
            value={filters.departmentId}
            onChange={(event) => handleDepartmentChange(event.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer-sheet-semester">Semester</Label>
          <select
            id="answer-sheet-semester"
            className={selectClassName}
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
          <Label htmlFor="answer-sheet-subject">Subject</Label>
          <select
            id="answer-sheet-subject"
            className={selectClassName}
            value={filters.subjectId}
            onChange={(event) => handleSubjectChange(event.target.value)}
          >
            <option value="">All subjects</option>
            {filteredSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer-sheet-exam">Exam</Label>
          <select
            id="answer-sheet-exam"
            className={selectClassName}
            value={filters.examId}
            onChange={(event) => setFilter("examId", event.target.value)}
          >
            <option value="">All exams</option>
            {filteredExams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className={cn("w-full lg:w-auto")}
            onClick={onReset}
          >
            <RotateCcw data-icon="inline-start" className="size-4" />
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
