import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"

export default function EvaluatorAssignedPage() {
  return (
    <RoutePlaceholder
      eyebrow="Evaluator"
      title="Assigned sheets"
      description="A future queue for answer sheets assigned to the logged-in evaluator."
      stats={[
        {
          label: "Assigned",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "assigned"
          ).length,
        },
        {
          label: "Ready to evaluate",
          value: answerSheets.filter(
            (answerSheet) =>
              answerSheet.status === "assigned" ||
              answerSheet.status === "in_progress"
          ).length,
        },
        { label: "Image paths modeled", value: "Yes" },
      ]}
    />
  )
}
