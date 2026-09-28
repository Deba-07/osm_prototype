"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { exams } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import {
  getScriptOperationalStatus,
  scriptOperationalStatusLabels,
} from "@/lib/script-operational-status"
import { useOsmStore } from "@/stores/osm-store"
import type { ScriptExceptionStatus, ScriptExceptionType } from "@/types/osm"
import { AlertTriangle, Check, Eye, Search } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const typeLabels: Record<ScriptExceptionType, string> = {
  roll_number_mismatch: "Roll Number Mismatch",
  missing_page: "Missing Page",
  duplicate_roll_number: "Duplicate Roll Number",
  pdf_processing_error: "PDF Processing Error",
  incomplete_script: "Incomplete Script",
  upload_problem: "Upload Problem",
}

const statusLabels: Record<ScriptExceptionStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
}

const statusClasses: Record<ScriptExceptionStatus, string> = {
  open: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300",
  under_review: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  resolved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
}

function formatDate(value?: string) {
  if (!value) return "Not available"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function ExceptionStatusBadge({ status }: { status: ScriptExceptionStatus }) {
  return (
    <Badge variant="outline" className={statusClasses[status]}>
      {statusLabels[status]}
    </Badge>
  )
}

function ExceptionsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading exception queue">
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-[34rem]" />
    </div>
  )
}

