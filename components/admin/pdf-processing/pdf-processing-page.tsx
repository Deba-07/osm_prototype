"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { PdfProcessingJob, PdfProcessingStatus } from "@/types/osm"
import { Check, Circle, FileText, Play, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

const statusLabels: Record<PdfProcessingStatus, string> = {
  received: "PDF Received",
  detecting_pages: "Detecting Pages",
  splitting_pages: "Splitting Pages",
  generating_scripts: "Generating Scripts",
  completed: "Completed",
  failed: "Failed",
}

const statusClassNames: Record<PdfProcessingStatus, string> = {
  received: "border-border bg-muted/60 text-muted-foreground",
  detecting_pages: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
  splitting_pages: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  generating_scripts: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/40 dark:text-violet-300",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
}

const stageOrder: PdfProcessingStatus[] = [
  "received",
  "detecting_pages",
  "splitting_pages",
  "generating_scripts",
  "completed",
]

function ProcessingSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24" /><div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]"><Skeleton className="h-[30rem]" /><Skeleton className="h-[30rem]" /></div></div>
}

function isStageComplete(job: PdfProcessingJob, stage: PdfProcessingStatus) {
  if (stage === "completed") return job.status === "completed"
  return stageOrder.indexOf(job.status) > stageOrder.indexOf(stage)
}

