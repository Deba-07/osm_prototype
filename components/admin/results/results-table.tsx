import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { DerivedResult, ResultSortKey, SortDirection } from "@/lib/results"
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react"

type ResultsTableProps = {
  results: DerivedResult[]
  emptyMessage: string
  sortKey: ResultSortKey
  sortDirection: SortDirection
  onSort: (sortKey: ResultSortKey) => void
  onViewResult: (resultId: string) => void
}

function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function formatSubmittedAt(timestamp?: string) {
  if (!timestamp) {
    return "Not available"
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction: SortDirection
}) {
  if (!active) {
    return <ArrowUpDown data-icon="inline-end" className="size-3.5" />
  }

  return direction === "asc" ? (
    <ArrowUp data-icon="inline-end" className="size-3.5" />
  ) : (
    <ArrowDown data-icon="inline-end" className="size-3.5" />
  )
}

function SortableHead({
  label,
  value,
  align = "left",
  sortKey,
  sortDirection,
  onSort,
}: {
  label: string
  value: ResultSortKey
  align?: "left" | "right"
  sortKey: ResultSortKey
  sortDirection: SortDirection
  onSort: (sortKey: ResultSortKey) => void
}) {
  const isActive = sortKey === value

  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={align === "right" ? "ml-auto" : "-ml-2"}
        onClick={() => onSort(value)}
      >
        {label}
        <SortIcon active={isActive} direction={sortDirection} />
      </Button>
    </TableHead>
  )
}

export function ResultsTable({
  results,
  emptyMessage,
  sortKey,
  sortDirection,
  onSort,
  onViewResult,
}: ResultsTableProps) {
  if (results.length === 0) {
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
          <SortableHead
            label="Student"
            value="student"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead>Department</TableHead>
          <TableHead>Semester</TableHead>
          <SortableHead
            label="Subject"
            value="subject"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead>Exam</TableHead>
          <SortableHead
            label="Marks"
            value="marks"
            align="right"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHead
            label="Percentage"
            value="percentage"
            align="right"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHead
            label="Submitted"
            value="submittedAt"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => (
          <TableRow key={result.id}>
            <TableCell>
              <div className="min-w-44 space-y-1">
                <p className="font-medium">{result.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {result.rollNumber}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p>{result.departmentName}</p>
                <p className="text-xs text-muted-foreground">
                  {result.programCode}
                </p>
              </div>
            </TableCell>
            <TableCell>{result.semesterName}</TableCell>
            <TableCell>
              <div className="min-w-56 space-y-1">
                <p className="font-medium">{result.subjectName}</p>
                <p className="text-xs text-muted-foreground">
                  {result.subjectCode}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="min-w-64 space-y-1">
                <p>{result.examName}</p>
                <p className="text-xs text-muted-foreground">
                  {result.academicYear}
                </p>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarks(result.totalMarks)} /{" "}
              {formatMarks(result.maximumMarks)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercentage(result.percentage)}
            </TableCell>
            <TableCell>{formatSubmittedAt(result.submittedAt)}</TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewResult(result.id)}
              >
                <Eye data-icon="inline-start" className="size-4" />
                View Result
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
