import { RoutePlaceholder } from "@/components/layout/route-placeholder"
import { programs } from "@/data/programs"
import { students } from "@/data/students"

export default function AdminStudentsPage() {
  return (
    <RoutePlaceholder
      eyebrow="Admin"
      title="Students"
      description="A future review area for student rosters and academic context."
      stats={[
        { label: "Mock students", value: students.length },
        { label: "Programs", value: programs.length },
        {
          label: "Semester 4 students",
          value: students.filter(
            (student) => student.currentSemesterId === "sem-4"
          ).length,
        },
      ]}
    />
  )
}
