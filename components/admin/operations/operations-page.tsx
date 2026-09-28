"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { getExaminationOperationsMetrics } from "@/lib/examination-operations"
import { useOsmStore } from "@/stores/osm-store"
import { AlertTriangle, ArrowDown, Clock3, FileCheck2, Gauge, MapPinned, Users } from "lucide-react"
import { useMemo } from "react"

const alertClasses = {
  upcoming: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
  due_soon: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  overdue: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
}

const alertLabels = { upcoming: "Upcoming", due_soon: "Due Soon", overdue: "Overdue" }

function OperationsSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-28" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-72" /><div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

export function OperationsPage() {
  const hydrated = useOsmStoreHydrated()
  const uploadBatches = useOsmStore((state) => state.uploadBatches)
  const processingJobs = useOsmStore((state) => state.pdfProcessingJobs)
  const processedScripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluationSessions = useOsmStore((state) => state.evaluationSessions)
  const exceptions = useOsmStore((state) => state.scriptExceptions)
  const evaluators = useOsmStore((state) => state.evaluators)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const exams = useOsmStore((state) => state.exams)
  const metrics = useMemo(
    () => getExaminationOperationsMetrics({ uploadBatches, processingJobs, processedScripts, mappings, answerSheets, evaluations, evaluationSessions, exceptions, evaluators, nodalCentres, exams }),
    [answerSheets, evaluationSessions, evaluations, exceptions, exams, evaluators, mappings, nodalCentres, processedScripts, processingJobs, uploadBatches]
  )

  if (!hydrated) return <OperationsSkeleton />

  const kpis = [
    ["Scripts Received", metrics.scriptsReceived, "Intake units in the current pipeline", FileCheck2],
    ["Scripts Processed", metrics.scriptsProcessed, "Generated processed-script records", Gauge],
    ["Scripts Assigned", metrics.scriptsAssigned, "Assigned answer-sheet script records", Users],
    ["In Evaluation", metrics.scriptsInEvaluation, "Active or resumable sessions", Clock3],
    ["Completed", metrics.scriptsCompleted, "Submitted/completed script records", FileCheck2],
    ["Exceptions", metrics.exceptionScripts, "Scripts with unresolved exceptions", AlertTriangle],
  ] as const

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Examination operations</p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Examination Operations</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">Monitor script intake, processing, distribution, evaluation, exceptions, evaluator workload, nodal-centre activity, and operational bottlenecks.</p>
      </section>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader><CardTitle>Operational Overview</CardTitle><CardDescription>Factual indicators derived from the current demo workflow. Counts can overlap because source records span different lifecycle stages.</CardDescription></CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3"><p>{metrics.scriptsReceived} scripts received</p><p>{metrics.scriptsProcessed} scripts processed</p><p>{metrics.scriptsAssigned} scripts assigned</p><p>{metrics.scriptsInEvaluation} scripts currently in evaluation</p><p>{metrics.scriptsCompleted} scripts completed</p><p>{metrics.exceptionScripts} scripts have unresolved exceptions</p></CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6" aria-label="Operational KPIs">
        {kpis.map(([label, value, description, Icon]) => <Card key={label} size="sm"><CardHeader className="gap-3"><div className="flex items-start justify-between gap-3"><div><CardDescription>{label}</CardDescription><CardTitle className="mt-1 text-2xl tabular-nums">{value}</CardTitle></div><div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></div></div></CardHeader><CardContent><p className="text-xs leading-5 text-muted-foreground">{description}</p></CardContent></Card>)}
      </section>

      <Card>
        <CardHeader><CardTitle>Operational Flow</CardTitle><CardDescription>Current counts across the intake-to-submission lifecycle.</CardDescription></CardHeader>
        <CardContent><div className="grid gap-3 md:grid-cols-5">{metrics.funnel.map((stage, index) => <div key={stage.label} className="relative rounded-lg border bg-muted/20 p-4 text-center"><p className="text-xs text-muted-foreground">{stage.label}</p><p className="mt-1 text-3xl font-semibold tabular-nums">{stage.count}</p>{index < metrics.funnel.length - 1 ? <ArrowDown className="absolute -bottom-5 left-1/2 z-10 size-4 -translate-x-1/2 text-muted-foreground md:top-1/2 md:-right-5 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:rotate-[-90deg]" aria-hidden="true" /> : null}</div>)}</div><p className="mt-4 text-xs text-muted-foreground">Received includes generated scripts plus upload batches that have not produced a processed-script record yet.</p></CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card><CardHeader><CardTitle>Attention Required</CardTitle><CardDescription>Deterministic bottlenecks derived from current records.</CardDescription></CardHeader><CardContent className="space-y-3">{metrics.bottlenecks.length ? metrics.bottlenecks.map((bottleneck) => <div key={bottleneck.category} className="flex items-start justify-between gap-4 rounded-lg border p-3"><div><p className="font-medium">{bottleneck.category}</p><p className="mt-1 text-sm text-muted-foreground">{bottleneck.explanation}</p></div><Badge variant="outline" className="shrink-0 tabular-nums">{bottleneck.count}</Badge></div>) : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No derived bottlenecks in the current demo state.</p>}</CardContent></Card>
        <Card><CardHeader><CardTitle>Deadline Alerts</CardTitle><CardDescription>Exam dates are shown as operational deadline context for this demo.</CardDescription></CardHeader><CardContent className="space-y-3">{metrics.deadlineAlerts.length ? metrics.deadlineAlerts.map((alert) => <div key={alert.id} className="flex items-start justify-between gap-3 rounded-lg border p-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{alert.relatedTo}</p><p className="mt-1 text-xs text-muted-foreground">{alert.label} · {formatDate(alert.deadline)}</p></div><Badge variant="outline" className={alertClasses[alert.state]}>{alertLabels[alert.state]}</Badge></div>) : <p className="text-sm text-muted-foreground">No deadline dates are available for current intake.</p>}</CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card><CardHeader><CardTitle>Evaluator Workload</CardTitle><CardDescription>Assignment and evaluation activity from the existing evaluator workload helper.</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[760px] text-sm"><thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Evaluator</th><th className="px-4 py-3 text-right">Assigned</th><th className="px-4 py-3 text-right">In Evaluation</th><th className="px-4 py-3 text-right">Completed</th><th className="px-4 py-3 text-right">Remaining</th><th className="px-4 py-3">Session</th></tr></thead><tbody className="divide-y">{metrics.evaluatorWorkloads.map((workload) => <tr key={workload.evaluator.id}><td className="px-4 py-3"><p className="font-medium">{workload.evaluator.name}</p><p className="text-xs text-muted-foreground">{workload.evaluator.designation}</p></td><td className="px-4 py-3 text-right tabular-nums">{workload.assignedScripts}</td><td className="px-4 py-3 text-right tabular-nums">{workload.inEvaluation}</td><td className="px-4 py-3 text-right tabular-nums">{workload.completedScripts}</td><td className="px-4 py-3 text-right tabular-nums">{workload.remainingAssigned}</td><td className="px-4 py-3">{workload.activeOrResumableSession ? <Badge variant="outline">Active / Resumable</Badge> : <span className="text-xs text-muted-foreground">No session</span>}</td></tr>)}</tbody></table></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><MapPinned className="size-4 text-primary" aria-hidden="true" />Nodal-Centre Operations</CardTitle><CardDescription>Activity and unresolved exception context by existing centre.</CardDescription></CardHeader><CardContent className="space-y-3">{metrics.centreStatuses.map((item) => <div key={item.centre.id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.centre.name}</p><p className="text-xs text-muted-foreground">{item.centre.code}</p></div><Badge variant="outline">{item.centre.status[0].toUpperCase() + item.centre.status.slice(1)}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{item.batchesReceived} batches · {item.scriptsProcessed} processed · {item.scriptsAssigned} assigned · {item.scriptsCompleted} completed</p>{item.unresolvedExceptions > 0 ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{item.unresolvedExceptions} unresolved exception script(s)</p> : null}</div>)}</CardContent></Card>
      </section>
    </div>
  )
}
