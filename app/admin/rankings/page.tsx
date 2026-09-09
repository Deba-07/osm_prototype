import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { initialEvaluations } from "@/data/evaluations"
import { exams } from "@/data/exams"
import { students } from "@/data/students"
import { subjects } from "@/data/subjects"
import { rankStudentResults } from "@/lib/rankings"
import { deriveResultsFromEvaluations } from "@/lib/results"

export default function AdminRankingsPage() {
  const rankings = rankStudentResults(
    deriveResultsFromEvaluations({
      evaluations: initialEvaluations,
      students,
      subjects,
      exams,
    })
  )

  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Rankings"
      description="A future ranking view that will sort derived student results rather than use hard-coded ranking records."
      stats={[
        { label: "Ranked results", value: rankings.length },
        {
          label: "Top available rank",
          value: rankings[0]?.rank ?? "N/A",
        },
        { label: "Ranking source", value: "Evaluations" },
      ]}
    />
  )
}
