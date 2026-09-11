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
import type { StudentSemesterResult } from "@/lib/results"

type SemesterResultSummaryProps = {
  semesterResult: StudentSemesterResult
  onViewResult: (resultId: string) => void
}

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

export function SemesterResultSummary({
  semesterResult,
  onViewResult,
}: SemesterResultSummaryProps) {
  return (
    <section className="rounded-lg border">
      <div className="flex flex-col gap-3 border-b bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-medium">{semesterResult.semesterName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {semesterResult.subjectsCompleted} completed subject results
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="tabular-nums">
            {formatMarks(semesterResult.totalMarks)} /{" "}
            {formatMarks(semesterResult.maximumMarks)}
          </Badge>
          <Badge variant="secondary" className="tabular-nums">
            {formatPercentage(semesterResult.percentage)}
          </Badge>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Exam</TableHead>
            <TableHead className="text-right">Marks</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {semesterResult.results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{result.subjectName}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.subjectCode}
                  </p>
                </div>
              </TableCell>
              <TableCell>{result.examName}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMarks(result.totalMarks)} /{" "}
                {formatMarks(result.maximumMarks)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatPercentage(result.percentage)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onViewResult(result.id)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}
