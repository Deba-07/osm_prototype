"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getOperationalAlerts, operationalAlertSeverityLabels } from "@/lib/alerts"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import { AlertTriangle } from "lucide-react"

type View = "dashboard" | "batches" | "alerts"

export function CentreOperationsPage({ view = "dashboard" }: { view?: View }) {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const centres = useOsmStore((state) => state.nodalCentres)
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const uploaders = useOsmStore((state) => state.uploaders)
  const batches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const scripts = useOsmStore((state) => state.processedScripts)
  const processingJobs = useOsmStore((state) => state.pdfProcessingJobs)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const sessions = useOsmStore((state) => state.evaluationSessions)
  const exceptions = useOsmStore((state) => state.scriptExceptions)
  const evaluators = useOsmStore((state) => state.evaluators)
  const centre = centres.find((item) => item.id === currentUser?.nodalCentreId)
  const college = colleges.find((item) => item.id === centre?.affiliatedCollegeId)
  const centreBatches = batches.filter((batch) => batch.nodalCentreId === centre?.id)
  const centreBatchIds = new Set(centreBatches.map((batch) => batch.id))
  const centreScripts = scripts.filter((script) => centreBatchIds.has(script.uploadBatchId))
  const centreUploaders = uploaders.filter((uploader) => uploader.nodalCentreId === centre?.id)
  const alerts = getOperationalAlerts({ exams, evaluators, uploadBatches: batches, processingJobs, processedScripts: scripts, mappings, answerSheets, evaluations, evaluationSessions: sessions, exceptions }).filter((alert) => alert.nodalCentreId === centre?.id || (alert.uploadBatchId ? centreBatchIds.has(alert.uploadBatchId) : false))

  if (!hydrated) return <Card><CardContent className="p-8">Loading centre operations...</CardContent></Card>
  if (currentUser?.role !== "centre_superintendent" || !centre) return <EvaluatorAccessState title="Superintendent profile unavailable" description="This demo superintendent is not linked to a valid nodal centre." />
  const heading = view === "batches" ? "Centre Uploads" : view === "alerts" ? "Centre Alerts" : "Centre Operations Dashboard"
  return <div className="space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Centre Examination Operations</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{heading}</h1><p className="text-sm text-muted-foreground">{centre.name} ({centre.code}) · {college?.name ?? "Affiliated college unavailable"}</p></section>{view === "dashboard" ? <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Batches</p><p className="mt-1 text-3xl font-semibold">{centreBatches.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Scripts received</p><p className="mt-1 text-3xl font-semibold">{centreScripts.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Scripts processed</p><p className="mt-1 text-3xl font-semibold">{centreScripts.filter((script) => processingJobs.some((job) => job.uploadBatchId === script.uploadBatchId && job.status === "completed")).length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Centre alerts</p><p className="mt-1 text-3xl font-semibold">{alerts.length}</p></CardContent></Card></div><Card><CardHeader><CardTitle>Centre identity</CardTitle><CardDescription>Scoped to this superintendent’s nodal centre.</CardDescription></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Superintendent</p><p className="mt-1 font-medium">{centre.superintendent.name}</p></div><div><p className="text-xs text-muted-foreground">Centre status</p><Badge variant="outline">{centre.status}</Badge></div><div><p className="text-xs text-muted-foreground">Address</p><p className="mt-1 font-medium">{centre.address}, {centre.city}</p></div><div><p className="text-xs text-muted-foreground">Centre uploaders</p><p className="mt-1 font-medium">{centreUploaders.map((uploader) => `${uploader.name} (${uploader.status})`).join(", ") || "None"}</p></div></CardContent></Card></> : null}{view === "batches" ? <Card><CardHeader><CardTitle>Centre batches</CardTitle><CardDescription>Only batches belonging to {centre.code} are shown.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Batch</th><th className="px-3 py-3">Exam</th><th className="px-3 py-3">Uploader</th><th className="px-3 py-3">Uploaded</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y">{centreBatches.map((batch) => <tr key={batch.id}><td className="px-3 py-3 font-medium">{batch.batchNumber}</td><td className="px-3 py-3">{exams.find((exam) => exam.id === batch.examId)?.name ?? batch.examId}</td><td className="px-3 py-3">{uploaders.find((uploader) => uploader.id === batch.uploaderId)?.name ?? batch.uploaderId}</td><td className="px-3 py-3">{batch.uploadedAt}</td><td className="px-3 py-3"><Badge variant="outline">{batch.status}</Badge></td></tr>)}</tbody></table>{centreBatches.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No centre batches yet.</p> : null}</CardContent></Card> : null}{view === "alerts" ? <Card><CardHeader><CardTitle>Centre alerts</CardTitle><CardDescription>Operational alerts linked to this centre’s batches.</CardDescription></CardHeader><CardContent className="space-y-3">{alerts.map((alert) => <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-4"><AlertTriangle className="mt-0.5 size-4 text-amber-600" aria-hidden="true" /><div><div className="flex flex-wrap gap-2"><p className="font-medium">{alert.title}</p><Badge variant="outline">{operationalAlertSeverityLabels[alert.severity]}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{alert.message}</p></div></div>)}{alerts.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No alerts for this centre.</p> : null}</CardContent></Card> : null}</div>
}
