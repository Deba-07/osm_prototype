import { answerSheets } from "@/data/answer-sheets"
import { affiliatedColleges } from "@/data/colleges"
import { nodalCentres } from "@/data/nodal-centres"
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
