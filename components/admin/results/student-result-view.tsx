"use client"

import { SemesterResultSummary } from "@/components/admin/results/semester-result-summary"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  getStudentSemesterResults,
  type DerivedResult,
} from "@/lib/results"
import { useMemo } from "react"

type StudentResultViewProps = {
  results: DerivedResult[]
  selectedStudentId: string
  onSelectedStudentIdChange: (studentId: string) => void
  onViewResult: (resultId: string) => void
}

function getStudentOptions(results: DerivedResult[]) {
  const students = new Map<
    string,
    {
      studentId: string
      studentName: string
      rollNumber: string
    }
  >()

  for (const result of results) {
    students.set(result.studentId, {
      studentId: result.studentId,
      studentName: result.studentName,
      rollNumber: result.rollNumber,
    })
  }

  return Array.from(students.values()).sort((first, second) =>
    first.studentName.localeCompare(second.studentName)
  )
}

export function StudentResultView({
  results,
  selectedStudentId,
  onSelectedStudentIdChange,
  onViewResult,
}: StudentResultViewProps) {
  const studentOptions = useMemo(() => getStudentOptions(results), [results])
  const activeStudentId = selectedStudentId || studentOptions[0]?.studentId || ""
  const semesterResults = useMemo(
    () => getStudentSemesterResults(results, activeStudentId),
    [activeStudentId, results]
  )
  const selectedStudent = studentOptions.find(
    (student) => student.studentId === activeStudentId
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Student Semester Results</CardTitle>
            <CardDescription>
              Inspect available completed subject results grouped by semester.
            </CardDescription>
          </div>
          <div className="w-full space-y-2 lg:w-80">
            <Label htmlFor="student-result-select">Student</Label>
            <select
              id="student-result-select"
              className={cn(
                "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              )}
              value={activeStudentId}
              disabled={studentOptions.length === 0}
              onChange={(event) =>
                onSelectedStudentIdChange(event.target.value)
              }
            >
              {studentOptions.length === 0 ? (
                <option value="">No students with results</option>
              ) : null}
              {studentOptions.map((student) => (
                <option key={student.studentId} value={student.studentId}>
                  {student.studentName} | {student.rollNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {studentOptions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No completed results are available for any student yet.
          </div>
        ) : semesterResults.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No completed results are available for this student yet.
          </div>
        ) : (
          <div className="space-y-4">
            {selectedStudent ? (
              <div className="rounded-lg border bg-muted/25 p-4">
                <p className="font-medium">{selectedStudent.studentName}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedStudent.rollNumber}
                </p>
              </div>
            ) : null}
            {semesterResults.map((semesterResult) => (
              <SemesterResultSummary
                key={semesterResult.id}
                semesterResult={semesterResult}
                onViewResult={onViewResult}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
