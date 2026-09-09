import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"
import { evaluators } from "@/data/evaluators"

export default function EvaluatorDashboardPage() {
  return (
    <RoutePlaceholder
      eyebrow="Evaluator"
      title="Dashboard"
      description="A lightweight landing route for future faculty assignment and evaluation progress summaries."
      stats={[
        {
          label: "Approved evaluators",
          value: evaluators.filter(
            (evaluator) => evaluator.status === "approved"
          ).length,
        },
        {
          label: "Assigned sheets",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "assigned"
          ).length,
        },
        {
          label: "In progress",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "in_progress"
          ).length,
        },
      ]}
    />
  )
}
