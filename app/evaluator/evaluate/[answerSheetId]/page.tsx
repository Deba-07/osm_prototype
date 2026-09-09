import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"
import { subjects } from "@/data/subjects"

type EvaluatorEvaluatePageProps = {
  params: Promise<{
    answerSheetId: string
  }>
}

export default async function EvaluatorEvaluatePage({
  params,
}: EvaluatorEvaluatePageProps) {
  const { answerSheetId } = await params
  const answerSheet = answerSheets.find((item) => item.id === answerSheetId)
  const subject = subjects.find((item) => item.id === answerSheet?.subjectId)

  return (
    <RoutePlaceholder
      eyebrow="Evaluator"
      title="Evaluate answer sheet"
      description="This dynamic route is reserved for the future marking workspace."
      stats={[
        { label: "Answer sheet", value: answerSheet?.id ?? answerSheetId },
        { label: "Subject", value: subject?.code ?? "Unknown" },
        {
          label: "Status",
          value: answerSheet?.status ?? "Not found",
        },
      ]}
    />
  )
}
