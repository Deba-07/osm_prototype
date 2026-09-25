import { answerSheets } from "@/data/answer-sheets"
import { affiliatedColleges } from "@/data/colleges"
import { nodalCentres } from "@/data/nodal-centres"
import { uploaders } from "@/data/uploaders"
import { uploadBatches } from "@/data/upload-batches"
import { pdfProcessingJobs } from "@/data/pdf-processing"
import {
  examInCharges,
  exams,
  markingSchemes,
  questionPapers,
} from "@/data/exams"
import { initialEvaluations } from "@/data/evaluations"
import { examQuestions } from "@/data/questions"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { universityContext } from "@/data/university"
import type { ExamPaperType } from "@/types/osm"

export type MockDataValidationResult = {
  success: boolean
  errors: string[]
}

const validPaperTypes: ExamPaperType[] = [
  "regular",
  "midterm",
  "supplementary",
]

function collectIds(items: Array<{ id: string }>) {
  return new Set(items.map((item) => item.id))
}

function addMissingReferenceError({
  errors,
  entity,
  entityId,
  field,
  referencedId,
}: {
  errors: string[]
  entity: string
  entityId: string
  field: string
  referencedId: string
}) {
  errors.push(
    `${entity} ${entityId} references missing ${field} ${referencedId}.`
  )
}

