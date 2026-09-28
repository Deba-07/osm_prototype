"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { isDemoSessionActive } from "@/lib/demo-auth"
import { useOsmStore } from "@/stores/osm-store"
import { ArrowRight, CheckCircle2, KeyRound, LogOut, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString("en-IN") : "Not available"
}

export function DemoOtpVerification() {
  const router = useRouter()
  const isHydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluatorSession = useOsmStore((state) => state.evaluatorSession)
  const challenge = useOsmStore((state) => state.demoOtpChallenge)
  const requestDemoOtp = useOsmStore((state) => state.requestDemoOtp)
  const verifyDemoOtp = useOsmStore((state) => state.verifyDemoOtp)
  const endEvaluatorSession = useOsmStore((state) => state.endEvaluatorSession)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  if (!isHydrated) {
    return <div className="mx-auto w-full max-w-xl space-y-6"><Skeleton className="h-24" /><Skeleton className="h-80" /></div>
  }

  if (currentUser?.role !== "evaluator" || !currentUser.evaluatorId || !challenge) {
    return <Card className="mx-auto max-w-xl"><CardHeader><CardTitle>Evaluator identity required</CardTitle><CardDescription>Choose an approved evaluator from the demo login before requesting a Demo OTP.</CardDescription></CardHeader><CardContent><Button render={<Link href="/login" />}>Return to demo login</Button></CardContent></Card>
  }

  const sessionIsActive = isDemoSessionActive(evaluatorSession, currentUser.evaluatorId)
  const activeEvaluatorId = currentUser.evaluatorId

  function handleVerify() {
    const result = verifyDemoOtp(code)
    if (!result.success) {
      setError(result.message)
      return
    }
    setError("")
    toast.success("Demo OTP verified. Evaluator session is active.")
  }

  function handleNewOtp() {
    const result = requestDemoOtp(activeEvaluatorId)
    if (!result.success) {
      setError(result.message)
      return
    }
    setCode("")
    setError("")
    toast.success("A new Demo OTP was generated.")
  }

  function handleEndSession() {
    endEvaluatorSession()
    router.push("/login")
  }

  return <main className="flex flex-1 items-center bg-muted/25 px-4 py-10"><div className="mx-auto w-full max-w-xl space-y-6">
    <section className="space-y-2"><p className="text-sm font-medium text-primary">Evaluator identity verification</p><h1 className="text-2xl font-semibold tracking-tight">{sessionIsActive ? "Evaluator Session" : "Demo OTP Verification"}</h1><p className="text-sm leading-6 text-muted-foreground">This is a prototype OTP flow. No SMS or email is sent.</p></section>
    {sessionIsActive ? <Card><CardHeader><div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" /><CardTitle>Session Active</CardTitle></div><CardDescription>Your evaluator identity has been verified for this demo session.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 rounded-md border bg-muted/25 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Identity</p><p className="mt-1 font-medium">Verified</p></div><div><p className="text-xs text-muted-foreground">Evaluator</p><p className="mt-1 font-medium">{currentUser.name}</p></div><div><p className="text-xs text-muted-foreground">Last verified</p><p className="mt-1 font-medium">{formatDate(evaluatorSession?.lastVerifiedAt)}</p></div><div><p className="text-xs text-muted-foreground">Session expires</p><p className="mt-1 font-medium">{formatDate(evaluatorSession?.expiresAt)}</p></div></div><div className="flex flex-wrap gap-2"><Button render={<Link href="/evaluator/dashboard" />}><ArrowRight data-icon="inline-start" className="size-4" />Continue to dashboard</Button><Button variant="outline" onClick={handleEndSession}><LogOut data-icon="inline-start" className="size-4" />End session</Button></div></CardContent></Card> : <Card><CardHeader><div className="flex items-center gap-2"><KeyRound className="size-5 text-primary" /><CardTitle>Verify Demo OTP</CardTitle></div><CardDescription>Evaluator: {currentUser.name} · {currentUser.email}</CardDescription></CardHeader><CardContent className="space-y-5"><div className="rounded-md border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-medium uppercase tracking-wide text-primary">Demo OTP</p><p className="mt-1 text-2xl font-semibold tracking-[0.2em]">{challenge.code}</p><p className="mt-2 text-xs text-muted-foreground">No SMS or email is sent in this prototype. Expires {formatDate(challenge.expiresAt)}.</p></div><div className="space-y-2"><label htmlFor="demo-otp-code" className="text-sm font-medium">Enter OTP</label><input id="demo-otp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm tracking-[0.2em]" /></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<div className="flex flex-wrap gap-2"><Button onClick={handleVerify}><CheckCircle2 data-icon="inline-start" className="size-4" />Verify OTP</Button><Button variant="outline" onClick={handleNewOtp}><RefreshCw data-icon="inline-start" className="size-4" />Request New OTP</Button></div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Attempts: {challenge.attempts} / 3</span><Badge variant="outline">{challenge.status === "failed" ? "Failed" : challenge.status === "expired" ? "Expired" : "Pending"}</Badge></div></CardContent></Card>}
  </div></main>
}
