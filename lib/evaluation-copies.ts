import { getProcessedPages } from "@/lib/script-masking"
import type {
  AnswerSheet,
  AdminAdjustment,
  Evaluation,
  EvaluationCopy,
  EvaluationCopyType,
  Evaluator,
  Exam,
  ProcessedScript,
  ScriptMapping,
  Student,
  Subject,
} from "@/types/osm"

export const DEMO_COPY_SCRIPT_ID = "script-batch-002-001"
export const DEMO_COPY_LABEL = "Script #23CSE001"

export type EvaluationCopyContext = {
  copy: EvaluationCopy
  script?: ProcessedScript
  pages: ReturnType<typeof getProcessedPages>
  mapping?: ScriptMapping
  student?: Student
  answerSheet?: AnswerSheet
  evaluation?: Evaluation
  evaluator?: Evaluator
  exam?: Exam
  subject?: Subject
  adjustment?: AdminAdjustment
  finalMarks?: number
}

function findEvaluation({
  answerSheet,
  evaluations,
}: {
  answerSheet?: AnswerSheet
  evaluations: Evaluation[]
}) {
  if (!answerSheet) return undefined
  return evaluations.find((evaluation) => evaluation.answerSheetId === answerSheet.id)
}

export function getEvaluationCopyContext({
  scriptId,
  type,
  scripts,
  mappings,
  students,
  answerSheets,
  evaluations,
  evaluators,
  exams,
  subjects,
  adminAdjustments = [],
}: {
  scriptId: string
  type: EvaluationCopyType
  scripts: ProcessedScript[]
  mappings: ScriptMapping[]
  students: Student[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
  evaluators: Evaluator[]
  exams: Exam[]
  subjects: Subject[]
  adminAdjustments?: AdminAdjustment[]
}): EvaluationCopyContext {
  const script = scripts.find((item) => item.id === scriptId)
  const mapping = mappings.find((item) => item.scriptId === scriptId)
  const student = mapping?.studentId
    ? students.find((item) => item.id === mapping.studentId)
    : undefined
  const answerSheet = answerSheets.find(
    (item) =>
      item.processedScriptId === scriptId ||
      (student ? item.studentId === student.id : false)
  )
  const evaluation = findEvaluation({ answerSheet, evaluations })
  const evaluator = evaluation
    ? evaluators.find((item) => item.id === evaluation.evaluatorId)
    : answerSheet?.assignedEvaluatorId
      ? evaluators.find((item) => item.id === answerSheet.assignedEvaluatorId)
      : undefined
  const exam = answerSheet
    ? exams.find((item) => item.id === answerSheet.examId)
    : undefined
  const subject = answerSheet
    ? subjects.find((item) => item.id === answerSheet.subjectId)
    : undefined
  const isPreAvailable = Boolean(script)
  const isPostAvailable = evaluation?.status === "submitted"
  const available = type === "pre_evaluation" ? isPreAvailable : isPostAvailable
  const timestamp =
    type === "post_evaluation"
      ? evaluation?.submittedAt ?? script?.generatedAt ?? ""
      : script?.generatedAt ?? ""

  return {
    copy: {
      id: `${scriptId}-${type}`,
      scriptId,
      type,
      createdAt: timestamp,
      sourceVersion: script?.generatedAt ?? "unavailable",
      status: available ? "available" : "unavailable",
    },
    script,
    pages: script ? getProcessedPages(script) : [],
    mapping,
    student,
    answerSheet,
    evaluation,
    evaluator,
    exam,
    subject,
    adjustment: evaluation
      ? adminAdjustments.find((item) => item.evaluationId === evaluation.id)
      : undefined,
    finalMarks: evaluation
      ? adminAdjustments.find((item) => item.evaluationId === evaluation.id)?.finalMarks ?? evaluation.totalMarks
      : undefined,
  }
}
