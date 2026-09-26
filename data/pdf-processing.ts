import type { PdfProcessingJob } from "@/types/osm"

export const pdfProcessingJobs: PdfProcessingJob[] = [
  {
    id: "pdf-job-batch-001",
    uploadBatchId: "batch-001",
    status: "received",
    totalPages: 0,
    detectedPages: 0,
    processedPages: 0,
    generatedScripts: 0,
    progress: 0,
  },
  {
    id: "pdf-job-batch-002",
    uploadBatchId: "batch-002",
    status: "completed",
    totalPages: 158,
    detectedPages: 158,
    processedPages: 158,
    generatedScripts: 5,
    progress: 100,
    startedAt: "2026-04-08T10:10:00.000Z",
    completedAt: "2026-04-08T10:16:00.000Z",
  },
]