export function PdfProcessingPage() {
  const hydrated = useOsmStoreHydrated()
  const uploadBatches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const uploaders = useOsmStore((state) => state.uploaders)
  const jobs = useOsmStore((state) => state.pdfProcessingJobs)
  const processedScripts = useOsmStore((state) => state.processedScripts)
  const startPdfProcessing = useOsmStore((state) => state.startPdfProcessing)
  const advancePdfProcessing = useOsmStore((state) => state.advancePdfProcessing)
  const [selectedBatchId, setSelectedBatchId] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  const selectedBatch = uploadBatches.find((batch) => batch.id === selectedBatchId) ?? uploadBatches[0]
  const selectedJob = jobs.find((job) => job.uploadBatchId === selectedBatch?.id)
  const selectedScript = processedScripts.find((script) => script.uploadBatchId === selectedBatch?.id)
  const eligibleBatches = useMemo(
    () => uploadBatches.filter((batch) => batch.status === "uploaded" || batch.status === "ready_for_processing"),
    [uploadBatches]
  )

  useEffect(() => {
    if (!isRunning || !selectedBatch) return
    const timer = window.setInterval(() => {
      const nextJob = advancePdfProcessing(selectedBatch.id)
      if (nextJob?.status === "completed" || nextJob?.status === "failed") {
        setIsRunning(false)
        if (nextJob.status === "completed") toast.success("PDF processing completed.")
      }
    }, 900)
    return () => window.clearInterval(timer)
  }, [advancePdfProcessing, isRunning, selectedBatch])

  function handleProcessing() {
    if (!selectedBatch || !selectedJob) return
    if (selectedJob.status === "received") {
      if (!startPdfProcessing(selectedBatch.id)) {
        toast.error("This batch is not eligible for processing.")
        return
      }
    }
    setIsRunning(true)
  }

  function getExamName() {
    return exams.find((exam) => exam.id === selectedBatch?.examId)?.name ?? "Unknown exam"
  }
  function getCentreName() {
    return nodalCentres.find((centre) => centre.id === selectedBatch?.nodalCentreId)?.name ?? "Unknown centre"
  }
  function getUploaderName() {
    return uploaders.find((uploader) => uploader.id === selectedBatch?.uploaderId)?.name ?? "Unknown uploader"
  }

  if (!hydrated) return <ProcessingSkeleton />
  if (!selectedBatch || !selectedJob) {
    return <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">No eligible upload batches are available for PDF processing.</div>
  }

  const isCompleted = selectedJob.status === "completed"
  const actionLabel = isCompleted ? "Processing Complete" : isRunning ? "Processing Demo..." : selectedJob.status === "received" ? "Start Processing" : "Continue Simulation"
  const summaryCards = [
    { label: "Pages detected", value: selectedJob.detectedPages + " / " + (selectedJob.totalPages || 32) },
    { label: "Pages processed", value: selectedJob.processedPages + " / " + (selectedJob.totalPages || 32) },
    { label: "Scripts generated", value: String(selectedJob.generatedScripts) },
  ]

  return <div className="space-y-6">
    <section className="space-y-2"><p className="text-sm font-medium text-muted-foreground">University Admin</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">PDF Processing Simulation</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Demonstrate page detection, mock splitting, script generation, and cover-page protection without opening or modifying a real PDF.</p></section>
    <Card><CardContent className="flex flex-col gap-4 py-4 md:flex-row md:items-end md:justify-between"><div className="w-full max-w-2xl space-y-2"><label htmlFor="processing-batch" className="text-sm font-medium">Upload batch</label><select id="processing-batch" className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={selectedBatch.id} onChange={(event) => { setSelectedBatchId(event.target.value); setIsRunning(false) }}>{eligibleBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batchNumber} · {batch.scannedPdf.fileName}</option>)}</select></div><Badge variant="outline" className={statusClassNames[selectedJob.status]}>{statusLabels[selectedJob.status]}</Badge></CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
      <Card><CardHeader><CardTitle>PDF received</CardTitle><CardDescription>Intake metadata for the selected batch.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3 rounded-lg border bg-muted/25 p-3"><FileText className="mt-0.5 size-5 text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">{selectedBatch.scannedPdf.fileName}</p><p className="text-sm text-muted-foreground">{selectedBatch.batchNumber}</p></div></div><dl className="space-y-4 text-sm"><div><dt className="text-xs text-muted-foreground">Exam</dt><dd className="mt-1 font-medium">{getExamName()}</dd></div><div><dt className="text-xs text-muted-foreground">Nodal centre</dt><dd className="mt-1 font-medium">{getCentreName()}</dd></div><div><dt className="text-xs text-muted-foreground">Uploader</dt><dd className="mt-1 font-medium">{getUploaderName()}</dd></div><div><dt className="text-xs text-muted-foreground">Upload timestamp</dt><dd className="mt-1 font-medium">{new Date(selectedBatch.uploadedAt).toLocaleString("en-IN")}</dd></div></dl><Button className="w-full" disabled={isCompleted || isRunning} onClick={handleProcessing}>{isCompleted ? <ShieldCheck data-icon="inline-start" className="size-4" /> : <Play data-icon="inline-start" className="size-4" />}{actionLabel}</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Processing lifecycle</CardTitle><CardDescription>{selectedJob.totalPages || 32}-page deterministic demo progression.</CardDescription></CardHeader><CardContent className="space-y-6"><Progress value={selectedJob.progress}><ProgressLabel>Overall progress</ProgressLabel><ProgressValue /></Progress><div className="space-y-3">{stageOrder.map((stage) => { const complete = isStageComplete(selectedJob, stage); const active = selectedJob.status === stage && !complete; const scriptLabel = selectedJob.generatedScripts === 1 ? "One mock logical script generated." : `${selectedJob.generatedScripts} mock logical scripts generated.`; return <div key={stage} className="flex items-start gap-3"><div className={cn("mt-0.5 flex size-6 items-center justify-center rounded-full border", complete ? "border-emerald-500 bg-emerald-500 text-white" : active ? "border-primary text-primary" : "text-muted-foreground")} aria-hidden="true">{complete ? <Check className="size-3.5" /> : active ? <span className="size-2 rounded-full bg-primary" /> : <Circle className="size-3.5" />}</div><div className="min-w-0"><p className={cn("text-sm font-medium", !complete && !active && "text-muted-foreground")}>{stage === "splitting_pages" ? "Pages Split" : stage === "generating_scripts" ? "Script Generated" : stage === "completed" ? "Cover Page Protected" : statusLabels[stage]}</p><p className="text-xs text-muted-foreground">{stage === "received" ? "Scanned PDF metadata is ready." : stage === "detecting_pages" ? (selectedJob.detectedPages ? `${selectedJob.detectedPages} pages detected.` : `Detecting the ${selectedJob.totalPages || 32}-page structure.`) : stage === "splitting_pages" ? (selectedJob.processedPages ? `${selectedJob.processedPages} pages split into logical scripts.` : "Preparing page sequence.") : stage === "generating_scripts" ? (selectedJob.generatedScripts ? scriptLabel : "Generating the script record.") : "Mock cover-page protection marked complete."}</p></div></div> })}</div><div className="grid gap-3 sm:grid-cols-3">{summaryCards.map((card) => <div key={card.label} className="rounded-lg border bg-muted/25 p-3"><p className="text-xs text-muted-foreground">{card.label}</p><p className="mt-1 text-lg font-semibold">{card.value}</p></div>)}</div>{selectedScript && <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm"><p className="font-medium">Generated script: {selectedScript.id}</p><p className="mt-1 text-muted-foreground">Pages {selectedScript.startPage}–{selectedScript.endPage} · Cover Page: Protected</p><p className="mt-1 text-xs text-muted-foreground">No student, roll number, or evaluator assigned.</p></div>}</CardContent></Card>
    </div>
  </div>
}
