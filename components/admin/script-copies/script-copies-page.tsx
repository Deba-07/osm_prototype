"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { subjects } from "@/data/subjects"
import { DEMO_COPY_LABEL, DEMO_COPY_SCRIPT_ID, getEvaluationCopyContext } from "@/lib/evaluation-copies"
import { useOsmStore } from "@/stores/osm-store"
import { FileArchive, FileCheck2 } from "lucide-react"
import Link from "next/link"

function ScriptCopiesSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-80" /></div>
}

export function ScriptCopiesPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const scripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const students = useOsmStore((state) => state.students)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const adminAdjustments = useOsmStore((state) => state.adminAdjustments)
  const evaluators = useOsmStore((state) => state.evaluators)
  const exams = useOsmStore((state) => state.exams)

  if (!hydrated) return <ScriptCopiesSkeleton />
  if (currentUser?.role !== "admin") {
    return <EvaluatorAccessState title="Admin access required" description="Pre- and post-evaluation copies are available only in the Admin workspace." />
  }

  const pre = getEvaluationCopyContext({ scriptId: DEMO_COPY_SCRIPT_ID, type: "pre_evaluation", scripts, mappings, students, answerSheets, evaluations, evaluators, exams, subjects, adminAdjustments })
  const post = getEvaluationCopyContext({ scriptId: DEMO_COPY_SCRIPT_ID, type: "post_evaluation", scripts, mappings, students, answerSheets, evaluations, evaluators, exams, subjects, adminAdjustments })

  return (
    <div className="space-y-6">
      <section className="space-y-2"><p className="text-sm font-medium text-primary">Post-evaluation management</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Script Copies</h1><p className="max-w-3xl text-sm leading-6 text-muted-foreground">Read-only Admin views of the source script before evaluation and after a submitted evaluation. These are derived views, not duplicated files.</p></section>
      <Card><CardHeader><CardTitle>{DEMO_COPY_LABEL}</CardTitle><CardDescription>Target demo script linked to the existing processed script, mapping, student, and evaluation records.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-muted-foreground">Source script</p><p className="mt-1 font-medium">{DEMO_COPY_SCRIPT_ID}</p></div><div><p className="text-xs text-muted-foreground">Student</p><p className="mt-1 font-medium">{pre.student?.name ?? "Unavailable"}</p></div><div><p className="text-xs text-muted-foreground">Roll number</p><p className="mt-1 font-medium">{pre.mapping?.rollNumber ?? "Unavailable"}</p></div><div><p className="text-xs text-muted-foreground">Pages</p><p className="mt-1 font-medium">{pre.script?.pageCount ?? "Unavailable"}</p></div></div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-lg border bg-muted/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Pre-Evaluation Copy</p><p className="mt-1 text-sm text-muted-foreground">Original script structure before evaluator marks.</p></div><FileArchive className="size-5 text-muted-foreground" aria-hidden="true" /></div><div className="mt-4 flex items-center justify-between gap-3"><Badge variant="outline">{pre.copy.status === "available" ? "Available" : "Unavailable"}</Badge>{pre.copy.status === "available" ? <Button render={<Link href={`/admin/script-copies/${DEMO_COPY_SCRIPT_ID}/pre`} />}>View</Button> : <span className="text-xs text-muted-foreground">Script is not processed.</span>}</div></div><div className="rounded-lg border bg-muted/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">Post-Evaluation Copy</p><p className="mt-1 text-sm text-muted-foreground">Submitted evaluation state and question-wise marks.</p></div><FileCheck2 className="size-5 text-muted-foreground" aria-hidden="true" /></div><div className="mt-4 flex items-center justify-between gap-3"><Badge variant="outline">{post.copy.status === "available" ? "Available" : "Unavailable"}</Badge>{post.copy.status === "available" ? <Button render={<Link href={`/admin/script-copies/${DEMO_COPY_SCRIPT_ID}/post`} />}>View</Button> : <span className="text-xs text-muted-foreground">Available after submission.</span>}</div></div></div></CardContent></Card>
    </div>
  )
}
