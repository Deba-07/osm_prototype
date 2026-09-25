"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import type { RollSheetMetadata, ScannedPdfMetadata, UploadBatch } from "@/types/osm"
import { ArrowLeft, CheckCircle2, FileText, Send } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

function formatFileSize(size: number) {
  if (size < 1024) return size + " B"
  return (size / 1024 / 1024).toFixed(1) + " MB"
}

function getScannedPdfMetadata(file: File): ScannedPdfMetadata {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/pdf",
    uploadedAt: new Date().toISOString(),
    demoReference: "demo://local/scanned-pdf/" + file.name,
  }
}

function getRollSheetMetadata(file: File): RollSheetMetadata {
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
    demoReference: "demo://local/roll-sheet/" + file.name,
  }
}

function IntakeSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-[32rem]" /></div>
}

function SubmittedBatch({ batch, onCreateAnother }: { batch: UploadBatch; onCreateAnother: () => void }) {
  return <Card><CardHeader><div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700"><CheckCircle2 className="size-5" aria-hidden="true" /></div><div><CardTitle>Upload batch submitted</CardTitle><CardDescription>Both intake artifacts were recorded as metadata for the next processing task.</CardDescription></div></div></CardHeader><CardContent className="space-y-4"><div className="rounded-lg border bg-muted/25 p-4"><p className="font-medium">{batch.batchNumber}</p><p className="text-sm text-muted-foreground">{batch.scannedPdf.fileName} · {batch.rollSheet.fileName}</p><p className="mt-2 text-sm text-muted-foreground">Status: Ready for processing</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={onCreateAnother}>Create Another Batch</Button><Button render={<Link href="/login" />}>Back to Login</Button></div></CardContent></Card>
}

export function UploadBatchIntakePage() {
  const hydrated = useOsmStoreHydrated()
  const exams = useOsmStore((state) => state.exams)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const uploaders = useOsmStore((state) => state.uploaders)
  const createUploadBatch = useOsmStore((state) => state.createUploadBatch)
  const approvedUploaders = useMemo(() => uploaders.filter((uploader) => uploader.status === "approved"), [uploaders])
  const [uploaderId, setUploaderId] = useState("")
  const [examId, setExamId] = useState("")
  const [scannedPdf, setScannedPdf] = useState<ScannedPdfMetadata | undefined>()
  const [rollSheet, setRollSheet] = useState<RollSheetMetadata | undefined>()
  const [remarks, setRemarks] = useState("")
  const [error, setError] = useState<string | undefined>()
  const [submittedBatch, setSubmittedBatch] = useState<UploadBatch | null>(null)

  const selectedUploader = approvedUploaders.find((uploader) => uploader.id === uploaderId)
  const selectedCentre = nodalCentres.find((centre) => centre.id === selectedUploader?.nodalCentreId)
  const selectedExam = exams.find((exam) => exam.id === examId)

  function resetForm() {
    setUploaderId("")
    setExamId("")
    setScannedPdf(undefined)
    setRollSheet(undefined)
    setRemarks("")
    setError(undefined)
    setSubmittedBatch(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    if (!selectedUploader || !selectedCentre || !selectedExam || !scannedPdf || !rollSheet) {
      setError("Select an approved uploader, exam, scanned PDF, and roll sheet.")
      return
    }
    const batch = createUploadBatch({
      uploaderId: selectedUploader.id,
      nodalCentreId: selectedCentre.id,
      examId: selectedExam.id,
      scannedPdf,
      rollSheet,
      remarks: remarks.trim() || undefined,
    })
    if (!batch) {
      setError("This batch could not be created. Check the uploader, centre, exam, and file metadata.")
      return
    }
    setSubmittedBatch(batch)
    toast.success("Upload batch submitted for processing.")
  }

  if (!hydrated) return <IntakeSkeleton />
  if (submittedBatch) return <SubmittedBatch batch={submittedBatch} onCreateAnother={resetForm} />

  return <main className="min-h-screen bg-muted/25 px-4 py-8 md:py-10"><div className="mx-auto w-full max-w-4xl space-y-6"><div className="space-y-2"><Button variant="ghost" render={<Link href="/login" />}><ArrowLeft data-icon="inline-start" className="size-4" />Back to Login</Button><p className="text-sm font-medium text-muted-foreground">OSM · Approved uploader intake</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Create Upload Batch</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Submit scanned answer-sheet and roll-sheet metadata for an existing examination. No file contents are uploaded or processed in this demo.</p></div>
    <Card><CardHeader><CardTitle>Batch intake details</CardTitle><CardDescription>Only approved uploader records and their associated nodal centre can be used.</CardDescription></CardHeader><CardContent><form className="space-y-6" onSubmit={handleSubmit}>
      {error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="batch-uploader">Approved uploader</Label><select id="batch-uploader" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={uploaderId} onChange={(event) => setUploaderId(event.target.value)}><option value="">Select approved uploader</option>{approvedUploaders.map((uploader) => <option key={uploader.id} value={uploader.id}>{uploader.name} · {uploader.email}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="batch-centre">Associated nodal centre</Label><div id="batch-centre" className="flex min-h-8 items-center rounded-lg border bg-muted/25 px-2.5 text-sm text-muted-foreground">{selectedCentre ? selectedCentre.code + " · " + selectedCentre.name : "Select an approved uploader first"}</div></div>
        <div className="space-y-2 md:col-span-2"><Label htmlFor="batch-exam">Exam</Label><select id="batch-exam" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={examId} onChange={(event) => setExamId(event.target.value)}><option value="">Select exam</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · {exam.examDate}</option>)}</select></div>
      </div>
      {selectedExam && <div className="rounded-lg border bg-muted/25 p-3 text-sm"><p className="font-medium">{selectedExam.name}</p><p className="text-muted-foreground">Exam date {selectedExam.examDate} · {selectedExam.paperType} paper · {selectedExam.status}</p></div>}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="scanned-pdf">Scanned answer-sheet PDF</Label><Input id="scanned-pdf" type="file" accept=".pdf,application/pdf" onChange={(event) => { const file = event.target.files?.[0]; setScannedPdf(file ? getScannedPdfMetadata(file) : undefined) }} />{scannedPdf && <p className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="size-3.5" aria-hidden="true" />{scannedPdf.fileName} · {formatFileSize(scannedPdf.fileSize)}</p>}</div>
        <div className="space-y-2"><Label htmlFor="roll-sheet">Roll sheet</Label><Input id="roll-sheet" type="file" accept=".xlsx,.xls,.csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; setRollSheet(file ? getRollSheetMetadata(file) : undefined) }} />{rollSheet && <p className="flex items-center gap-2 text-xs text-muted-foreground"><FileText className="size-3.5" aria-hidden="true" />{rollSheet.fileName} · {formatFileSize(rollSheet.fileSize)}</p>}</div>
      </div>
      <div className="space-y-2"><Label htmlFor="batch-remarks">Remarks (optional)</Label><textarea id="batch-remarks" className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add a short intake note" /></div>
      <div className="flex justify-end border-t pt-6"><Button type="submit"><Send data-icon="inline-start" className="size-4" />Submit Upload Batch</Button></div>
    </form></CardContent></Card>
  </div></main>
}
