"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { exams } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import type { AuditAction, AuditLog } from "@/types/osm"
import { Eye, Search, X } from "lucide-react"
import { useMemo, useState } from "react"

const actionLabels: Record<AuditAction, string> = { evaluator_approved: "Evaluator approved", batch_uploaded: "Batch uploaded", pdf_processed: "PDF processed", script_assigned: "Script assigned", evaluation_started: "Evaluation started", marks_saved: "Marks saved", evaluation_submitted: "Evaluation submitted", admin_adjustment: "Admin adjustment", result_finalized: "Result finalized" }
const actions = Object.keys(actionLabels) as AuditAction[]
const eventTypeLabels = ["Administration", "Intake", "Processing", "Assignment", "Evaluation", "Result"] as const
type EventType = (typeof eventTypeLabels)[number]

function eventTypeFor(action: AuditAction): EventType {
  if (action === "evaluator_approved" || action === "admin_adjustment") return "Administration"
  if (action === "batch_uploaded") return "Intake"
  if (action === "pdf_processed") return "Processing"
  if (action === "script_assigned") return "Assignment"
  if (action === "result_finalized") return "Result"
  return "Evaluation"
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function localDateKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function AuditDetail({ log, examName, scriptName, onClose }: { log: AuditLog | undefined; examName: string; scriptName: string; onClose: () => void }) {
  return <Dialog open={Boolean(log)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">{log ? <><DialogHeader><DialogTitle>{actionLabels[log.action]}</DialogTitle><DialogDescription>Read-only audit event detail.</DialogDescription></DialogHeader><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Date / time</dt><dd className="mt-1">{formatDate(log.timestamp)}</dd></div><div><dt className="text-xs text-muted-foreground">User</dt><dd className="mt-1">{log.actorName ?? "System"}</dd></div><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-1">{log.actorRole ?? "Not recorded"}</dd></div><div><dt className="text-xs text-muted-foreground">Action</dt><dd className="mt-1">{actionLabels[log.action]}</dd></div><div><dt className="text-xs text-muted-foreground">Event type</dt><dd className="mt-1">{eventTypeFor(log.action)}</dd></div><div><dt className="text-xs text-muted-foreground">Exam</dt><dd className="mt-1">{examName}</dd></div><div><dt className="text-xs text-muted-foreground">Script</dt><dd className="mt-1">{scriptName}</dd></div><div><dt className="text-xs text-muted-foreground">Entity type</dt><dd className="mt-1">{log.entityType ?? "Not recorded"}</dd></div><div><dt className="text-xs text-muted-foreground">Entity ID</dt><dd className="mt-1 break-all">{log.entityId ?? "Not recorded"}</dd></div><div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Description</dt><dd className="mt-1">{log.description}</dd></div></dl>{log.metadata ? <div className="rounded-lg border bg-muted/25 p-4"><p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Metadata</p><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(log.metadata).map(([key, value]) => <div key={key}><dt className="text-muted-foreground">{key}</dt><dd className="font-medium">{value}</dd></div>)}</dl></div> : null}<DialogFooter showCloseButton /></> : null}</DialogContent></Dialog>
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label className="space-y-1 text-xs font-medium text-muted-foreground"><span>{label}</span><select className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm font-normal text-foreground" value={value} onChange={(event) => onChange(event.target.value)}><option value="all">All {label}s</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>
}

