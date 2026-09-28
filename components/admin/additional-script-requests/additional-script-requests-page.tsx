"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { getEvaluatorAssignmentWorkload } from "@/lib/assignments"
import { useOsmStore } from "@/stores/osm-store"
import type { AdditionalScriptRequestStatus } from "@/types/osm"
import { Check, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const statusLabels: Record<AdditionalScriptRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
}

const statusClasses: Record<AdditionalScriptRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}

export function AdditionalScriptRequestsPage() {
  const hydrated = useOsmStoreHydrated()
  const requests = useOsmStore((state) => state.additionalScriptRequests)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const approve = useOsmStore((state) => state.approveAdditionalScriptRequest)
  const reject = useOsmStore((state) => state.rejectAdditionalScriptRequest)
  const [reviewNote, setReviewNote] = useState("")

  if (!hydrated) {
    return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-[30rem]" /></div>
  }

  const pending = requests.filter((request) => request.status === "pending").length
  const approved = requests.filter((request) => request.status === "approved").length
  const rejected = requests.filter((request) => request.status === "rejected").length

  function evaluatorName(evaluatorId: string) {
    return evaluators.find((evaluator) => evaluator.id === evaluatorId)?.name ?? "Unknown evaluator"
  }

  function handleApprove(requestId: string) {
    const request = approve(requestId, reviewNote)
    if (request) {
      toast.success(`Request approved. ${request.approvedCount ?? 0} script${request.approvedCount === 1 ? "" : "s"} assigned.`)
      setReviewNote("")
    }
  }

  function handleReject(requestId: string) {
    if (reject(requestId, reviewNote || "Additional scripts are currently unavailable.")) {
      toast.success("Additional script request rejected.")
      setReviewNote("")
    }
  }

  return <div className="space-y-6">
    <section className="max-w-3xl space-y-2"><p className="text-sm font-medium text-primary">Assignment exceptions</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Additional Script Requests</h1><p className="text-sm leading-6 text-muted-foreground">Review evaluator requests after their current workload is complete. Approval assigns only valid, available scripts.</p></section>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pending review</p><p className="mt-1 text-2xl font-semibold tabular-nums">{pending}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Approved</p><p className="mt-1 text-2xl font-semibold tabular-nums">{approved}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Rejected</p><p className="mt-1 text-2xl font-semibold tabular-nums">{rejected}</p></CardContent></Card></div>
    <Card><CardHeader><CardTitle>Request review</CardTitle><CardDescription>Requested count is a maximum. Available valid scripts determine the assigned count.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><label htmlFor="request-review-note" className="text-sm font-medium">Review note <span className="font-normal text-muted-foreground">(optional)</span></label><textarea id="request-review-note" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={2} placeholder="Add a note for the evaluator" className="w-full max-w-xl rounded-md border bg-background px-3 py-2 text-sm" /></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="border-y bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3">Evaluator</th><th className="px-4 py-3 text-right">Requested</th><th className="px-4 py-3 text-right">Current</th><th className="px-4 py-3 text-right">Completed</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Requested at</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{requests.map((request) => { const evaluator = evaluators.find((item) => item.id === request.evaluatorId); const workload = evaluator ? getEvaluatorAssignmentWorkload({ evaluator, answerSheets }) : undefined; return <tr key={request.id} className="border-b last:border-0"><td className="px-4 py-3"><p className="font-medium">{evaluatorName(request.evaluatorId)}</p><p className="text-xs text-muted-foreground">{request.reason ?? "No reason provided"}</p></td><td className="px-4 py-3 text-right tabular-nums">{request.requestedCount}{request.status === "approved" ? <span className="block text-xs text-muted-foreground">Assigned {request.approvedCount ?? 0}</span> : null}</td><td className="px-4 py-3 text-right tabular-nums">{workload?.activeSheets ?? 0}</td><td className="px-4 py-3 text-right tabular-nums">{workload?.completedSheets ?? 0}</td><td className="px-4 py-3"><Badge variant="outline" className={statusClasses[request.status]}>{statusLabels[request.status]}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(request.requestedAt).toLocaleString("en-IN")}</td><td className="px-4 py-3">{request.status === "pending" ? <div className="flex gap-2"><Button size="sm" onClick={() => handleApprove(request.id)}><Check data-icon="inline-start" className="size-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => handleReject(request.id)}><X data-icon="inline-start" className="size-4" />Reject</Button></div> : <span className="text-xs text-muted-foreground">Reviewed</span>}</td></tr> })}</tbody></table></div>{requests.length === 0 ? <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No additional script requests have been submitted.</div> : null}</CardContent></Card>
  </div>
}
