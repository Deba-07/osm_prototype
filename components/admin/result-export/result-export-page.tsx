"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { examQuestions } from "@/data/questions"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { deriveResultsFromEvaluations } from "@/lib/results"
import { downloadResultCsv, openPrintableResult, toResultExportRows, type ResultExportRow } from "@/lib/result-export"
import { useOsmStore } from "@/stores/osm-store"
import { FileDown, FileSpreadsheet, Printer } from "lucide-react"
import { useMemo, useState } from "react"

type ExportScope = "student" | "department" | "university"

function formatNumber(value: number) {
  return Number(value.toFixed(2))
}

export function ResultExportPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const students = useOsmStore((state) => state.students)
  const evaluations = useOsmStore((state) => state.evaluations)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluators = useOsmStore((state) => state.evaluators)
  const adjustments = useOsmStore((state) => state.adminAdjustments)
  const [scope, setScope] = useState<ExportScope>("student")
  const [studentId, setStudentId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [message, setMessage] = useState("")

  const results = useMemo(() => deriveResultsFromEvaluations({ evaluations, students, subjects, exams, questions: examQuestions, answerSheets, departments, programs, semesters, evaluators, adminAdjustments: adjustments }), [adjustments, answerSheets, evaluations, evaluators, students])
  const selectedStudent = students.find((student) => student.id === studentId)
  const selectedDepartment = departments.find((department) => department.id === departmentId)
  const scopedResults = useMemo(() => {
    if (scope === "student") return studentId ? results.filter((result) => result.studentId === studentId) : []
    if (scope === "department") return departmentId ? results.filter((result) => result.departmentId === departmentId) : []
    return results
  }, [departmentId, results, scope, studentId])
  const rows = useMemo<ResultExportRow[]>(() => toResultExportRows(scopedResults, evaluations, adjustments), [adjustments, evaluations, scopedResults])
  const context = scope === "student" ? selectedStudent?.name ?? "No student selected" : scope === "department" ? selectedDepartment?.name ?? "No department selected" : universityContext.name
  const title = scope === "student" ? "Student Result" : scope === "department" ? "Department Result" : "University Result"

  function ensureRows() {
    if (rows.length === 0) {
      setMessage(scope === "university" ? "No submitted result data is available to export." : `Select a ${scope} with submitted result data before exporting.`)
      return false
    }
    setMessage("")
    return true
  }

  function handleCsvExport() {
    if (!ensureRows()) return
    const suffix = scope === "student" ? selectedStudent?.rollNumber ?? "student" : scope === "department" ? selectedDepartment?.code ?? "department" : "university"
    downloadResultCsv(rows, `osm-${scope}-result-${suffix.toLowerCase()}.csv`)
    setMessage("CSV result download started. It can be opened in Excel.")
  }

  function handlePrintExport() {
    if (!ensureRows()) return
    if (!openPrintableResult({ title, context, rows })) setMessage("The print window was blocked. Allow pop-ups and try again.")
  }

  if (!hydrated) return <Card><CardContent className="p-8">Loading result export...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Result exports are restricted to university administrators." />

  return <div className="space-y-6">
    <section className="space-y-2"><p className="text-sm font-medium text-primary">University Admin</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Result Export</h1><p className="text-sm leading-6 text-muted-foreground">Demo/local export workflow. Exports are generated in this browser and use effective final marks.</p></section>
    <Card><CardHeader><CardTitle>Choose export scope</CardTitle><CardDescription>PDF Result uses the browser print dialog. Excel Result generates a CSV compatible with Excel because no spreadsheet dependency is installed.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{([ ["student", "Student Result"], ["department", "Department Result"], ["university", "University Result"] ] as const).map(([value, label]) => <Button key={value} type="button" variant={scope === value ? "default" : "outline"} className="justify-start" onClick={() => { setScope(value); setMessage("") }}>{value === "student" ? <FileDown data-icon="inline-start" className="size-4" /> : value === "department" ? <FileSpreadsheet data-icon="inline-start" className="size-4" /> : <Printer data-icon="inline-start" className="size-4" />}{label}</Button>)}</div><div className="grid gap-4 sm:grid-cols-2">{scope === "student" ? <label className="space-y-2 text-sm"><span className="font-medium">Student</span><select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={studentId} onChange={(event) => { setStudentId(event.target.value); setMessage("") }}><option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.rollNumber}</option>)}</select></label> : null}{scope === "department" ? <label className="space-y-2 text-sm"><span className="font-medium">Department</span><select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={departmentId} onChange={(event) => { setDepartmentId(event.target.value); setMessage("") }}><option value="">Select a department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label> : null}</div></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Preview</CardTitle><CardDescription>{context} · {rows.length} result row{rows.length === 1 ? "" : "s"}</CardDescription></div><Badge variant="outline">Demo Result Export</Badge></div></CardHeader><CardContent className="space-y-4"><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[850px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Roll Number</th><th className="px-3 py-3">Department</th><th className="px-3 py-3">Subject</th><th className="px-3 py-3">Evaluator</th><th className="px-3 py-3">Adjustment</th><th className="px-3 py-3">Final Marks</th><th className="px-3 py-3">%</th></tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={`${row.studentId}-${row.subjectName}-${row.semesterName}`}><td className="px-3 py-3">{row.studentName}</td><td className="px-3 py-3">{row.rollNumber}</td><td className="px-3 py-3">{row.departmentName}</td><td className="px-3 py-3">{row.subjectName}</td><td className="px-3 py-3">{formatNumber(row.evaluatorMarks)}</td><td className="px-3 py-3">{formatNumber(row.adjustmentMarks)}</td><td className="px-3 py-3 font-semibold">{formatNumber(row.finalMarks)} / {row.maximumMarks}</td><td className="px-3 py-3">{row.percentage}%</td></tr>)}</tbody></table>{rows.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Choose a scope to preview submitted results.</p> : null}</div><div className="flex flex-wrap gap-2"><Button type="button" onClick={handlePrintExport}><Printer data-icon="inline-start" className="size-4" />Export PDF Result</Button><Button type="button" variant="outline" onClick={handleCsvExport}><FileSpreadsheet data-icon="inline-start" className="size-4" />Export Excel Result (CSV)</Button></div>{message ? <p className="text-sm font-medium text-primary" role="status">{message}</p> : null}</CardContent></Card>
  </div>
}
