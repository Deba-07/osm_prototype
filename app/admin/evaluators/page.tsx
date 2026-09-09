import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { evaluators } from "@/data/evaluators"

export default function AdminEvaluatorsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Evaluators"
      description="A future approval queue for faculty evaluator registrations."
      stats={[
        {
          label: "Approved",
          value: evaluators.filter(
            (evaluator) => evaluator.status === "approved"
          ).length,
        },
        {
          label: "Pending",
          value: evaluators.filter(
            (evaluator) => evaluator.status === "pending"
          ).length,
        },
        {
          label: "Rejected",
          value: evaluators.filter(
            (evaluator) => evaluator.status === "rejected"
          ).length,
        },
      ]}
    />
  )
}
