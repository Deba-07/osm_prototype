import { EvaluationWorkspace } from "@/components/evaluator/evaluation/evaluation-workspace"

type EvaluatorEvaluatePageProps = {
  params: Promise<{
    answerSheetId: string
  }>
}

export default async function EvaluatorEvaluatePage({
  params,
}: EvaluatorEvaluatePageProps) {
  const { answerSheetId } = await params

  return <EvaluationWorkspace answerSheetId={answerSheetId} />
}