export function ExceptionsPage() {
  const hydrated = useOsmStoreHydrated()
  const exceptions = useOsmStore((state) => state.scriptExceptions)
  const scripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const batches = useOsmStore((state) => state.uploadBatches)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const students = useOsmStore((state) => state.students)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluationSessions = useOsmStore((state) => state.evaluationSessions)
  const evaluators = useOsmStore((state) => state.evaluators)
  const startExceptionReview = useOsmStore(
    (state) => state.startExceptionReview
  )
  const resolveException = useOsmStore((state) => state.resolveException)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ScriptExceptionStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<ScriptExceptionType | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")

  const contextFor = (exception: (typeof exceptions)[number]) => {
    const script = scripts.find((item) => item.id === exception.scriptId)
    const batch = script
      ? batches.find((item) => item.id === script.uploadBatchId)
      : undefined
    const exam = batch ? exams.find((item) => item.id === batch.examId) : undefined
    const mapping = mappings.find((item) => item.scriptId === exception.scriptId)
    const student = mapping?.studentId
      ? students.find((item) => item.id === mapping.studentId)
      : undefined
    const sheet = answerSheets.find(
      (item) => (item.processedScriptId ?? item.id) === exception.scriptId
    )
    const evaluator = sheet?.assignedEvaluatorId
      ? evaluators.find((item) => item.id === sheet.assignedEvaluatorId)
      : undefined
    const operationalStatus = getScriptOperationalStatus({
      scriptId: exception.scriptId,
      scripts,
      mappings,
      answerSheets,
      evaluations,
      evaluationSessions,
      exceptions,
    })
    return { script, batch, exam, mapping, student, sheet, evaluator, operationalStatus }
  }

  const visibleExceptions = (() => {
    const query = searchQuery.trim().toLowerCase()
    return exceptions.filter((exception) => {
      const context = contextFor(exception)
      const haystack = [
        exception.id,
        exception.scriptId,
        exception.details,
        typeLabels[exception.type],
        context.mapping?.rollNumber,
        context.student?.name,
        context.batch?.id,
        context.batch?.batchNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return (
        (statusFilter === "all" || exception.status === statusFilter) &&
        (typeFilter === "all" || exception.type === typeFilter) &&
        (query.length === 0 || haystack.includes(query))
      )
    })
  })()

  const selectedException = exceptions.find((exception) => exception.id === selectedId)
  const selectedContext = selectedException ? contextFor(selectedException) : undefined

  function openException(exceptionId: string) {
    setSelectedId(exceptionId)
    setResolutionNote("")
  }

  function handleReview() {
    if (!selectedException || !startExceptionReview(selectedException.id)) return
    toast.success("Exception moved to Under Review.")
  }

  function handleResolve() {
    if (!selectedException) return
    if (!resolutionNote.trim()) {
      toast.error("Add a resolution note before resolving the exception.")
      return
    }
    if (resolveException(selectedException.id, resolutionNote)) {
      toast.success("Exception resolved.")
      setResolutionNote("")
    }
  }

  if (!hydrated) return <ExceptionsSkeleton />

  const counts = {
    total: exceptions.length,
    open: exceptions.filter((exception) => exception.status === "open").length,
    underReview: exceptions.filter((exception) => exception.status === "under_review").length,
    resolved: exceptions.filter((exception) => exception.status === "resolved").length,
  }
  const statCards = [
    { label: "Total Exceptions", value: counts.total, tone: "text-foreground" },
    { label: "Open", value: counts.open, tone: "text-rose-700 dark:text-rose-300" },
    { label: "Under Review", value: counts.underReview, tone: "text-amber-700 dark:text-amber-300" },
    { label: "Resolved", value: counts.resolved, tone: "text-emerald-700 dark:text-emerald-300" },
  ]

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-primary">Examination operations</p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Exception Queue</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Review and resolve script processing and examination exceptions.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Exception summary">
        {statCards.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-semibold ${stat.tone}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Operational exceptions</CardTitle>
          <CardDescription>{visibleExceptions.length} records match the current filters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_240px]">
            <div className="space-y-2">
              <Label htmlFor="exception-search">Search exceptions</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input id="exception-search" className="pl-8" placeholder="ID, script, roll, student, batch, details" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exception-status">Status</Label>
              <select id="exception-status" className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ScriptExceptionStatus | "all")}>
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exception-type">Exception type</Label>
              <select id="exception-type" className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ScriptExceptionType | "all")}>
                <option value="all">All types</option>
                {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr><th className="px-4 py-3">Exception</th><th className="px-4 py-3">Script</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Updated</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y">
                {visibleExceptions.map((exception) => (
                  <tr key={exception.id}>
                    <td className="px-4 py-3 font-medium">{exception.id}</td>
                    <td className="px-4 py-3"><p className="font-medium">{exception.scriptId}</p><p className="text-xs text-muted-foreground">{contextFor(exception).mapping?.rollNumber ?? "Roll unavailable"}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap">{typeLabels[exception.type]}</td>
                    <td className="max-w-sm px-4 py-3 text-muted-foreground">{exception.details}</td>
                    <td className="px-4 py-3"><ExceptionStatusBadge status={exception.status} /></td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">{formatDate(exception.updatedAt)}</td>
                    <td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => openException(exception.id)}><Eye data-icon="inline-start" className="size-3.5" />Review</Button></td>
                  </tr>
                ))}
                {visibleExceptions.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No exceptions match the current filters.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedException)} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selectedException && selectedContext ? (
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />{selectedException.id}</DialogTitle>
              <DialogDescription>Inspect context and manage the exception lifecycle.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/25 p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium">{typeLabels[selectedException.type]}</p><p className="mt-1 text-sm text-muted-foreground">{selectedException.scriptId}</p></div><ExceptionStatusBadge status={selectedException.status} /></div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Script</dt><dd className="mt-1 text-sm">{selectedException.scriptId}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Exam</dt><dd className="mt-1 text-sm">{selectedContext.exam?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Batch</dt><dd className="mt-1 text-sm">{selectedContext.batch?.batchNumber ?? "Unavailable"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Student</dt><dd className="mt-1 text-sm">{selectedContext.student?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Roll number</dt><dd className="mt-1 text-sm">{selectedContext.mapping?.rollNumber ?? "Unavailable"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Operational status</dt><dd className="mt-1 text-sm">{scriptOperationalStatusLabels[selectedContext.operationalStatus]}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Evaluator</dt><dd className="mt-1 text-sm">{selectedContext.evaluator?.name ?? "Not assigned"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Created</dt><dd className="mt-1 text-sm">{formatDate(selectedException.createdAt)}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Updated</dt><dd className="mt-1 text-sm">{formatDate(selectedException.updatedAt)}</dd></div></dl>
              <div className="rounded-lg border bg-muted/25 p-4 text-sm"><p className="font-medium">Details</p><p className="mt-2 leading-6 text-muted-foreground">{selectedException.details}</p></div>
              {selectedException.resolutionNote ? <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm"><p className="font-medium text-emerald-700 dark:text-emerald-300">Resolution note</p><p className="mt-2 leading-6">{selectedException.resolutionNote}</p><p className="mt-2 text-xs text-muted-foreground">Resolved {formatDate(selectedException.resolvedAt)}</p></div> : null}
              {selectedException.status === "under_review" ? <div className="space-y-2"><Label htmlFor="resolution-note">Resolution note</Label><Textarea id="resolution-note" value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} placeholder="Describe how this exception was resolved." /></div> : null}
            </div>
            <DialogFooter>{selectedException.status === "open" ? <Button onClick={handleReview}><AlertTriangle data-icon="inline-start" className="size-4" />Start Review</Button> : null}{selectedException.status === "under_review" ? <Button onClick={handleResolve}><Check data-icon="inline-start" className="size-4" />Resolve</Button> : null}<Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button></DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}