export function AuditTrailPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const auditLogs = useOsmStore((state) => state.auditLogs)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const [searchQuery, setSearchQuery] = useState("")
  const [userFilter, setUserFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all")
  const [examFilter, setExamFilter] = useState("all")
  const [scriptFilter, setScriptFilter] = useState("all")
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | "all">("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const users = useMemo(() => Array.from(new Map(auditLogs.filter((log) => log.actorId).map((log) => [log.actorId, { id: log.actorId ?? "", name: log.actorName ?? log.actorId ?? "Unknown user" }])).values()).sort((a, b) => a.name.localeCompare(b.name)), [auditLogs])
  const scriptOptions = useMemo(() => Array.from(new Set(auditLogs.map((log) => log.scriptId).filter(Boolean))).map((id) => { const mapping = mappings.find((item) => item.scriptId === id); return { id: id as string, name: mapping?.rollNumber ? `Script #${mapping.rollNumber}` : id as string } }), [auditLogs, mappings])
  const visibleLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return [...auditLogs].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).filter((log) => {
      const haystack = [log.actorName, log.actorId, log.entityId, log.description, log.entityType, actionLabels[log.action]].filter(Boolean).join(" ").toLowerCase()
      const date = localDateKey(log.timestamp)
      return (!query || haystack.includes(query)) && (userFilter === "all" || log.actorId === userFilter) && (actionFilter === "all" || log.action === actionFilter) && (examFilter === "all" || log.examId === examFilter) && (scriptFilter === "all" || log.scriptId === scriptFilter) && (eventTypeFilter === "all" || eventTypeFor(log.action) === eventTypeFilter) && (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
    })
  }, [actionFilter, auditLogs, eventTypeFilter, examFilter, fromDate, searchQuery, scriptFilter, toDate, userFilter])
  const selectedLog = auditLogs.find((log) => log.id === selectedId)
  const selectedExamName = selectedLog?.examId ? exams.find((exam) => exam.id === selectedLog.examId)?.name ?? selectedLog.examId : "All exams / not specified"
  const selectedScriptName = selectedLog?.scriptId ? scriptOptions.find((script) => script.id === selectedLog.scriptId)?.name ?? selectedLog.scriptId : "All scripts / not specified"

  function clearFilters() {
    setSearchQuery(""); setUserFilter("all"); setActionFilter("all"); setExamFilter("all"); setScriptFilter("all"); setEventTypeFilter("all"); setFromDate(""); setToDate("")
  }

  if (!hydrated) return <Card><CardContent className="p-8">Loading audit trail...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="The audit trail is restricted to university administrators." />

  return <div className="space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Phase 8 · Audit & Financial Workflow</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Audit Trail</h1><p className="text-sm leading-6 text-muted-foreground">Review read-only examination activity history using combined filters.</p></section><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="relative sm:col-span-2 lg:col-span-4"><Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden="true" /><Input className="pl-8" placeholder="Search actor, entity, or description" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></label><FilterSelect label="User" value={userFilter} onChange={setUserFilter} options={users.map((user) => [user.id, user.name])} /><FilterSelect label="Action" value={actionFilter} onChange={(value) => setActionFilter(value as AuditAction | "all")} options={actions.map((action) => [action, actionLabels[action]])} /><FilterSelect label="Exam" value={examFilter} onChange={setExamFilter} options={exams.map((exam) => [exam.id, exam.name])} /><FilterSelect label="Script" value={scriptFilter} onChange={setScriptFilter} options={scriptOptions.map((script) => [script.id, script.name])} /><FilterSelect label="Event Type" value={eventTypeFilter} onChange={(value) => setEventTypeFilter(value as EventType | "all")} options={eventTypeLabels.map((type) => [type, type])} /><label className="space-y-1 text-xs font-medium text-muted-foreground"><span>From date</span><Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label className="space-y-1 text-xs font-medium text-muted-foreground"><span>To date</span><Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label><Button type="button" variant="outline" className="self-end" onClick={clearFilters}><X data-icon="inline-start" className="size-4" />Clear filters</Button></CardContent></Card><Card><CardHeader><CardTitle>Activity history</CardTitle><CardDescription>Showing {visibleLogs.length} of {auditLogs.length} audit events · newest first</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1050px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Date / Time</th><th className="px-3 py-3">User</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Exam</th><th className="px-3 py-3">Script</th><th className="px-3 py-3">Event Type</th><th className="px-3 py-3">Description</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{visibleLogs.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(log.timestamp)}</td><td className="px-3 py-3">{log.actorName ?? "System"}</td><td className="px-3 py-3"><Badge variant="outline">{actionLabels[log.action]}</Badge></td><td className="max-w-48 px-3 py-3">{log.examId ? exams.find((exam) => exam.id === log.examId)?.name ?? log.examId : "-"}</td><td className="px-3 py-3">{log.scriptId ? scriptOptions.find((script) => script.id === log.scriptId)?.name ?? log.scriptId : "-"}</td><td className="px-3 py-3">{eventTypeFor(log.action)}</td><td className="max-w-md px-3 py-3">{log.description}</td><td className="px-3 py-3 text-right"><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedId(log.id)}><Eye data-icon="inline-start" className="size-4" />Details</Button></td></tr>)}</tbody></table>{visibleLogs.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No audit events match the current filters.</p> : null}</CardContent></Card><AuditDetail log={selectedLog} examName={selectedExamName} scriptName={selectedScriptName} onClose={() => setSelectedId(null)} /></div>
}
