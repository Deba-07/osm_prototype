import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { departments } from "@/data/departments"
import { evaluators } from "@/data/evaluators"

export default function EvaluatorRegistrationPage() {
  return (
    <main className="flex flex-1 bg-muted/25 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <RoutePlaceholder
          eyebrow="Faculty"
          title="Evaluator registration"
          description="This route is reserved for the future faculty registration workflow. The demo store already supports pending evaluator registrations."
          stats={[
            { label: "Departments", value: departments.length },
            {
              label: "Pending evaluators",
              value: evaluators.filter(
                (evaluator) => evaluator.status === "pending"
              ).length,
            },
            {
              label: "Approved evaluators",
              value: evaluators.filter(
                (evaluator) => evaluator.status === "approved"
              ).length,
            },
          ]}
        />
      </div>
    </main>
  )
}
