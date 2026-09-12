import { DashboardStatCard } from "@/components/admin/dashboard/dashboard-stat-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { departments } from "@/data/departments"
import { programs } from "@/data/programs"
import { semesters } from "@/data/semesters"
import { students } from "@/data/students"
import { universityContext } from "@/data/university"
import { BookOpen, GraduationCap, Users } from "lucide-react"

const departmentsById = new Map(
  departments.map((department) => [department.id, department])
)
const programsById = new Map(programs.map((program) => [program.id, program]))
const semestersById = new Map(
  semesters.map((semester) => [semester.id, semester])
)

export default function AdminStudentsPage() {
  const semester4Students = students.filter(
    (student) => student.currentSemesterId === "sem-4"
  ).length

  return (
    <div className="space-y-6">
      <section className="max-w-3xl space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          University Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Students
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Read-only student roster used for answer-sheet intake, evaluation
          context, results, and rankings for {universityContext.academicYear}.
        </p>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Student roster summary metrics"
      >
        <DashboardStatCard
          title="Mock Students"
          value={students.length}
          description="Seeded students available in the frontend demo store."
          icon={Users}
        />
        <DashboardStatCard
          title="Programs"
          value={programs.length}
          description="Academic programs represented across departments."
          icon={GraduationCap}
        />
        <DashboardStatCard
          title="Semester 4 Students"
          value={semester4Students}
          description="Students available for higher-semester answer sheets."
          icon={BookOpen}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Student Roster</CardTitle>
          <CardDescription>
            Academic context is displayed with friendly department, program,
            and semester labels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll Number</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const department = departmentsById.get(student.departmentId)
                const program = programsById.get(student.programId)
                const semester = semestersById.get(student.currentSemesterId)

                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.rollNumber}</TableCell>
                    <TableCell>{student.registrationNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {department?.code ?? "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{program?.code ?? "Unknown"}</TableCell>
                    <TableCell>{semester?.name ?? "Unknown"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
