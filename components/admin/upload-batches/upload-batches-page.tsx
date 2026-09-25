"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { UploadBatch, UploadBatchStatus } from "@/types/osm"
import { Eye, FileStack, Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

type StatusFilter = "all" | UploadBatchStatus
const statusLabels: Record<UploadBatchStatus, string> = { draft: "Draft", uploaded: "Uploaded", ready_for_processing: "Ready for Processing", failed: "Failed" }
const statusClassNames: Record<UploadBatchStatus, string> = {
  draft: "border-border bg-muted/60 text-muted-foreground",
  uploaded: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300",
  ready_for_processing: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function formatFileSize(value: number) {
  return value < 1024 * 1024 ? (value / 1024).toFixed(1) + " KB" : (value / 1024 / 1024).toFixed(1) + " MB"
}

function BatchStatusBadge({ status }: { status: UploadBatchStatus }) {
  return <Badge variant="outline" className={statusClassNames[status]}>{statusLabels[status]}</Badge>
}

function UploadBatchesSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-[30rem]" /></div>
}

export function UploadBatchesPage() {
  const hydrated = useOsmStoreHydrated()
  const uploadBatches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const uploaders = useOsmStore((state) => state.uploaders)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    total: uploadBatches.length,
    draft: uploadBatches.filter((batch) => batch.status === "draft").length,
    uploaded: uploadBatches.filter((batch) => batch.status === "uploaded").length,
    ready: uploadBatches.filter((batch) => batch.status === "ready_for_processing").length,
    failed: uploadBatches.filter((batch) => batch.status === "failed").length,
  }), [uploadBatches])
  const filteredBatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return uploadBatches.filter((batch) => {
      const exam = exams.find((item) => item.id === batch.examId)
      const centre = nodalCentres.find((item) => item.id === batch.nodalCentreId)
      const uploader = uploaders.find((item) => item.id === batch.uploaderId)
      const matchesSearch = query.length === 0 || batch.batchNumber.toLowerCase().includes(query) || exam?.name.toLowerCase().includes(query) || centre?.name.toLowerCase().includes(query) || uploader?.name.toLowerCase().includes(query)
      return matchesSearch && (statusFilter === "all" || batch.status === statusFilter)
    })
  }, [exams, nodalCentres, searchQuery, statusFilter, uploadBatches, uploaders])
  const selectedBatch = uploadBatches.find((batch) => batch.id === selectedBatchId) ?? null

  function getExam(batch: UploadBatch) { return exams.find((exam) => exam.id === batch.examId) }
  function getCentre(batch: UploadBatch) { return nodalCentres.find((centre) => centre.id === batch.nodalCentreId) }
  function getUploader(batch: UploadBatch) { return uploaders.find((uploader) => uploader.id === batch.uploaderId) }

  if (!hydrated) return <UploadBatchesSkeleton />
  const statCards = [
    { label: "Total batches", value: counts.total, tone: "text-foreground" },
    { label: "Draft", value: counts.draft, tone: "text-muted-foreground" },
    { label: "Uploaded", value: counts.uploaded, tone: "text-sky-700 dark:text-sky-300" },
    { label: "Ready for processing", value: counts.ready, tone: "text-emerald-700 dark:text-emerald-300" },
  ]

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl space-y-2"><p className="text-sm font-medium text-muted-foreground">University Admin</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Upload Batch Intake</h1><p className="text-sm leading-6 text-muted-foreground">Review scanned answer-sheet and roll-sheet intake metadata before the later processing workflow begins.</p></div><Button variant="outline" render={<Link href="/uploader/upload-batches" />}><FileStack data-icon="inline-start" className="size-4" />Open Uploader Intake</Button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Upload batch summary">{statCards.map((stat) => <Card key={stat.label} size="sm"><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">{stat.label}</p><p className={cn("text-3xl font-semibold", stat.tone)}>{stat.value}</p></CardContent></Card>)}</section>
    <Card><CardHeader><CardTitle>Upload batches</CardTitle><CardDescription>Each batch joins an approved uploader, nodal centre, exam, scanned PDF metadata, and roll-sheet metadata.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px]"><div className="space-y-2"><Label htmlFor="batch-search">Search batches</Label><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="batch-search" className="pl-8" placeholder="Batch, exam, centre, uploader" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="batch-status">Status</Label><select id="batch-status" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="uploaded">Uploaded</option><option value="ready_for_processing">Ready for processing</option><option value="failed">Failed</option></select></div></div>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[1000px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Batch</th><th className="px-4 py-3 font-medium">Exam</th><th className="px-4 py-3 font-medium">Nodal centre</th><th className="px-4 py-3 font-medium">Uploader</th><th className="px-4 py-3 font-medium">Intake files</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Details</th></tr></thead><tbody className="divide-y">
        {filteredBatches.map((batch) => <tr key={batch.id}><td className="px-4 py-3"><p className="font-medium">{batch.batchNumber}</p><p className="text-xs text-muted-foreground">{formatDate(batch.uploadedAt)}</p></td><td className="max-w-[240px] px-4 py-3 text-muted-foreground">{getExam(batch)?.name ?? "Unknown exam"}</td><td className="px-4 py-3 text-muted-foreground">{getCentre(batch)?.name ?? "Unknown centre"}</td><td className="px-4 py-3 text-muted-foreground">{getUploader(batch)?.name ?? "Unknown uploader"}</td><td className="px-4 py-3 text-xs text-muted-foreground"><p>{batch.scannedPdf.fileName}</p><p>{batch.rollSheet.fileName}</p></td><td className="px-4 py-3"><BatchStatusBadge status={batch.status} /></td><td className="px-4 py-3 text-right"><Button variant="outline" size="sm" onClick={() => setSelectedBatchId(batch.id)}><Eye data-icon="inline-start" className="size-3.5" />Details</Button></td></tr>)}
        {filteredBatches.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">No upload batches match the current filters.</td></tr>}
      </tbody></table></div>
    </CardContent></Card>
    <Dialog open={Boolean(selectedBatch)} onOpenChange={(open) => !open && setSelectedBatchId(null)}><DialogContent className="sm:max-w-2xl">{selectedBatch && <><DialogHeader><DialogTitle>{selectedBatch.batchNumber}</DialogTitle><DialogDescription>Upload batch intake metadata. Processing is handled by a later task.</DialogDescription></DialogHeader><div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Exam</dt><dd className="mt-1 text-sm">{getExam(selectedBatch)?.name ?? "Unknown exam"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Status</dt><dd className="mt-1"><BatchStatusBadge status={selectedBatch.status} /></dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Nodal centre</dt><dd className="mt-1 text-sm">{getCentre(selectedBatch)?.name ?? "Unknown centre"}</dd></div><div><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">Uploader</dt><dd className="mt-1 text-sm">{getUploader(selectedBatch)?.name ?? "Unknown uploader"}</dd></div></dl><div className="rounded-lg border bg-muted/25 p-4 text-sm"><p className="font-medium">Scanned PDF</p><p className="mt-1 text-muted-foreground">{selectedBatch.scannedPdf.fileName} · {formatFileSize(selectedBatch.scannedPdf.fileSize)}</p><p className="text-xs text-muted-foreground">{selectedBatch.scannedPdf.demoReference}</p></div><div className="rounded-lg border bg-muted/25 p-4 text-sm"><p className="font-medium">Roll sheet</p><p className="mt-1 text-muted-foreground">{selectedBatch.rollSheet.fileName} · {formatFileSize(selectedBatch.rollSheet.fileSize)}</p><p className="text-xs text-muted-foreground">{selectedBatch.rollSheet.demoReference}</p></div>{selectedBatch.remarks && <p className="text-sm text-muted-foreground">{selectedBatch.remarks}</p>}</div><DialogFooter showCloseButton /></>}</DialogContent></Dialog>
  </div>
}
