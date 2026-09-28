"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getOperationalAlerts, operationalAlertSeverityLabels, operationalAlertTypeLabels } from "@/lib/alerts"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import type { OperationalAlert } from "@/types/osm"
import { AlertTriangle, Eye, Search } from "lucide-react"
import { useMemo, useState } from "react"

const severityClasses: Record<OperationalAlert["severity"], string> = { critical: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300", warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300", info: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300" }

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function AlertDetail({ alert, context, onClose }: { alert: OperationalAlert | undefined; context: string[]; onClose: () => void }) {
  return <Dialog open={Boolean(alert)} onOpenChange={(open) => !open && onClose()}><DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">{alert ? <><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5" aria-hidden="true" />{alert.title}</DialogTitle><DialogDescription>{alert.message}</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2"><Badge variant="outline" className={severityClasses[alert.severity]}>{operationalAlertSeverityLabels[alert.severity]}</Badge><Badge variant="outline">{operationalAlertTypeLabels[alert.type]}</Badge><Badge variant="outline">{alert.status}</Badge></div><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Created / triggered</dt><dd className="mt-1">{formatDate(alert.createdAt)}</dd></div>{context.map((item) => <div key={item}><dt className="text-xs text-muted-foreground">Context</dt><dd className="mt-1">{item}</dd></div>)}<div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Message</dt><dd className="mt-1">{alert.message}</dd></div></dl><div className="rounded-lg border bg-muted/25 p-4"><p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Condition details</p><dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">{Object.entries(alert.details).map(([key, value]) => <div key={key}><dt className="text-muted-foreground">{key}</dt><dd className="font-medium">{String(value)}</dd></div>)}</dl></div><DialogFooter showCloseButton /></> : null}</DialogContent></Dialog>
}

export function AlertsPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const examsState = useOsmStore((state) => state.exams)
  const evaluators = useOsmStore((state) => state.evaluators)
  const uploadBatches = useOsmStore((state) => state.uploadBatches)
  const processingJobs = useOsmStore((state) => state.pdfProcessingJobs)
  const processedScripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluationSessions = useOsmStore((state) => state.evaluationSessions)
  const exceptions = useOsmStore((state) => state.scriptExceptions)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const alerts = useMemo(() => getOperationalAlerts({ exams: examsState, evaluators, uploadBatches, processingJobs, processedScripts, mappings, answerSheets, evaluations, evaluationSessions, exceptions }), [answerSheets, evaluators, evaluationSessions, exceptions, examsState, mappings, processedScripts, processingJobs, uploadBatches, evaluations])
  const visibleAlerts = useMemo(() => { const query = search.trim().toLowerCase(); return alerts.filter((alert) => (severityFilter === "all" || alert.severity === severityFilter) && (typeFilter === "all" || alert.type === typeFilter) && (statusFilter === "all" || alert.status === statusFilter) && (!query || [alert.title, alert.message, alert.examId, alert.evaluatorId, alert.scriptId, alert.uploadBatchId].filter(Boolean).join(" ").toLowerCase().includes(query))) }, [alerts, search, severityFilter, statusFilter, typeFilter])
  const selectedAlert = alerts.find((alert) => alert.id === selectedId)
  const contextFor = (alert: OperationalAlert) => [alert.examId ? `Exam: ${examsState.find((exam) => exam.id === alert.examId)?.name ?? alert.examId}` : "Exam: Not specified", alert.evaluatorId ? `Evaluator: ${evaluators.find((evaluator) => evaluator.id === alert.evaluatorId)?.name ?? alert.evaluatorId}` : "", alert.scriptId ? `Script: ${alert.scriptId}` : "", alert.uploadBatchId ? `Batch: ${alert.uploadBatchId}` : "", alert.nodalCentreId ? `Centre: ${nodalCentres.find((centre) => centre.id === alert.nodalCentreId)?.code ?? alert.nodalCentreId}` : ""].filter(Boolean)
  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length
  const warningCount = alerts.filter((alert) => alert.severity === "warning").length

  if (!hydrated) return <Card><CardContent className="p-8">Loading operational alerts...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Operational alerts are restricted to university administrators." />

  return <div className="space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Phase 9 · Operational Resilience</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Operational Alerts</h1><p className="text-sm leading-6 text-muted-foreground">Derived monitoring conditions from existing examination workflow state. Demo-only; no notifications are sent.</p></section><div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Active Alerts</p><p className="mt-1 text-3xl font-semibold">{alerts.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical</p><p className="mt-1 text-3xl font-semibold text-rose-700 dark:text-rose-300">{criticalCount}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Warning</p><p className="mt-1 text-3xl font-semibold text-amber-700 dark:text-amber-300">{warningCount}</p></CardContent></Card></div><Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"><label className="relative sm:col-span-2"><Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden="true" /><input className="h-8 w-full rounded-lg border border-input bg-background pl-8 text-sm" placeholder="Search alerts" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}><option value="all">All severities</option><option value="critical">Critical</option><option value="warning">Warning</option><option value="info">Info</option></select><select className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All alert types</option>{Object.entries(operationalAlertTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select className="h-8 rounded-lg border border-input bg-background px-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option></select></CardContent></Card><Card><CardHeader><CardTitle>Alert history</CardTitle><CardDescription>Showing {visibleAlerts.length} of {alerts.length} active operational alerts</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[1000px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Severity</th><th className="px-3 py-3">Alert type</th><th className="px-3 py-3">Title</th><th className="px-3 py-3">Exam</th><th className="px-3 py-3">Related work</th><th className="px-3 py-3">Triggered</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{visibleAlerts.map((alert) => <tr key={alert.id}><td className="px-3 py-3"><Badge variant="outline" className={severityClasses[alert.severity]}>{operationalAlertSeverityLabels[alert.severity]}</Badge></td><td className="px-3 py-3">{operationalAlertTypeLabels[alert.type]}</td><td className="px-3 py-3 font-medium">{alert.title}</td><td className="max-w-56 px-3 py-3">{alert.examId ? examsState.find((exam) => exam.id === alert.examId)?.name ?? alert.examId : "-"}</td><td className="px-3 py-3">{alert.scriptId ?? alert.evaluatorId ?? alert.uploadBatchId ?? "-"}</td><td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(alert.createdAt)}</td><td className="px-3 py-3 text-right"><Button type="button" size="sm" variant="ghost" onClick={() => setSelectedId(alert.id)}><Eye data-icon="inline-start" className="size-4" />Details</Button></td></tr>)}</tbody></table>{visibleAlerts.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No active alerts match the selected filters.</p> : null}</CardContent></Card><AlertDetail alert={selectedAlert} context={selectedAlert ? contextFor(selectedAlert) : []} onClose={() => setSelectedId(null)} /></div>
}