export function validateMockDataRelationships(): MockDataValidationResult {
  const errors: string[] = []
  const semesterIds = collectIds(semesters)
  const subjectIds = collectIds(subjects)
  const examIds = collectIds(exams)
  const questionPaperIds = collectIds(questionPapers)
  const markingSchemeIds = collectIds(markingSchemes)
  const examInChargeIds = collectIds(examInCharges)
  const collegeIds = collectIds(affiliatedColleges)
  const universityIds = new Set([universityContext.id])
  const answerSheetIds = collectIds(answerSheets)
  const questionIds = collectIds(examQuestions)

  for (const nodalCentre of nodalCentres) {
    if (!universityIds.has(nodalCentre.instituteId)) {
      addMissingReferenceError({
        errors,
        entity: "Nodal centre",
        entityId: nodalCentre.id,
        field: "institute",
        referencedId: nodalCentre.instituteId,
      })
    }

    const college = affiliatedColleges.find(
      (item) => item.id === nodalCentre.affiliatedCollegeId
    )

    if (!college) {
      addMissingReferenceError({
        errors,
        entity: "Nodal centre",
        entityId: nodalCentre.id,
        field: "affiliated college",
        referencedId: nodalCentre.affiliatedCollegeId,
      })
    } else if (college.instituteId !== nodalCentre.instituteId) {
      errors.push(
        `Nodal centre ${nodalCentre.id} crosses institutes between ${nodalCentre.instituteId} and ${college.instituteId}.`
      )
    }
  }

  for (const uploader of uploaders) {
    const college = affiliatedColleges.find((item) => item.id === uploader.collegeId)
    const nodalCentre = nodalCentres.find((item) => item.id === uploader.nodalCentreId)

    if (!college) {
      addMissingReferenceError({
        errors,
        entity: "Uploader",
        entityId: uploader.id,
        field: "affiliated college",
        referencedId: uploader.collegeId,
      })
    }

    if (!nodalCentre) {
      addMissingReferenceError({
        errors,
        entity: "Uploader",
        entityId: uploader.id,
        field: "nodal centre",
        referencedId: uploader.nodalCentreId,
      })
    }

    if (college && nodalCentre && nodalCentre.affiliatedCollegeId !== college.id) {
      errors.push(
        "Uploader " +
          uploader.id +
          " assigns nodal centre " +
          nodalCentre.id +
          " to the wrong affiliated college."
      )
    }
  }

  const batchIds = collectIds(uploadBatches)
  if (batchIds.size !== uploadBatches.length) {
    errors.push("Upload batches must have unique IDs.")
  }

  for (const batch of uploadBatches) {
    const exam = exams.find((item) => item.id === batch.examId)
    const nodalCentre = nodalCentres.find(
      (item) => item.id === batch.nodalCentreId
    )
    const uploader = uploaders.find((item) => item.id === batch.uploaderId)

    if (!exam) {
      addMissingReferenceError({
        errors,
        entity: "Upload batch",
        entityId: batch.id,
        field: "exam",
        referencedId: batch.examId,
      })
    }

    if (!nodalCentre) {
      addMissingReferenceError({
        errors,
        entity: "Upload batch",
        entityId: batch.id,
        field: "nodal centre",
        referencedId: batch.nodalCentreId,
      })
    }

    if (!uploader) {
      addMissingReferenceError({
        errors,
        entity: "Upload batch",
        entityId: batch.id,
        field: "uploader",
        referencedId: batch.uploaderId,
      })
    } else if (uploader.status !== "approved") {
      errors.push("Upload batch " + batch.id + " uses a non-approved uploader.")
    }

    if (nodalCentre && uploader && uploader.nodalCentreId !== nodalCentre.id) {
      errors.push(
        "Upload batch " +
          batch.id +
          " assigns uploader " +
          uploader.id +
          " to an unrelated nodal centre."
      )
    }

    if (!batch.scannedPdf.fileName.toLowerCase().endsWith(".pdf")) {
      errors.push("Upload batch " + batch.id + " does not reference a PDF scan.")
    }

    if (!batch.rollSheet.fileName) {
      errors.push("Upload batch " + batch.id + " is missing a roll sheet.")
    }
  }

  for (const job of pdfProcessingJobs) {
    if (!batchIds.has(job.uploadBatchId)) {
      addMissingReferenceError({
        errors,
        entity: "PDF processing job",
        entityId: job.id,
        field: "upload batch",
        referencedId: job.uploadBatchId,
      })
    }

    if (job.status === "completed" && job.progress !== 100) {
      errors.push("Completed PDF processing jobs must have 100% progress.")
    }
  }

  if (!examInChargeIds.has(universityContext.examInChargeId)) {
    addMissingReferenceError({
      errors,
      entity: "University",
      entityId: universityContext.id,
      field: "exam-in-charge",
      referencedId: universityContext.examInChargeId,
    })
  }

  for (const collegeId of universityContext.affiliatedCollegeIds) {
    if (!collegeIds.has(collegeId)) {
      addMissingReferenceError({
        errors,
        entity: "University",
        entityId: universityContext.id,
        field: "affiliated college",
        referencedId: collegeId,
      })
    }
  }

  for (const college of affiliatedColleges) {
    if (college.instituteId !== universityContext.id) {
      errors.push(
        `Affiliated college ${college.id} belongs to ${college.instituteId}, not ${universityContext.id}.`
      )
    }
  }

  for (const exam of exams) {
    if (!semesterIds.has(exam.semesterId)) {
      addMissingReferenceError({
        errors,
        entity: "Exam",
        entityId: exam.id,
        field: "semester",
        referencedId: exam.semesterId,
      })
    }

    if (!subjectIds.has(exam.subjectId)) {
      addMissingReferenceError({
        errors,
        entity: "Exam",
        entityId: exam.id,
        field: "subject",
        referencedId: exam.subjectId,
      })
    }

    if (!validPaperTypes.includes(exam.paperType)) {
      errors.push(`Exam ${exam.id} has invalid paper type ${exam.paperType}.`)
    }

    if (!questionPaperIds.has(exam.questionPaperId)) {
      addMissingReferenceError({
        errors,
        entity: "Exam",
        entityId: exam.id,
        field: "question paper",
        referencedId: exam.questionPaperId,
      })
    }

    if (!markingSchemeIds.has(exam.markingSchemeId)) {
      addMissingReferenceError({
        errors,
        entity: "Exam",
        entityId: exam.id,
        field: "marking scheme",
        referencedId: exam.markingSchemeId,
      })
    }

    if (!examInChargeIds.has(exam.examInChargeId)) {
      addMissingReferenceError({
        errors,
        entity: "Exam",
        entityId: exam.id,
        field: "exam-in-charge",
        referencedId: exam.examInChargeId,
      })
    }
  }

  for (const question of examQuestions) {
    if (!examIds.has(question.examId)) {
      addMissingReferenceError({
        errors,
        entity: "Question",
        entityId: question.id,
        field: "exam",
        referencedId: question.examId,
      })
    }

    if (!subjectIds.has(question.subjectId)) {
      addMissingReferenceError({
        errors,
        entity: "Question",
        entityId: question.id,
        field: "subject",
        referencedId: question.subjectId,
      })
    }
  }

  for (const answerSheet of answerSheets) {
    const exam = exams.find((item) => item.id === answerSheet.examId)

    if (!exam) {
      addMissingReferenceError({
        errors,
        entity: "Answer sheet",
        entityId: answerSheet.id,
        field: "exam",
        referencedId: answerSheet.examId,
      })
    } else if (exam.subjectId !== answerSheet.subjectId) {
      errors.push(
        `Answer sheet ${answerSheet.id} subject ${answerSheet.subjectId} does not match exam ${exam.id}.`
      )
    }

    if (!semesterIds.has(answerSheet.semesterId)) {
      addMissingReferenceError({
        errors,
        entity: "Answer sheet",
        entityId: answerSheet.id,
        field: "semester",
        referencedId: answerSheet.semesterId,
      })
    }

    if (!subjectIds.has(answerSheet.subjectId)) {
      addMissingReferenceError({
        errors,
        entity: "Answer sheet",
        entityId: answerSheet.id,
        field: "subject",
        referencedId: answerSheet.subjectId,
      })
    }
  }

  for (const evaluation of initialEvaluations) {
    if (!answerSheetIds.has(evaluation.answerSheetId)) {
      addMissingReferenceError({
        errors,
        entity: "Evaluation",
        entityId: evaluation.id,
        field: "answer sheet",
        referencedId: evaluation.answerSheetId,
      })
    }

    if (!examIds.has(evaluation.examId)) {
      addMissingReferenceError({
        errors,
        entity: "Evaluation",
        entityId: evaluation.id,
        field: "exam",
        referencedId: evaluation.examId,
      })
    }

    for (const questionMark of evaluation.questionMarks) {
      if (!questionIds.has(questionMark.questionId)) {
        addMissingReferenceError({
          errors,
          entity: "Evaluation",
          entityId: evaluation.id,
          field: "question",
          referencedId: questionMark.questionId,
        })
      }
    }
  }

  return {
    success: errors.length === 0,
    errors,
  }
}
