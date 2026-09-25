import type {
  Exam,
  NodalCentre,
  UploadBatchInput,
  Uploader,
} from "@/types/osm"

export function validateUploadBatchInput({
  input,
  exams,
  nodalCentres,
  uploaders,
}: {
  input: UploadBatchInput
  exams: Exam[]
  nodalCentres: NodalCentre[]
  uploaders: Uploader[]
}) {
  const exam = exams.find((item) => item.id === input.examId)
  const nodalCentre = nodalCentres.find(
    (item) => item.id === input.nodalCentreId
  )
  const uploader = uploaders.find((item) => item.id === input.uploaderId)

  if (!exam) return "Select a valid exam."
  if (!nodalCentre) return "Select a valid nodal centre."
  if (!uploader) return "Select a valid uploader."
  if (uploader.status !== "approved") {
    return "Only approved uploaders can submit an upload batch."
  }
  if (uploader.nodalCentreId !== nodalCentre.id) {
    return "The uploader must be associated with the selected nodal centre."
  }
  if (!input.scannedPdf.fileName.toLowerCase().endsWith(".pdf")) {
    return "The scanned answer-sheet file must be a PDF."
  }
  if (!input.rollSheet.fileName) {
    return "A roll sheet file is required."
  }

  return undefined
}

export function getNextUploadBatchNumber(uploadBatches: { batchNumber: string }[]) {
  const highestNumber = uploadBatches.reduce((highest, batch) => {
    const match = batch.batchNumber.match(/(\d+)$/)
    return Math.max(highest, match ? Number(match[1]) : 0)
  }, 0)

  return "OSM-BATCH-" + String(highestNumber + 1).padStart(3, "0")
}
