"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import { CheckCircle2, ShieldCheck } from "lucide-react"

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("en-IN") : "Not available"
}

export function EvaluatorSessionsPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const challenge = useOsmStore((state) => state.demoOtpChallenge)
  const session = useOsmStore((state) => state.evaluatorSession)
  const evaluator = evaluators.find(
    (item) => item.id === (session?.evaluatorId ?? challenge?.evaluatorId)
  )

  if (!hydrated) return <div className="space-y-6"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>

  return <div className="space-y-6"><section className="max-w-3xl space-y-2"><p className="text-sm font-medium text-primary">Exam-In-Charge / Admin authority</p><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Evaluator Sessions</h1><p className="text-sm leading-6 text-muted-foreground">Demo-only overview of evaluator OTP verification and session state. No production authentication or message delivery is used.</p></section><Card><CardHeader><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-primary" /><CardTitle>Current demo verification</CardTitle></div><CardDescription>The admin context represents exam-in-charge authority; evaluator identity remains separate.</CardDescription></CardHeader><CardContent>{evaluator ? <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-muted-foreground">Evaluator</p><p className="mt-1 font-medium">{evaluator.name}</p><p className="text-xs text-muted-foreground">{evaluator.email}</p></div><div><p className="text-xs text-muted-foreground">OTP verification</p><Badge className="mt-1" variant="outline">{challenge?.status === "verified" ? "Verified" : challenge?.status === "pending" ? "Pending" : challenge?.status ?? "Not requested"}</Badge></div><div><p className="text-xs text-muted-foreground">Session status</p><Badge className="mt-1" variant="outline">{session?.status ?? "No session"}</Badge></div><div><p className="text-xs text-muted-foreground">Session started</p><p className="mt-1 font-medium">{formatDate(session?.startedAt)}</p><p className="mt-2 text-xs text-muted-foreground">Last verified: {formatDate(session?.lastVerifiedAt)}</p><p className="text-xs text-muted-foreground">Expires: {formatDate(session?.expiresAt)}</p></div></div> : <div className="flex items-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground"><CheckCircle2 className="size-4" />No evaluator Demo OTP challenge or session is active.</div>}</CardContent></Card><p className="text-xs text-muted-foreground">Current admin user: {currentUser?.role === "admin" ? "University Admin / Exam-In-Charge" : "Demo session not signed in as admin"}.</p></div>
}
