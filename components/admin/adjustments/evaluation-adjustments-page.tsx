"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { examQuestions } from "@/data/questions"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { getEvaluationQuestions } from "@/lib/evaluations"
import { getEffectiveEvaluationMarks, validateAdjustmentInput } from "@/lib/admin-adjustments"
import { useOsmStore } from "@/stores/osm-store"
import { ClipboardPlus, Save } from "lucide-react"
import { useMemo, useState } from "react"

export function EvaluationAdjustmentsPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const students = useOsmStore((state) => state.students)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const evaluations = useOsmStore((state) => state.evaluations)
  const mappings = useOsmStore((state) => state.scriptMappings)
  const adjustments = useOsmStore((state) => state.adminAdjustments)
  const applyAdminAdjustment = useOsmStore((state) => state.applyAdminAdjustment)
  const [selectedId, setSelectedId] = useState("")
  const [adjustmentMarks, setAdjustmentMarks] = useState("0")
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")

  const submitted = useMemo(() => evaluations.filter((item) => item.status === "submitted"), [evaluations])
  const selected = submitted.find((item) => item.id === selectedId) ?? submitted[0]
  const answerSheet = selected ? answerSheets.find((item) => item.id === selected.answerSheetId) : undefined
  const maximumMarks = selected
    ? Math.max(
        getEvaluationQuestions({
          answerSheet: answerSheet ?? {
            id: selected.answerSheetId,
            studentId: selected.studentId,
            subjectId: selected.subjectId,
            examId: selected.examId,
            semesterId: selected.semesterId,
            pageImages: [],
            assignedEvaluatorId: selected.evaluatorId,
            status: "completed",
          },
          questions: examQuestions,
        }).reduce((total, question) => total + question.maximumMarks, 0),
        subjects.find((item) => item.id === selected.subjectId)?.maximumMarks ?? 0
      )
    : 0
  const student = selected ? students.find((item) => item.id === selected.studentId) : undefined
  const evaluator = selected ? evaluators.find((item) => item.id === selected.evaluatorId) : undefined
  const mapping = selected ? mappings.find((item) => item.studentId === selected.studentId && item.status === "valid") : undefined
  const scriptLabel = mapping?.scriptId === "script-batch-002-001" ? "Script #23CSE001" : mapping?.scriptId ?? selected?.answerSheetId ?? "Unavailable"

  function chooseEvaluation(evaluationId: string) {
    const evaluation = submitted.find((item) => item.id === evaluationId)
    const existing = adjustments.find((item) => item.evaluationId === evaluationId)
    setSelectedId(evaluationId)
    setAdjustmentMarks(String(existing?.adjustmentMarks ?? 0))
    setReason(existing?.reason ?? "")
    setMessage(evaluation ? "" : "Evaluation unavailable.")
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    const numericAdjustment = Number(adjustmentMarks)
    const validationError = validateAdjustmentInput({ evaluation: selected, adjustmentMarks: numericAdjustment, reason, maximumMarks })
    if (validationError) {
      setMessage(validationError)
      return
    }
    const result = applyAdminAdjustment({ evaluationId: selected.id, adjustmentMarks: numericAdjustment, reason })
    setMessage(result ? `Saved. Final marks: ${result.finalMarks}.` : "Only an authenticated admin can save adjustments.")
  }

  if (!hydrated) return <Card><CardContent className="p-8">Loading adjustments...</CardContent></Card>
  if (currentUser?.role !== "admin") return <EvaluatorAccessState title="Admin access required" description="Administrative mark adjustments are restricted to university administrators." />

  return (
    <div className="space-y-6">
      <section className="space-y-2"><p className="text-sm font-medium text-primary">University Admin</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Evaluation Adjustments</h1><p className="text-sm leading-6 text-muted-foreground">Apply a documented, non-cumulative adjustment after evaluation. Evaluator marks remain unchanged.</p></section>
      <Card><CardHeader><CardTitle>Submitted evaluations</CardTitle><CardDescription>Choose one evaluation to review or update its current adjustment.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="px-3 py-3">Script</th><th className="px-3 py-3">Student</th><th className="px-3 py-3">Evaluator</th><th className="px-3 py-3">Evaluator marks</th><th className="px-3 py-3">Adjustment</th><th className="px-3 py-3">Final</th><th className="px-3 py-3" /></tr></thead><tbody className="divide-y">{submitted.map((evaluation) => { const item = adjustments.find((adjustment) => adjustment.evaluationId === evaluation.id); const itemStudent = students.find((student) => student.id === evaluation.studentId); const itemMapping = mappings.find((mapping) => mapping.studentId === evaluation.studentId && mapping.status === "valid"); return <tr key={evaluation.id}><td className="px-3 py-3 font-medium">{itemMapping?.scriptId === "script-batch-002-001" ? "Script #23CSE001" : itemMapping?.scriptId ?? evaluation.answerSheetId}</td><td className="px-3 py-3">{itemStudent?.name ?? "Unavailable"}</td><td className="px-3 py-3">{evaluators.find((evaluator) => evaluator.id === evaluation.evaluatorId)?.name ?? "Unavailable"}</td><td className="px-3 py-3">{evaluation.totalMarks}</td><td className="px-3 py-3">{item?.adjustmentMarks ?? 0}</td><td className="px-3 py-3 font-semibold">{getEffectiveEvaluationMarks(evaluation, adjustments)}</td><td className="px-3 py-3 text-right"><Button type="button" size="sm" variant={selected?.id === evaluation.id ? "default" : "outline"} onClick={() => chooseEvaluation(evaluation.id)}>Review</Button></td></tr> })}</tbody></table></CardContent></Card>
      {selected ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardPlus className="size-5" aria-hidden="true" />Adjust {scriptLabel}</CardTitle><CardDescription>{student?.name ?? "Student unavailable"} · {evaluator?.name ?? "Evaluator unavailable"} · maximum {maximumMarks}</CardDescription></CardHeader><CardContent><form className="grid gap-4 lg:grid-cols-[1fr_1fr_2fr_auto] lg:items-end" onSubmit={handleSubmit}><label className="space-y-2 text-sm"><span className="font-medium">Evaluator marks</span><Input value={selected.totalMarks} readOnly /></label><label className="space-y-2 text-sm"><span className="font-medium">Adjustment marks</span><Input type="number" step="0.01" value={adjustmentMarks} onChange={(event) => setAdjustmentMarks(event.target.value)} /></label><label className="space-y-2 text-sm"><span className="font-medium">Reason</span><Textarea required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Document the approved administrative reason" /></label><Button type="submit"><Save data-icon="inline-start" className="size-4" />Save adjustment</Button></form>{message ? <p className="mt-4 text-sm font-medium text-primary" role="status">{message}</p> : null}<p className="mt-4 text-sm text-muted-foreground">Current final marks: <span className="font-semibold text-foreground">{getEffectiveEvaluationMarks(selected, adjustments)}</span>. Saving replaces the current adjustment; it never compounds it.</p></CardContent></Card> : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No submitted evaluations are available.</CardContent></Card>}
    </div>
  )
}
