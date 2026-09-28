"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { ScriptMappingStatus } from "@/types/osm"
import { Check, FileSearch, RotateCcw } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

const statusLabels: Record<ScriptMappingStatus, string> = {
  valid: "Valid",
  review: "Review",
  invalid: "Invalid",
}

const statusClasses: Record<ScriptMappingStatus, string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  review: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  invalid: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function ScriptMappingsPage() {
  const hydrated = useOsmStoreHydrated()
  const mappings = useOsmStore((state) => state.scriptMappings)
  const scripts = useOsmStore((state) => state.processedScripts)
  const batches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const students = useOsmStore((state) => state.students)
  const correctScriptMapping = useOsmStore((state) => state.correctScriptMapping)
  const reviewScriptMapping = useOsmStore((state) => state.reviewScriptMapping)
  const [filter, setFilter] = useState<ScriptMappingStatus | "all">("all")
  const [selectedId, setSelectedId] = useState("")
  const [studentId, setStudentId] = useState("")

  const selected = mappings.find((mapping) => mapping.id === selectedId) ?? mappings[0]
  const visibleMappings = useMemo(
    () => filter === "all" ? mappings : mappings.filter((mapping) => mapping.status === filter),
    [filter, mappings]
  )

  if (!hydrated) {
    return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-[32rem]" /></div>
  }

  function scriptFor(mapping: typeof selected) {
    return mapping ? scripts.find((script) => script.id === mapping.scriptId) : undefined
  }

  function studentFor(mapping: typeof selected) {
    return mapping?.studentId ? students.find((student) => student.id === mapping.studentId) : undefined
  }

  function contextFor(mapping: typeof selected) {
    const script = scriptFor(mapping)
    const batch = script ? batches.find((item) => item.id === script.uploadBatchId) : undefined
    const exam = batch ? exams.find((item) => item.id === batch.examId) : undefined
    return { script, batch, exam }
  }

  function selectMapping(id: string) {
    setSelectedId(id)
    const mapping = mappings.find((item) => item.id === id)
    setStudentId(mapping?.studentId ?? "")
  }

  function handleCorrection() {
    if (!selected || !studentId) return
    if (correctScriptMapping(selected.id, studentId)) {
      toast.success("Mapping revalidated.")
      setSelectedId(selected.id)
    }
  }

  function handleReview() {
    if (!selected) return
    if (reviewScriptMapping(selected.id)) toast.success("Mapping marked as reviewed.")
  }

  const total = mappings.length
  const valid = mappings.filter((mapping) => mapping.status === "valid").length
  const review = mappings.filter((mapping) => mapping.status === "review").length
  const invalid = mappings.filter((mapping) => mapping.status === "invalid").length
  const missing = mappings.filter((mapping) => !mapping.rollNumber).length
  const duplicates = mappings.filter((mapping) => mapping.validationIssues.some((issue) => issue.includes("Duplicate roll"))).length
  const selectedContext = contextFor(selected)
  const selectedStudent = studentFor(selected)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Intake quality control</p>
          <h1 className="text-2xl font-semibold tracking-tight">Script mappings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Validate roll numbers before scripts enter the evaluation workflow.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}><RotateCcw className="mr-2 size-4" />Refresh data</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Total", total, "all"], ["Valid", valid, "valid"], ["Review", review, "review"],
          ["Invalid", invalid, "invalid"], ["Missing roll", missing, "invalid"], ["Duplicates", duplicates, "review"],
        ].map(([label, value, nextFilter]) => (
          <button key={label} onClick={() => setFilter(nextFilter as ScriptMappingStatus | "all")} className="text-left">
            <Card className={cn("transition-colors hover:border-primary/50", filter === nextFilter && "border-primary") }>
              <CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.7fr)]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle>Detected mappings</CardTitle><CardDescription>{visibleMappings.length} records in this view</CardDescription></div>
            <select value={filter} onChange={(event) => setFilter(event.target.value as ScriptMappingStatus | "all")} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="all">All statuses</option><option value="valid">Valid</option><option value="review">Review</option><option value="invalid">Invalid</option>
            </select>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Roll / student</th><th className="px-4 py-3">Script</th><th className="px-4 py-3">Pages</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Review</th></tr></thead>
              <tbody>{visibleMappings.map((mapping) => { const context = contextFor(mapping); const student = studentFor(mapping); return <tr key={mapping.id} onClick={() => selectMapping(mapping.id)} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/30", selected?.id === mapping.id && "bg-muted/50")}><td className="px-4 py-3"><p className="font-medium">{mapping.rollNumber ?? "Missing"}</p><p className="text-xs text-muted-foreground">{student?.name ?? "Unresolved student"}</p></td><td className="px-4 py-3"><p className="font-medium">{mapping.scriptId}</p><p className="text-xs text-muted-foreground">{context.exam?.name ?? "Unknown exam"}</p></td><td className="px-4 py-3 tabular-nums">{mapping.startPage}-{mapping.endPage} <span className="text-muted-foreground">({mapping.pageCount})</span></td><td className="px-4 py-3"><Badge variant="outline" className={statusClasses[mapping.status]}>{statusLabels[mapping.status]}</Badge></td><td className="px-4 py-3 text-xs text-muted-foreground">{mapping.reviewed ? "Reviewed" : "Open"}</td></tr> })}</tbody>
            </table></div>
          </CardContent>
        </Card>

        <Card className="h-fit"><CardHeader><CardTitle className="flex items-center gap-2"><FileSearch className="size-4 text-primary" />Mapping detail</CardTitle><CardDescription>Review the script context and correct an unresolved student.</CardDescription></CardHeader><CardContent className="space-y-4">
          {selected ? <>
            <div className="space-y-1"><p className="text-xs text-muted-foreground">Status</p><Badge variant="outline" className={statusClasses[selected.status]}>{statusLabels[selected.status]}</Badge></div>
            <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Exam</p><p className="mt-1 font-medium">{selectedContext.exam?.name ?? "Unknown"}</p></div><div><p className="text-xs text-muted-foreground">Batch</p><p className="mt-1 font-medium">{selectedContext.batch?.batchNumber ?? "Unknown"}</p></div><div><p className="text-xs text-muted-foreground">Pages</p><p className="mt-1 font-medium">{selected.startPage}-{selected.endPage} ({selected.pageCount})</p></div><div><p className="text-xs text-muted-foreground">Student</p><p className="mt-1 font-medium">{selectedStudent?.name ?? "Not resolved"}</p></div></div>
            <div className="rounded-md border bg-muted/30 p-3"><p className="text-xs font-medium text-muted-foreground">Validation issues</p>{selected.validationIssues.length ? <ul className="mt-2 space-y-1 text-sm text-destructive">{selected.validationIssues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : <p className="mt-2 text-sm text-emerald-700">No validation issues.</p>}</div>
            <div className="space-y-2"><label htmlFor="mapping-student" className="text-sm font-medium">Correct student</label><select id="mapping-student" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.rollNumber} · {student.name}</option>)}</select></div>
            <div className="flex flex-wrap gap-2"><Button onClick={handleCorrection} disabled={!studentId}><Check className="mr-2 size-4" />Correct and validate</Button><Button variant="outline" onClick={handleReview}><Check className="mr-2 size-4" />Mark reviewed</Button></div>
          </> : <p className="text-sm text-muted-foreground">No mappings available.</p>}
        </CardContent></Card>
      </div>
    </div>
  )
}
