"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { isDemoSessionActive } from "@/lib/demo-auth"
import { useOsmStore } from "@/stores/osm-store"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect } from "react"

export function EvaluatorSessionGuard({ children }: { children: ReactNode }) {
  const isHydrated = useOsmStoreHydrated()
  const pathname = usePathname()
  const currentUser = useOsmStore((state) => state.currentUser)
  const session = useOsmStore((state) => state.evaluatorSession)
  const verifyEvaluatorSession = useOsmStore(
    (state) => state.verifyEvaluatorSession
  )
  const isVerificationRoute = pathname === "/evaluator/verify"
  const evaluatorId = currentUser?.evaluatorId
  const sessionIsActive = isDemoSessionActive(session, evaluatorId)

  useEffect(() => {
    if (isHydrated && !isVerificationRoute && evaluatorId) {
      verifyEvaluatorSession(evaluatorId)
    }
  }, [evaluatorId, isHydrated, isVerificationRoute, verifyEvaluatorSession])

  if (!isHydrated || isVerificationRoute) return children
  if (currentUser?.role !== "evaluator" || !evaluatorId || !sessionIsActive) {
    return (
      <EvaluatorAccessState
        title="Evaluator session required"
        description="Verify the Demo OTP before accessing evaluator work. This prototype does not provide production authentication."
        actionHref="/evaluator/verify"
        actionLabel="Open Demo OTP"
      />
    )
  }

  return children
}
