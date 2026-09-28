"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { RemunerationReceipt, ViewReceiptButton } from "@/components/shared/remuneration-receipt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exams } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { deriveEvaluatorRemuneration, formatInr } from "@/lib/remuneration"
import { useOsmStore } from "@/stores/osm-store"
import type { EvaluatorRemuneration } from "@/types/osm"
import { useMemo, useState } from "react"

export function EvaluatorRemunerationPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const evaluations = useOsmStore((state) => state.evaluations)
  const evaluator = currentUser?.evaluatorId ? evaluators.find((item) => item.id === currentUser.evaluatorId) : undefined
  const records = useMemo(() => evaluator ? deriveEvaluatorRemuneration({ evaluators: [evaluator], evaluations }) : [], [evaluations, evaluator])
  const [selected, setSelected] = useState<EvaluatorRemuneration | null>(null)
  const selectedExam = selected?.examId ? exams.find((item) => item.id === selected.examId) : undefined

  if (!hydrated) return <Card><CardContent className="p-8">Loading remuneration...</CardContent></Card>
  if (currentUser?.role !== "evaluator" || !evaluator) return <EvaluatorAccessState title="Evaluator account required" description="Sign in as an evaluator to view your own demo remuneration." />

  return <div className="max-w-4xl space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Evaluator Workspace</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Remuneration</h1><p className="text-sm leading-6 text-muted-foreground">Your demo remuneration is calculated from evaluations you have submitted, grouped by exam.</p></section><div className="grid gap-4 md:grid-cols-2">{records.map((record) => { const exam = record.examId ? exams.find((item) => item.id === record.examId) : undefined; return <Card key={record.id}><CardHeader><CardTitle>{exam?.name ?? "All submitted evaluations"}</CardTitle><CardDescription>{evaluator.name} · Demo calculation only</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">Completed Scripts</p><p className="text-2xl font-semibold">{record.completedScripts}</p></div><div><p className="text-sm text-muted-foreground">Rate</p><p className="text-2xl font-semibold">{formatInr(record.ratePerScript)} <span className="text-sm font-normal text-muted-foreground">/ script</span></p></div><div><p className="text-sm text-muted-foreground">Evaluation Amount</p><p className="text-xl font-semibold">{formatInr(record.evaluationAmount)}</p></div><div><p className="text-sm text-muted-foreground">TA/DA (Demo)</p><p className="text-xl font-semibold">{formatInr(record.taDaAmount)}</p></div></div><div className="flex items-center justify-between border-t pt-4"><div><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-semibold">{formatInr(record.totalAmount)}</p></div><ViewReceiptButton onClick={() => setSelected(record)} /></div></CardContent></Card> })}</div><p className="text-xs text-muted-foreground">DEMO ONLY · This is not a payment confirmation.</p>{selected ? <RemunerationReceipt open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} evaluator={evaluator} exam={selectedExam} remuneration={selected} /> : null}</div>
}
