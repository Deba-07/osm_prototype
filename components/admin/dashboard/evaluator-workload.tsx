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
import type { EvaluatorWorkload as EvaluatorWorkloadRow } from "@/lib/dashboard"

type EvaluatorWorkloadProps = {
  workloads: EvaluatorWorkloadRow[]
}

export function EvaluatorWorkload({ workloads }: EvaluatorWorkloadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluator workload</CardTitle>
        <CardDescription>
          Approved evaluators and answer sheets currently assigned to them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {workloads.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evaluator</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Remaining</TableHead>
                <TableHead className="min-w-36">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloads.map((workload) => (
                <TableRow key={workload.evaluatorId}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{workload.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workload.designation}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {workload.assignedSheets}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {workload.completedSheets}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {workload.remainingSheets}
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-32 items-center gap-3">
                      <Progress
                        className="min-w-20 flex-1"
                        aria-label={`${workload.name} workload progress`}
                        value={workload.progress}
                      />
                      <Badge variant="outline" className="tabular-nums">
                        {workload.progress}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No approved evaluators are available.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
