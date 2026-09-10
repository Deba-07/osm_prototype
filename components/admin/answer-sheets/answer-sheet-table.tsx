"use client"

import { AnswerSheetStatusBadge } from "@/components/admin/answer-sheets/answer-sheet-status-badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  answerSheetStatusLabels,
  type AnswerSheetSortKey,
  type ResolvedAnswerSheet,
  type SortDirection,
} from "@/lib/answer-sheets"
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react"

type AnswerSheetTableProps = {
  rows: ResolvedAnswerSheet[]
  emptyMessage: string
  sortKey: AnswerSheetSortKey | null
  sortDirection: SortDirection
  onSort: (sortKey: AnswerSheetSortKey) => void
  onInspect: (answerSheetId: string) => void
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
  value: AnswerSheetSortKey
  align?: "left" | "right"
  sortKey: AnswerSheetSortKey | null
  sortDirection: SortDirection
  onSort: (sortKey: AnswerSheetSortKey) => void
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

export function AnswerSheetTable({
  rows,
  emptyMessage,
  sortKey,
  sortDirection,
  onSort,
  onInspect,
}: AnswerSheetTableProps) {
  if (rows.length === 0) {
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
            label="Sheet ID"
            value="sheetId"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <SortableHead
            label="Student"
            value="student"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead>Department</TableHead>
          <SortableHead
            label="Subject"
            value="subject"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead>Semester</TableHead>
          <TableHead>Exam</TableHead>
          <TableHead>Evaluator</TableHead>
          <SortableHead
            label="Status"
            value="status"
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.answerSheet.id}>
            <TableCell className="font-medium uppercase">
              {row.answerSheet.id}
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p className="font-medium">
                  {row.student?.name ?? "Student unavailable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.student?.rollNumber ?? "Roll number unavailable"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <p>{row.department?.name ?? "Department unavailable"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.program?.code ?? "Program unavailable"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <div className="min-w-56 space-y-1">
                <p className="font-medium">
                  {row.subject?.name ?? "Subject unavailable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.subject?.code ?? "Code unavailable"}
                </p>
              </div>
            </TableCell>
            <TableCell>{row.semester?.name ?? "Semester unavailable"}</TableCell>
            <TableCell>
              <div className="min-w-60 space-y-1">
                <p>{row.exam?.name ?? "Exam unavailable"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.exam?.academicYear ?? "Academic year unavailable"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              {row.evaluator?.name ??
                (row.answerSheet.assignedEvaluatorId
                  ? "Evaluator unavailable"
                  : "Not assigned")}
            </TableCell>
            <TableCell>
              <AnswerSheetStatusBadge status={row.answerSheet.status} />
              <span className="sr-only">
                {answerSheetStatusLabels[row.answerSheet.status]}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onInspect(row.answerSheet.id)}
              >
                <Eye data-icon="inline-start" className="size-4" />
                Inspect
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
