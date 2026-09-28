import type { DerivedResult } from "@/lib/results"

export type ResultExportRow = {
  studentId: string
  studentName: string
  rollNumber: string
  departmentName: string
  programName: string
  semesterName: string
  subjectName: string
  evaluatorMarks: number
  adjustmentMarks: number
  finalMarks: number
  maximumMarks: number
  percentage: number
  result: string
}

export function toResultExportRows(results: DerivedResult[], evaluations: { id: string; totalMarks: number }[], adjustments: { evaluationId: string; adjustmentMarks: number }[]): ResultExportRow[] {
  return results.map((result) => {
    const evaluation = evaluations.find((item) => item.id === result.evaluationId)
    const adjustment = adjustments.find((item) => item.evaluationId === result.evaluationId)
    return {
      studentId: result.studentId,
      studentName: result.studentName,
      rollNumber: result.rollNumber,
      departmentName: result.departmentName,
      programName: result.programName,
      semesterName: result.semesterName,
      subjectName: result.subjectName,
      evaluatorMarks: evaluation?.totalMarks ?? result.totalMarks,
      adjustmentMarks: adjustment?.adjustmentMarks ?? 0,
      finalMarks: result.totalMarks,
      maximumMarks: result.maximumMarks,
      percentage: result.percentage,
      result: "Completed",
    }
  })
}

const exportColumns: Array<keyof ResultExportRow> = [
  "studentName", "rollNumber", "departmentName", "programName", "semesterName",
  "subjectName", "evaluatorMarks", "adjustmentMarks", "finalMarks", "maximumMarks",
  "percentage", "result",
]

const exportLabels: Record<keyof ResultExportRow, string> = {
  studentId: "Student ID", studentName: "Student Name", rollNumber: "Roll Number",
  departmentName: "Department", programName: "Program", semesterName: "Semester",
  subjectName: "Subject", evaluatorMarks: "Evaluator Marks", adjustmentMarks: "Adjustment",
  finalMarks: "Final Marks", maximumMarks: "Maximum Marks", percentage: "Percentage", result: "Result",
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function createResultCsv(rows: ResultExportRow[]) {
  return [
    exportColumns.map((column) => csvValue(exportLabels[column])).join(","),
    ...rows.map((row) => exportColumns.map((column) => csvValue(row[column])).join(",")),
  ].join("\r\n")
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character)
}

export function openPrintableResult({ title, context, rows }: { title: string; context: string; rows: ResultExportRow[] }) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer")
  if (!printWindow) return false
  const tableRows = rows.map((row) => `<tr><td>${escapeHtml(row.studentName)}</td><td>${escapeHtml(row.rollNumber)}</td><td>${escapeHtml(row.departmentName)}</td><td>${escapeHtml(row.subjectName)}</td><td>${row.finalMarks}</td><td>${row.maximumMarks}</td><td>${row.percentage}%</td><td>${escapeHtml(row.result)}</td></tr>`).join("")
  printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:32px}h1{margin:0 0 4px}p{color:#555}table{border-collapse:collapse;width:100%;margin-top:24px;font-size:12px}th,td{border:1px solid #bbb;padding:7px;text-align:left}th{background:#eee}@media print{button{display:none}}</style></head><body><h1>Demo Result Export</h1><h2>${escapeHtml(title)}</h2><p>${escapeHtml(context)}</p><p>Generated ${escapeHtml(new Date().toLocaleString("en-IN"))}</p><table><thead><tr><th>Student</th><th>Roll Number</th><th>Department</th><th>Subject</th><th>Final Marks</th><th>Maximum</th><th>Percentage</th><th>Result</th></tr></thead><tbody>${tableRows}</tbody></table><script>window.onload=function(){window.print()}</script></body></html>`)
  printWindow.document.close()
  return true
}

export function downloadResultCsv(rows: ResultExportRow[], filename: string) {
  const blob = new Blob([createResultCsv(rows)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
