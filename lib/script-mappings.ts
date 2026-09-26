import type {
  Exam,
  ProcessedScript,
  ScriptMapping,
  ScriptMappingInput,
  Student,
  UploadBatch,
} from "@/types/osm"

export type ScriptMappingValidation = {
  status: ScriptMapping["status"]
  issues: string[]
  script?: ProcessedScript
  student?: Student
  batch?: UploadBatch
  exam?: Exam
}

export function validateScriptMapping({
  mapping,
  input,
  scripts,
  students,
  batches,
  exams,
  mappings,
}: {
  mapping?: Pick<ScriptMapping, "id" | "startPage" | "endPage" | "pageCount">
  input: ScriptMappingInput
  scripts: ProcessedScript[]
  students: Student[]
  batches: UploadBatch[]
  exams: Exam[]
  mappings: ScriptMapping[]
}): ScriptMappingValidation {
  const issues: string[] = []
  const script = scripts.find((item) => item.id === input.scriptId)
  const batch = script
    ? batches.find((item) => item.id === script.uploadBatchId)
    : undefined
  const exam = batch ? exams.find((item) => item.id === batch.examId) : undefined
  const student = input.studentId
    ? students.find((item) => item.id === input.studentId)
    : input.rollNumber
      ? students.find((item) => item.rollNumber === input.rollNumber?.trim())
      : undefined

  if (!script) {
    issues.push("Processed script does not exist.")
  }

  if (!batch) {
    issues.push("Upload batch context is missing for this script.")
  }

  if (!exam) {
    issues.push("Exam context is missing for this script.")
  }

  if (!input.rollNumber?.trim()) {
    issues.push("Roll number could not be identified from the script.")
  } else if (!student) {
    issues.push("Roll number does not match a known student.")
  } else if (student.rollNumber !== input.rollNumber.trim()) {
    issues.push("Roll number does not match the selected student.")
  }

  if (student && batch && exam) {
    const duplicate = mappings.some((item) => {
      if (item.id === mapping?.id || !item.rollNumber) return false
      const otherScript = scripts.find((scriptItem) => scriptItem.id === item.scriptId)
      const otherBatch = otherScript
        ? batches.find((batchItem) => batchItem.id === otherScript.uploadBatchId)
        : undefined
      return (
        item.rollNumber === input.rollNumber?.trim() &&
        otherBatch?.examId === exam.id
      )
    })

    if (duplicate) {
      issues.push("Duplicate roll number detected in this exam.")
    }

    const studentAlreadyMapped = mappings.some((item) => {
      if (item.id === mapping?.id || !item.studentId) return false
      const otherScript = scripts.find((scriptItem) => scriptItem.id === item.scriptId)
      const otherBatch = otherScript
        ? batches.find((batchItem) => batchItem.id === otherScript.uploadBatchId)
        : undefined
      return item.studentId === student.id && otherBatch?.examId === exam.id
    })

    if (studentAlreadyMapped) {
      issues.push("Student is already mapped to another script in this exam.")
    }
  }

  if (script) {
    const startPage = mapping?.startPage ?? script.startPage
    const endPage = mapping?.endPage ?? script.endPage
    const pageCount = mapping?.pageCount ?? script.pageCount

    if (startPage < 1 || endPage < startPage) {
      issues.push("Page range is invalid.")
    }

    if (pageCount !== endPage - startPage + 1) {
      issues.push("Page count does not match the page range.")
    }

    if (
      startPage !== script.startPage ||
      endPage !== script.endPage ||
      pageCount !== script.pageCount
    ) {
      issues.push("Page range does not match the generated script.")
    }
  }

  const hasDuplicate = issues.some((issue) =>
    issue.includes("Duplicate roll number") || issue.includes("already mapped")
  )

  return {
    status: issues.length === 0 ? "valid" : hasDuplicate ? "review" : "invalid",
    issues,
    script,
    student,
    batch,
    exam,
  }
}
