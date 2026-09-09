import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { answerSheets } from "@/data/answer-sheets"

export default function AdminAnswerSheetsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Answer sheets"
      description="A future view for uploaded scanned answer sheets and assignment readiness."
      stats={[
        { label: "Total sheets", value: answerSheets.length },
        {
          label: "Unassigned",
          value: answerSheets.filter(
            (answerSheet) => answerSheet.status === "unassigned"
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
