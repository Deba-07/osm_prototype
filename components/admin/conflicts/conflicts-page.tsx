"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { affiliatedColleges } from "@/data/colleges"
import { exams } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { getCompletedEvaluatorSheets, getRemainingEvaluatorSheets } from "@/lib/conflicts"
import { getEvaluatorAssignmentWorkload } from "@/lib/assignments"
import { useOsmStore } from "@/stores/osm-store"
import type { OperationalConflictStatus, OperationalConflictType } from "@/types/osm"
import { AlertTriangle, CheckCircle2, Eye, RotateCcw, UserX } from "lucide-react"
import { useState } from "react"

const typeLabels: Record<OperationalConflictType, string> = { nodal_centre_conflict: "Nodal Centre Conflict", evaluator_unavailable: "Evaluator Unavailable" }
const statusLabels: Record<OperationalConflictStatus, string> = { detected: "Detected", under_review: "Under Review", resolved: "Resolved" }

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export function ConflictsPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const conflicts = useOsmStore((state) => state.operationalConflicts)
  const centres = useOsmStore((state) => state.nodalCentres)
  const batches = useOsmStore((state) => state.uploadBatches)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const startConflictReview = useOsmStore((state) => state.startConflictReview)
  const resolveConflict = useOsmStore((state) => state.resolveConflict)
  const setEvaluatorAvailability = useOsmStore((state) => state.setEvaluatorAvailability)
  const redistributeEvaluatorWork = useOsmStore((state) => state.redistributeEvaluatorWork)
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")
  const [message, setMessage] = useState("")
  const selectedConflict = conflicts.find((conflict) => conflict.id === selectedConflictId)

  function reviewConflict() {
    if (selectedConflict && startConflictReview(selectedConflict.id)) setMessage("Conflict moved to Under Review.")
  }
  function finishConflict() {
    if (!selectedConflict || !resolutionNote.trim()) { setMessage("A resolution note is required."); return }
    if (resolveConflict(selectedConflict.id, resolutionNote)) { setMessage("Conflict resolved."); setResolutionNote("") }
  }
  function markUnavailable(evaluatorId: string) {
    setEvaluatorAvailability(evaluatorId, "unavailable")
    setMessage("Evaluator marked unavailable. Review remaining scripts before redistribution.")
  }
  function redistribute(evaluatorId: string) {
    const result = redistributeEvaluatorWork(evaluatorId)
    setMessage(`${result.remainingBefore} remaining before redistribution · ${result.redistributed} redistributed · ${result.stillRemaining} still remaining.${result.message ? ` ${result.message}` : ""}`)
  }

  if (!hydrated) return <Card><CardContent className="p-8">Loading conflict control...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Conflict control is restricted to university administrators." />
  const approvedEvaluators = evaluators.filter((evaluator) => evaluator.status === "approved")
  const openCount = conflicts.filter((conflict) => conflict.status === "detected").length
  const reviewCount = conflicts.filter((conflict) => conflict.status === "under_review").length
  const resolvedCount = conflicts.filter((conflict) => conflict.status === "resolved").length
  const unavailableCount = approvedEvaluators.filter((evaluator) => evaluator.availability === "unavailable").length

  return <div className="space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Phase 9 · Operational Resilience</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Conflict Control</h1><p className="text-sm leading-6 text-muted-foreground">Review nodal-centre conflicts and redistribute remaining evaluator work using the existing assignment state.</p></section><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Open Conflicts", openCount], ["Under Review", reviewCount], ["Resolved", resolvedCount], ["Unavailable Evaluators", unavailableCount]].map(([label, value]) => <Card key={label}><CardContent className="space-y-1 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle>Nodal Centre Conflicts</CardTitle><CardDescription>Conflict state is separate from the Task 24 exception queue.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Type</th><th className="px-3 py-3">Nodal Centre</th><th className="px-3 py-3">Exam</th><th className="px-3 py-3">Affected Scripts</th><th className="px-3 py-3">Status</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{conflicts.filter((conflict) => conflict.type === "nodal_centre_conflict").map((conflict) => { const centre = centres.find((item) => item.id === conflict.nodalCentreId); const exam = exams.find((item) => item.id === conflict.examId); return <tr key={conflict.id}><td className="px-3 py-3 font-medium">{typeLabels[conflict.type]}</td><td className="px-3 py-3">{centre?.code ?? conflict.nodalCentreId}</td><td className="px-3 py-3">{exam?.name ?? conflict.examId}</td><td className="px-3 py-3">{conflict.affectedScriptIds.length}</td><td className="px-3 py-3"><Badge variant="outline">{statusLabels[conflict.status]}</Badge></td><td className="px-3 py-3 text-right"><Button type="button" size="sm" variant="outline" onClick={() => { setSelectedConflictId(conflict.id); setMessage(""); setResolutionNote("") }}><Eye data-icon="inline-start" className="size-4" />Review</Button></td></tr> })}</tbody></table></CardContent></Card><Card><CardHeader><CardTitle>Evaluator Availability</CardTitle><CardDescription>Remaining work excludes submitted evaluations and completed sheets. Capacity remains capped at 20 active scripts.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Evaluator</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Assigned</th><th className="px-3 py-3">Completed</th><th className="px-3 py-3">Remaining</th><th className="px-3 py-3">Capacity</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{approvedEvaluators.map((evaluator) => { const workload = getEvaluatorAssignmentWorkload({ evaluator, answerSheets }); const completed = getCompletedEvaluatorSheets({ evaluatorId: evaluator.id, answerSheets, evaluations }); const remaining = getRemainingEvaluatorSheets({ evaluatorId: evaluator.id, answerSheets, evaluations }); return <tr key={evaluator.id}><td className="px-3 py-3 font-medium">{evaluator.name}</td><td className="px-3 py-3"><Badge variant="outline">{evaluator.availability === "unavailable" ? "Unavailable" : "Available"}</Badge></td><td className="px-3 py-3">{workload.assignedSheets + workload.inProgressSheets + workload.completedSheets}</td><td className="px-3 py-3">{completed.length}</td><td className="px-3 py-3">{remaining.length}</td><td className="px-3 py-3">{workload.availableCapacity}</td><td className="px-3 py-3 text-right"><div className="flex justify-end gap-2">{evaluator.availability !== "unavailable" ? <Button type="button" size="sm" variant="outline" onClick={() => markUnavailable(evaluator.id)}><UserX data-icon="inline-start" className="size-4" />Mark Unavailable</Button> : <><Button type="button" size="sm" variant="outline" onClick={() => setEvaluatorAvailability(evaluator.id, "available")}><CheckCircle2 data-icon="inline-start" className="size-4" />Mark Available</Button><Button type="button" size="sm" onClick={() => redistribute(evaluator.id)} disabled={remaining.length === 0}><RotateCcw data-icon="inline-start" className="size-4" />Redistribute</Button></>}</div></td></tr> })}</tbody></table>{message ? <p className="mt-4 text-sm font-medium text-primary" role="status">{message}</p> : null}</CardContent></Card><Dialog open={Boolean(selectedConflict)} onOpenChange={(open) => !open && setSelectedConflictId(null)}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">{selectedConflict ? <><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />{typeLabels[selectedConflict.type]}</DialogTitle><DialogDescription>{selectedConflict.description}</DialogDescription></DialogHeader><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Nodal Centre</dt><dd className="mt-1">{centres.find((centre) => centre.id === selectedConflict.nodalCentreId)?.name ?? selectedConflict.nodalCentreId}</dd></div><div><dt className="text-xs text-muted-foreground">College</dt><dd className="mt-1">{affiliatedColleges.find((college) => college.id === centres.find((centre) => centre.id === selectedConflict.nodalCentreId)?.affiliatedCollegeId)?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs text-muted-foreground">Exam</dt><dd className="mt-1">{exams.find((exam) => exam.id === selectedConflict.examId)?.name ?? selectedConflict.examId}</dd></div><div><dt className="text-xs text-muted-foreground">Upload batch</dt><dd className="mt-1">{batches.find((batch) => batch.id === selectedConflict.uploadBatchId)?.batchNumber ?? selectedConflict.uploadBatchId}</dd></div><div><dt className="text-xs text-muted-foreground">Affected scripts</dt><dd className="mt-1">{selectedConflict.affectedScriptIds.join(", ")}</dd></div><div><dt className="text-xs text-muted-foreground">Detected</dt><dd className="mt-1">{formatDate(selectedConflict.detectedAt)}</dd></div></dl><div className="rounded-lg border bg-muted/25 p-4 text-sm"><p className="font-medium">Workflow status: {statusLabels[selectedConflict.status]}</p><p className="mt-1 text-muted-foreground">Detected → Under Review → Resolved</p></div>{selectedConflict.status === "under_review" ? <label className="space-y-2 text-sm"><span className="font-medium">Resolution note</span><Textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Describe the operational resolution" /></label> : null}{message ? <p className="text-sm font-medium text-primary" role="status">{message}</p> : null}<DialogFooter>{selectedConflict.status === "detected" ? <Button type="button" onClick={reviewConflict}>Start Review</Button> : null}{selectedConflict.status === "under_review" ? <Button type="button" onClick={finishConflict}>Resolve</Button> : null}<Button type="button" variant="outline" onClick={() => setSelectedConflictId(null)}>Close</Button></DialogFooter></> : null}</DialogContent></Dialog></div>
}
