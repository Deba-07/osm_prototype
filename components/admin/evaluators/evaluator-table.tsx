"use client"

import { EvaluatorStatusBadge } from "@/components/admin/evaluators/evaluator-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Department, Evaluator, Subject } from "@/types/osm"
import { Eye } from "lucide-react"

type EvaluatorTableProps = {
  evaluators: Evaluator[]
  departments: Department[]
  subjects: Subject[]
  emptyMessage: string
  onReview: (evaluatorId: string) => void
}

function getDepartmentName(departments: Department[], departmentId: string) {
  return (
    departments.find((department) => department.id === departmentId)?.name ??
    "Department unavailable"
  )
}

function getExpertiseSubjects(subjects: Subject[], subjectIds: string[]) {
  return subjectIds
    .map((subjectId) => subjects.find((subject) => subject.id === subjectId))
    .filter((subject): subject is Subject => Boolean(subject))
}

export function EvaluatorTable({
  evaluators,
  departments,
  subjects,
  emptyMessage,
  onReview,
}: EvaluatorTableProps) {
  if (evaluators.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Evaluator</TableHead>
          <TableHead>Faculty ID</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Expertise</TableHead>
          <TableHead className="text-right">Experience</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {evaluators.map((evaluator) => {
          const expertiseSubjects = getExpertiseSubjects(
            subjects,
            evaluator.subjectExpertise
          )
          const visibleExpertise = expertiseSubjects.slice(0, 2)
          const hiddenExpertiseCount = Math.max(expertiseSubjects.length - 2, 0)

          return (
            <TableRow key={evaluator.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{evaluator.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {evaluator.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>{evaluator.facultyId}</TableCell>
              <TableCell>
                {getDepartmentName(departments, evaluator.departmentId)}
              </TableCell>
              <TableCell>{evaluator.designation}</TableCell>
              <TableCell>
                <div className="flex min-w-52 flex-wrap gap-1.5">
                  {visibleExpertise.map((subject) => (
                    <Badge key={subject.id} variant="secondary">
                      {subject.code}
                    </Badge>
                  ))}
                  {hiddenExpertiseCount > 0 ? (
                    <Badge variant="outline">+{hiddenExpertiseCount}</Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {evaluator.experienceYears} years
              </TableCell>
              <TableCell>
                <EvaluatorStatusBadge status={evaluator.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(evaluator.id)}
                >
                  <Eye data-icon="inline-start" className="size-4" />
                  Review
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
