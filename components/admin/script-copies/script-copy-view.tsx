"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getEvaluationCopyContext, DEMO_COPY_LABEL } from "@/lib/evaluation-copies"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { subjects } from "@/data/subjects"
import { useOsmStore } from "@/stores/osm-store"
import type { EvaluationCopyType } from "@/types/osm"
import { ArrowLeft, FileImage } from "lucide-react"
import Link from "next/link"

type ScriptCopyViewProps = { scriptId: string; type: EvaluationCopyType }

function formatDate(value?: string) {
  if (!value) return "Not available"
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

export function ScriptCopyView({ scriptId, type }: ScriptCopyViewProps) {
  const currentUser = useOsmStore((state) => state.currentUser)
  const hydrated = useOsmStoreHydrated()
  const scripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const students = useOsmStore((state) => state.students)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluators = useOsmStore((state) => state.evaluators)
  const exams = useOsmStore((state) => state.exams)
  const adminAdjustments = useOsmStore((state) => state.adminAdjustments)

  if (!hydrated) return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-[42rem]" /></div>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Evaluation copies are not available to evaluator accounts." />

  const context = getEvaluationCopyContext({ scriptId, type, scripts, mappings, students, answerSheets, evaluations, evaluators, exams, subjects, adminAdjustments })
  const title = type === "pre_evaluation" ? "PRE-EVALUATION COPY" : "POST-EVALUATION COPY"

  return (
    <div className="space-y-6"><Button variant="ghost" render={<Link href="/admin/script-copies" />}><ArrowLeft data-icon="inline-start" className="size-4" />Script Copies</Button><section className="space-y-2"><p className="text-sm font-medium text-primary">Admin read-only view</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">{title}</h1><p className="text-sm text-muted-foreground">{DEMO_COPY_LABEL} · Source: {scriptId}</p></section>{context.copy.status === "unavailable" ? <Card><CardContent className="p-8 text-center"><CardTitle>Copy unavailable</CardTitle><CardDescription className="mt-2">{type === "post_evaluation" ? "The post-evaluation copy is not available until an evaluation is submitted." : "The pre-evaluation copy is not available until the script is processed."}</CardDescription></CardContent></Card> : <><Card><CardHeader><CardTitle>Script metadata</CardTitle><CardDescription>This view references the original script and does not create a separate file or evaluation.</CardDescription></CardHeader><CardContent><dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs text-muted-foreground">Script</dt><dd className="mt-1 font-medium">{scriptId}</dd></div><div><dt className="text-xs text-muted-foreground">Student / roll</dt><dd className="mt-1 font-medium">{context.student?.name ?? "Unavailable"} / {context.mapping?.rollNumber ?? "Unavailable"}</dd></div><div><dt className="text-xs text-muted-foreground">Exam</dt><dd className="mt-1 font-medium">{context.exam?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs text-muted-foreground">Subject</dt><dd className="mt-1 font-medium">{context.subject?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs text-muted-foreground">Page count</dt><dd className="mt-1 font-medium">{context.script?.pageCount ?? 0}</dd></div><div><dt className="text-xs text-muted-foreground">Source version</dt><dd className="mt-1 font-medium">{formatDate(context.copy.sourceVersion)}</dd></div>{type === "post_evaluation" ? <><div><dt className="text-xs text-muted-foreground">Evaluator</dt><dd className="mt-1 font-medium">{context.evaluator?.name ?? "Unavailable"}</dd></div><div><dt className="text-xs text-muted-foreground">Submitted</dt><dd className="mt-1 font-medium">{formatDate(context.evaluation?.submittedAt)}</dd></div></> : null}</dl></CardContent></Card><Card><CardHeader><CardTitle>Page structure</CardTitle><CardDescription>{type === "pre_evaluation" ? "Original logical page structure. Evaluation marks are not applied in this copy." : "Original logical page structure alongside the submitted evaluation record."}</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{context.pages.map((page) => <div key={page.id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div className="flex items-center gap-2"><FileImage className="size-4 text-muted-foreground" aria-hidden="true" /><span>Page {page.pageNumber}</span></div><Badge variant="outline">{page.status === "protected" ? "Protected" : "Visible"}</Badge></div>)}</CardContent></Card>{type === "pre_evaluation" ? <Card><CardContent className="p-5"><p className="font-medium">Evaluation marks: Not yet applied</p><p className="mt-1 text-sm text-muted-foreground">This pre-evaluation representation deliberately does not show current or final marks.</p></CardContent></Card> : <Card><CardHeader><CardTitle>Submitted evaluation</CardTitle><CardDescription>Evaluator marks remain read-only; administrative adjustments are shown separately.</CardDescription></CardHeader><CardContent className="space-y-4">{context.evaluation ? <><div className="grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Evaluator marks</p><p className="text-lg font-semibold">{context.evaluation.totalMarks}</p></div><div><p className="text-xs text-muted-foreground">Admin adjustment</p><p className="text-lg font-semibold">{context.adjustment?.adjustmentMarks ?? 0}</p></div><div><p className="text-xs text-muted-foreground">Final marks</p><p className="text-lg font-semibold text-primary">{context.finalMarks}</p></div></div>{context.adjustment ? <p className="rounded-lg bg-muted/40 p-3 text-sm">Reason: {context.adjustment.reason}</p> : null}<div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Submitted</Badge></div><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[480px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Question</th><th className="px-4 py-3">Maximum</th><th className="px-4 py-3">Awarded</th></tr></thead><tbody className="divide-y">{context.evaluation.questionMarks.map((mark) => <tr key={mark.questionId}><td className="px-4 py-3">Question {mark.questionNumber}</td><td className="px-4 py-3">{mark.maximumMarks}</td><td className="px-4 py-3 font-medium">{mark.marksAwarded ?? "Not marked"}</td></tr>)}</tbody></table></div></> : <p className="text-sm text-muted-foreground">No submitted evaluation is available.</p>}</CardContent></Card>}</>}</div>
  )
}
