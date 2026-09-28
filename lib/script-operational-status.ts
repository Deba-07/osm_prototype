import type {
  AnswerSheet,
  Evaluation,
  EvaluationSession,
  ProcessedScript,
  ScriptException,
  ScriptMapping,
} from "@/types/osm"

export type ScriptOperationalStatus =
  | "unprocessed"
  | "ready"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "exception"

export const scriptOperationalStatusLabels: Record<
  ScriptOperationalStatus,
  string
> = {
  unprocessed: "Unprocessed",
  ready: "Ready",
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted",
  exception: "Exception",
}

export function getScriptOperationalStatus({
  scriptId,
  scripts,
  mappings,
  answerSheets,
  evaluations,
  evaluationSessions,
  exceptions,
}: {
  scriptId: string
  scripts: ProcessedScript[]
  mappings: ScriptMapping[]
  answerSheets: AnswerSheet[]
  evaluations: Evaluation[]
  evaluationSessions: EvaluationSession[]
  exceptions: ScriptException[]
}): ScriptOperationalStatus {
  if (!scripts.some((script) => script.id === scriptId)) return "unprocessed"

  if (
    exceptions.some(
      (exception) =>
        exception.scriptId === scriptId && exception.status !== "resolved"
    )
  ) {
    return "exception"
  }

  const relatedSheets = answerSheets.filter(
    (answerSheet) =>
      (answerSheet.processedScriptId ?? answerSheet.id) === scriptId
  )
  if (
    relatedSheets.some((answerSheet) => answerSheet.status === "completed") ||
    evaluations.some(
      (evaluation) =>
        relatedSheets.some((sheet) => sheet.id === evaluation.answerSheetId) &&
        evaluation.status === "submitted"
    )
  ) {
    return "submitted"
  }

  if (
    relatedSheets.some((answerSheet) => answerSheet.status === "in_progress") ||
    evaluationSessions.some(
      (session) => session.scriptId === scriptId && session.status === "active"
    )
  ) {
    return "in_progress"
  }

  if (relatedSheets.some((answerSheet) => answerSheet.status === "assigned")) {
    return "assigned"
  }

  return mappings.some(
    (mapping) => mapping.scriptId === scriptId && mapping.status === "valid"
  )
    ? "ready"
    : "unprocessed"
}
