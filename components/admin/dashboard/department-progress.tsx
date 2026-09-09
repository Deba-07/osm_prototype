import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { DepartmentEvaluationProgress } from "@/lib/dashboard"

type DepartmentProgressProps = {
  departments: DepartmentEvaluationProgress[]
}

export function DepartmentProgress({ departments }: DepartmentProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Department progress</CardTitle>
        <CardDescription>
          Completed answer sheets grouped through subject department.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {departments.length > 0 ? (
          <div className="space-y-5">
            {departments.map((department) => (
              <div key={department.departmentId} className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {department.departmentName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {department.completedSheets}/{department.totalSheets}{" "}
                      completed, {department.remainingSheets} remaining
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {department.progress}%
                  </span>
                </div>
                <Progress
                  aria-label={`${department.departmentName} evaluation progress`}
                  value={department.progress}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No departments are configured.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
