import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  MAX_ACTIVE_SHEETS_PER_EVALUATOR,
  type EvaluatorAssignmentWorkload,
} from "@/lib/assignments"
import type { Department, Subject } from "@/types/osm"

type EvaluatorWorkloadOverviewProps = {
  workloads: EvaluatorAssignmentWorkload[]
  departments: Department[]
  subjects: Subject[]
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

export function EvaluatorWorkloadOverview({
  workloads,
  departments,
  subjects,
}: EvaluatorWorkloadOverviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluator workload balance</CardTitle>
        <CardDescription>
          Approved evaluators, active sheet load, completed work, and remaining
          assignment capacity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workloads.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluator</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Expertise</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">In Progress</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="min-w-48">Capacity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloads.map((workload) => {
                const expertiseSubjects = getExpertiseSubjects(
                  subjects,
                  workload.evaluator.subjectExpertise
                )
                const visibleExpertise = expertiseSubjects.slice(0, 2)
                const hiddenExpertiseCount = Math.max(
                  expertiseSubjects.length - 2,
                  0
                )

                return (
                  <TableRow key={workload.evaluator.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{workload.evaluator.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workload.evaluator.designation}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDepartmentName(
                        departments,
                        workload.evaluator.departmentId
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-48 flex-wrap gap-1.5">
                        {visibleExpertise.map((subject) => (
                          <Badge key={subject.id} variant="secondary">
                            {subject.code}
                          </Badge>
                        ))}
                        {hiddenExpertiseCount > 0 ? (
                          <Badge variant="outline">
                            +{hiddenExpertiseCount}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {workload.activeSheets}/{MAX_ACTIVE_SHEETS_PER_EVALUATOR}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {workload.assignedSheets}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {workload.inProgressSheets}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {workload.completedSheets}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-44 items-center gap-3">
                        <Progress
                          className="min-w-24 flex-1"
                          aria-label={`${workload.evaluator.name} active assignment capacity`}
                          value={workload.capacityUsedPercent}
                        />
                        <Badge variant="outline" className="tabular-nums">
                          {workload.availableCapacity} open
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No approved evaluators are currently available. Approve an
            evaluator before creating assignments.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
