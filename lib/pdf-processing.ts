import type { PdfProcessingJob, UploadBatch } from "@/types/osm"

export function canStartPdfProcessing({
  batch,
  job,
}: {
  batch: UploadBatch | undefined
  job: PdfProcessingJob | undefined
}) {
  if (!batch) return "Select a valid upload batch."
  if (!batch.scannedPdf.fileName) return "This batch has no scanned PDF metadata."
  if (batch.status !== "uploaded" && batch.status !== "ready_for_processing") {
    return "Only uploaded or ready batches can be processed."
  }
  if (job?.status === "completed") return "This batch has already completed processing."

  return undefined
}
