"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { getEvaluatorAssignmentWorkload, isEvaluatorEligibleForSubject } from "@/lib/assignments"
import { getScriptDistributionSummary } from "@/lib/script-distribution"
import { useOsmStore } from "@/stores/osm-store"
import type { ScriptDistributionStatus } from "@/types/osm"
import { CheckCircle2, Play, ShieldAlert } from "lucide-react"
import { useMemo } from "react"
import { toast } from "sonner"

const statusLabels: Record<ScriptDistributionStatus, string> = {
  not_distributed: "Not distributed",
  partially_distributed: "Partially distributed",
  distributed: "Distributed",
  capacity_reached: "Capacity reached",
}

const statusClasses: Record<ScriptDistributionStatus, string> = {
  not_distributed: "border-border bg-muted/60 text-muted-foreground",
  partially_distributed: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  distributed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  capacity_reached: "border-destructive/30 bg-destructive/10 text-destructive",
}

function DistributionSkeleton() {
  return <div className="space-y-6"><Skeleton className="h-24" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-[32rem]" /></div>
}

export function ScriptDistributionPage() {
  const hydrated = useOsmStoreHydrated()
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const students = useOsmStore((state) => state.students)
  const scripts = useOsmStore((state) => state.processedScripts)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const batches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const lastDistributionSummary = useOsmStore((state) => state.lastDistributionSummary)
  const autoDistributeScripts = useOsmStore((state) => state.autoDistributeScripts)

  const preview = useMemo(() => getScriptDistributionSummary({ scripts, mappings, students, batches, exams, evaluators, answerSheets }), [answerSheets, batches, evaluators, exams, mappings, scripts, students])
  const currentDistributed = useMemo(() => {
    const validScriptIds = new Set(mappings.filter((mapping) => mapping.status === "valid").map((mapping) => mapping.scriptId))
    return answerSheets.filter((sheet) => Boolean(sheet.processedScriptId && validScriptIds.has(sheet.processedScriptId) && sheet.assignedEvaluatorId && sheet.status !== "unassigned")).length
  }, [answerSheets, mappings])
  const summary = lastDistributionSummary ?? {
    ...preview,
    distributed: currentDistributed,
    remaining: Math.max(preview.eligibleScripts - currentDistributed, 0),
    status: currentDistributed === 0 ? "not_distributed" as const : currentDistributed === preview.eligibleScripts ? "distributed" as const : "partially_distributed" as const,
    unassigned: [],
  }
  const validMappings = mappings.filter((mapping) => mapping.status === "valid")
  const excludedMappings = mappings.filter((mapping) => mapping.status !== "valid")
  const eligibleEvaluatorIds = useMemo(() => {
    const subjectIds = new Set(validMappings.map((mapping) => {
      const script = scripts.find((item) => item.id === mapping.scriptId)
      const batch = script ? batches.find((item) => item.id === script.uploadBatchId) : undefined
      return batch ? exams.find((exam) => exam.id === batch.examId)?.subjectId : undefined
    }).filter((subjectId): subjectId is string => Boolean(subjectId)))
    return new Set(evaluators.filter((evaluator) => evaluator.status === "approved" && Array.from(subjectIds).some((subjectId) => isEvaluatorEligibleForSubject(evaluator, subjectId))).map((evaluator) => evaluator.id))
  }, [batches, exams, evaluators, scripts, validMappings])
  const eligibleEvaluators = evaluators.filter((evaluator) => eligibleEvaluatorIds.has(evaluator.id))
  const validScriptIds = new Set(validMappings.map((mapping) => mapping.scriptId))
  const unassignedScripts = scripts.filter((script) => validScriptIds.has(script.id) && !answerSheets.some((sheet) => sheet.processedScriptId === script.id && sheet.assignedEvaluatorId && sheet.status !== "unassigned"))

  if (!hydrated) return <DistributionSkeleton />

  function handleDistribution() {
    const result = autoDistributeScripts()
    toast.success(`${result.distributed} script${result.distributed === 1 ? "" : "s"} distributed.`)
  }

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl space-y-2"><p className="text-sm font-medium text-primary">Assignment operations</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Automatic Script Distribution</h1><p className="text-sm leading-6 text-muted-foreground">Distribute valid mapped scripts to approved evaluators using subject expertise, existing workload, and a 20-script active capacity.</p></div><Button onClick={handleDistribution}><Play data-icon="inline-start" className="size-4" />Auto Distribute Scripts</Button></section>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Eligible scripts</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary.eligibleScripts}</p><p className="mt-1 text-xs text-muted-foreground">Valid mappings only</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Eligible evaluators</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary.eligibleEvaluators}</p><p className="mt-1 text-xs text-muted-foreground">Approved with matching expertise</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total capacity</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalCapacity}</p><p className="mt-1 text-xs text-muted-foreground">{summary.defaultScriptsPerEvaluator} per evaluator</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Distributed</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary.distributed}</p><p className="mt-1 text-xs text-muted-foreground">Existing assignments preserved</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 text-2xl font-semibold tabular-nums">{summary.remaining}</p><p className="mt-1 text-xs text-muted-foreground"><Badge variant="outline" className={statusClasses[summary.status]}>{statusLabels[summary.status]}</Badge></p></CardContent></Card></div>

    <Card><CardHeader><CardTitle>Distribution readiness</CardTitle><CardDescription>Only valid Script Mapping records enter the automatic assignment pool.</CardDescription></CardHeader><CardContent><div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/25 p-4 text-sm"><CheckCircle2 className="size-5 text-emerald-600" /><span><strong>{validMappings.length}</strong> valid scripts eligible</span><span className="text-muted-foreground">·</span><span><strong>{excludedMappings.length}</strong> review/invalid excluded</span><span className="text-muted-foreground">·</span><span>Default target: <strong>{summary.defaultScriptsPerEvaluator} / evaluator</strong></span></div></CardContent></Card>

    <Card><CardHeader><CardTitle>Evaluator workload</CardTitle><CardDescription>Round-robin balancing selects the lowest active workload first and respects subject expertise.</CardDescription></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Evaluator</th><th className="px-4 py-3">Eligibility</th><th className="px-4 py-3 text-right">Assigned</th><th className="px-4 py-3 text-right">Remaining capacity</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{eligibleEvaluators.map((evaluator) => { const workload = getEvaluatorAssignmentWorkload({ evaluator, answerSheets }); const scriptAssigned = answerSheets.filter((sheet) => sheet.processedScriptId && validScriptIds.has(sheet.processedScriptId) && sheet.assignedEvaluatorId === evaluator.id && sheet.status !== "unassigned").length; const remaining = Math.max(summary.defaultScriptsPerEvaluator - workload.activeSheets, 0); return <tr key={evaluator.id} className="border-b last:border-0"><td className="px-4 py-3"><p className="font-medium">{evaluator.name}</p><p className="text-xs text-muted-foreground">{evaluator.designation}</p></td><td className="px-4 py-3"><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Approved / Eligible</Badge></td><td className="px-4 py-3 text-right tabular-nums">{scriptAssigned}</td><td className="px-4 py-3 text-right tabular-nums">{remaining}</td><td className="px-4 py-3"><Badge variant="outline">{remaining === 0 ? "Full" : "Available"}</Badge></td></tr> })}</tbody></table></div>{eligibleEvaluators.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">No approved evaluator matches the subjects of the valid mapped scripts.</div>}</CardContent></Card>

    <Card><CardHeader><CardTitle>Unassigned valid scripts</CardTitle><CardDescription>Scripts remain visible here when they have not been distributed or capacity is unavailable.</CardDescription></CardHeader><CardContent>{unassignedScripts.length > 0 ? <div className="space-y-2">{unassignedScripts.map((script) => { const mapping = validMappings.find((item) => item.scriptId === script.id); const student = students.find((item) => item.id === mapping?.studentId); return <div key={script.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{script.id} · {student?.rollNumber ?? "Unknown roll"}</p><p className="text-xs text-muted-foreground">Pages {script.startPage}-{script.endPage} · {student?.name ?? "Student unavailable"}</p></div><Badge variant="outline">{lastDistributionSummary?.unassigned.find((item) => item.scriptId === script.id)?.reason ?? "Awaiting distribution"}</Badge></div> })}</div> : <div className="flex items-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground"><ShieldAlert className="size-4" />No valid scripts are currently unassigned.</div>}</CardContent></Card>
  </div>
}
