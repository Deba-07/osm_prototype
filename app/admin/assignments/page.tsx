import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"

export default function AdminAssignmentsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Assignments"
      description="A future workspace for assigning answer sheets to approved evaluators."
      stats={[
        {
          label: "Assigned",
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
        {
          label: "Completed",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "completed"
          ).length,
        },
      ]}
    />
  )
}
