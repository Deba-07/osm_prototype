import type { UploadBatch } from "@/types/osm"

export const uploadBatches: UploadBatch[] = [
  {
    id: "batch-001",
    batchNumber: "OSM-BATCH-001",
    nodalCentreId: "centre-dsu-001",
    uploaderId: "uploader-001",
    examId: "exam-2026-sem2-ec102-regular",
    scannedPdf: {
      fileName: "NC-DSU-001-EC102-answer-sheets-01.pdf",
      fileSize: 18432000,
      fileType: "application/pdf",
      uploadedAt: "2026-08-21T10:30:00.000Z",
      demoReference: "demo://batch-001/scanned-pdf",
    },
    rollSheet: {
      fileName: "NC-DSU-001-EC102-roll-sheet.xlsx",
      fileSize: 48200,
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      uploadedAt: "2026-08-21T10:31:00.000Z",
      demoReference: "demo://batch-001/roll-sheet",
    },
    status: "uploaded",
    uploadedAt: "2026-08-21T10:31:00.000Z",
    remarks: "Morning session intake from the main engineering centre.",
  },
  {
    id: "batch-002",
    batchNumber: "OSM-BATCH-002",
    nodalCentreId: "centre-dsu-001",
    uploaderId: "uploader-001",
    examId: "exam-2026-sem4-cs204-regular",
    scannedPdf: {
      fileName: "NC-WIT-002-CS204-answer-sheets-01.pdf",
      fileSize: 22641000,
      fileType: "application/pdf",
      uploadedAt: "2026-08-24T13:45:00.000Z",
      demoReference: "demo://batch-002/scanned-pdf",
    },
    rollSheet: {
      fileName: "NC-WIT-002-CS204-roll-sheet.csv",
      fileSize: 18400,
      fileType: "text/csv",
      uploadedAt: "2026-08-24T13:46:00.000Z",
      demoReference: "demo://batch-002/roll-sheet",
    },
    status: "ready_for_processing",
    uploadedAt: "2026-08-24T13:46:00.000Z",
    remarks: "All intake artifacts supplied for the afternoon session.",
  },
]
