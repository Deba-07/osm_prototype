import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { answerSheets } from "@/data/answer-sheets"
import { departments } from "@/data/departments"
import { evaluators } from "@/data/evaluators"
import { students } from "@/data/students"
import { universityContext } from "@/data/university"
import { ArrowRight, School } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const approvedEvaluators = evaluators.filter(
    (evaluator) => evaluator.status === "approved"
  ).length

  return (
    <main className="flex flex-1 flex-col bg-background">
      <section className="border-b bg-muted/25">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold">OSM</p>
              <p className="text-sm text-muted-foreground">
                {universityContext.name}
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-4">
            <Badge variant="secondary">
              {universityContext.academicYear} prototype
            </Badge>
            <h1 className="text-3xl font-semibold tracking-normal md:text-4xl">
              Answer-sheet evaluation foundation
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              A typed demo base for university answer-sheet evaluation,
              evaluator approval, assignment tracking, result derivation, and
              ranking foundations.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Open demo login
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Admin routes
            </Link>
            <Link
              href="/evaluator/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Evaluator routes
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-4 md:px-8">
        {[
          ["Departments", departments.length],
          ["Students", students.length],
          ["Approved Evaluators", approvedEvaluators],
          ["Answer Sheets", answerSheets.length],
        ].map(([label, value]) => (
          <Card key={label} size="sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 md:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Foundation status</CardTitle>
            <CardDescription>
              Routes, typed mock data, and demo state are ready for the next
              workflow tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
            <p>Mock data is fictional and internally linked by stable IDs.</p>
            <p>Results and rankings are derived from submitted evaluations.</p>
            <p>Answer-sheet image paths are modeled but assets are not present.</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
