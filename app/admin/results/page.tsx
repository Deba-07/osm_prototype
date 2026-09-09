import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { initialEvaluations } from "@/data/evaluations"
import { exams } from "@/data/exams"
import { students } from "@/data/students"
import { subjects } from "@/data/subjects"
import { deriveResultsFromEvaluations } from "@/lib/results"

export default function AdminResultsPage() {
  const results = deriveResultsFromEvaluations({
    evaluations: initialEvaluations,
    students,
    subjects,
    exams,
  })

  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Results"
      description="A future result view that will derive marks from submitted evaluations."
      stats={[
        { label: "Derived results", value: results.length },
        {
          label: "Submitted evaluations",
          value: initialEvaluations.length,
        },
        { label: "Subjects", value: subjects.length },
      ]}
    />
  )
}
