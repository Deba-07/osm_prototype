import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  StudentPerformanceRankingCandidate,
  StudentPerformanceRankingEntry,
  SubjectRankingEntry,
} from "@/lib/rankings"

type StudentRankingTableProps = {
  entries: StudentPerformanceRankingEntry[]
  emptyMessage: string
}

type SubjectRankingTableProps = {
  entries: SubjectRankingEntry[]
  emptyMessage: string
}

type IncompleteRankingNoticeProps = {
  entries: StudentPerformanceRankingCandidate[]
}

export function formatMarks(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

export function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

export function StudentRankingTable({
  entries,
  emptyMessage,
}: StudentRankingTableProps) {
  if (entries.length === 0) {
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
          <TableHead>Rank</TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Roll Number</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Program</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead className="text-right">Marks</TableHead>
          <TableHead className="text-right">Maximum</TableHead>
          <TableHead className="text-right">Percentage</TableHead>
          <TableHead>Results Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Badge variant="outline" className="tabular-nums">
                {entry.rank}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="min-w-44 space-y-1">
                <p className="font-medium">{entry.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.registrationNumber}
                </p>
              </div>
            </TableCell>
            <TableCell className="tabular-nums">{entry.rollNumber}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <p>{entry.departmentName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.departmentCode}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="min-w-40 space-y-1">
                <p>{entry.programCode}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.programName}
                </p>
              </div>
            </TableCell>
            <TableCell>{entry.semesterName}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarks(entry.totalMarks)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarks(entry.maximumMarks)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercentage(entry.percentage)}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{entry.completenessLabel}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function SubjectRankingTable({
  entries,
  emptyMessage,
}: SubjectRankingTableProps) {
  if (entries.length === 0) {
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
          <TableHead>Rank</TableHead>
          <TableHead>Student</TableHead>
          <TableHead>Roll Number</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Exam</TableHead>
          <TableHead className="text-right">Marks</TableHead>
          <TableHead className="text-right">Maximum</TableHead>
          <TableHead className="text-right">Percentage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Badge variant="outline" className="tabular-nums">
                {entry.rank}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="min-w-44 space-y-1">
                <p className="font-medium">{entry.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.registrationNumber}
                </p>
              </div>
            </TableCell>
            <TableCell className="tabular-nums">{entry.rollNumber}</TableCell>
            <TableCell>{entry.departmentName}</TableCell>
            <TableCell>
              <div className="min-w-56 space-y-1">
                <p>{entry.subjectName}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.subjectCode}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="min-w-64">{entry.examName}</div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarks(entry.totalMarks)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMarks(entry.maximumMarks)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercentage(entry.percentage)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function IncompleteRankingNotice({
  entries,
}: IncompleteRankingNoticeProps) {
  if (entries.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="font-medium">Incomplete candidates excluded</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {entries.length} student{entries.length === 1 ? "" : "s"} with
            submitted marks do not yet cover the configured subject set for the
            selected semester.
          </p>
        </div>
        <Badge variant="outline">Missing results are not scored as zero</Badge>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, 6).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {entry.studentName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {entry.rollNumber} | {entry.programCode}
              </p>
            </div>
            <Badge variant="secondary">{entry.completenessLabel}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
