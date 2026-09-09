import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"
import { initialEvaluations } from "@/data/evaluations"

export default function EvaluatorCompletedPage() {
  return (
    <RoutePlaceholder
      eyebrow="Evaluator"
      title="Completed"
      description="A future list of submitted evaluations and completed answer sheets."
      stats={[
        {
          label: "Completed sheets",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "completed"
          ).length,
        },
        {
          label: "Submitted evaluations",
          value: initialEvaluations.length,
        },
        { label: "Draft evaluations", value: 0 },
      ]}
    />
  )
}
