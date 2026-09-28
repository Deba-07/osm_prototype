"use client"

import { RemunerationReceipt, ViewReceiptButton } from "@/components/shared/remuneration-receipt"
import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exams } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { deriveEvaluatorRemuneration, formatInr } from "@/lib/remuneration"
import { useOsmStore } from "@/stores/osm-store"
import type { EvaluatorRemuneration } from "@/types/osm"
import { useMemo, useState } from "react"

export function RemunerationPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const evaluations = useOsmStore((state) => state.evaluations)
  const [selected, setSelected] = useState<EvaluatorRemuneration | null>(null)
  const records = useMemo(() => deriveEvaluatorRemuneration({ evaluators, evaluations }), [evaluators, evaluations])
  const selectedEvaluator = selected ? evaluators.find((evaluator) => evaluator.id === selected.evaluatorId) : undefined
  const selectedExam = selected?.examId ? exams.find((exam) => exam.id === selected.examId) : undefined

  if (!hydrated) return <Card><CardContent className="p-8">Loading remuneration...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Evaluator remuneration records are restricted to university administrators." />

  return <div className="space-y-6"><section className="space-y-2"><p className="text-sm font-medium text-primary">Phase 8 · Audit & Financial Workflow</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Evaluator Remuneration</h1><p className="text-sm leading-6 text-muted-foreground">Demo calculations based on submitted evaluations. No payment processing is connected.</p></section><Card><CardHeader><CardTitle>Remuneration records</CardTitle><CardDescription>Completed scripts count only submitted evaluations. Rates and TA/DA are demo configuration values.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Evaluator</th><th className="px-3 py-3">Exam</th><th className="px-3 py-3">Completed Scripts</th><th className="px-3 py-3">Rate / Script</th><th className="px-3 py-3">Evaluation Amount</th><th className="px-3 py-3">TA/DA</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{records.map((record) => { const evaluator = evaluators.find((item) => item.id === record.evaluatorId); const exam = record.examId ? exams.find((item) => item.id === record.examId) : undefined; return <tr key={record.id}><td className="px-3 py-3 font-medium">{evaluator?.name ?? record.evaluatorId}</td><td className="px-3 py-3">{exam?.name ?? "All submitted evaluations"}</td><td className="px-3 py-3">{record.completedScripts}</td><td className="px-3 py-3">{formatInr(record.ratePerScript)}</td><td className="px-3 py-3">{formatInr(record.evaluationAmount)}</td><td className="px-3 py-3">{formatInr(record.taDaAmount)}</td><td className="px-3 py-3 font-semibold">{formatInr(record.totalAmount)}</td><td className="px-3 py-3"><Badge variant="outline">Calculated</Badge></td><td className="px-3 py-3 text-right"><ViewReceiptButton onClick={() => setSelected(record)} /></td></tr> })}</tbody></table></CardContent></Card>{selected && selectedEvaluator ? <RemunerationReceipt open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} evaluator={selectedEvaluator} exam={selectedExam} remuneration={selected} /> : null}</div>
}
