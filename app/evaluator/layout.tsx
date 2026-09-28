import { EvaluatorShell } from "@/components/layout/role-shell"
import { EvaluatorSessionGuard } from "@/components/evaluator/evaluator-session-guard"
import type { ReactNode } from "react"

export default function EvaluatorLayout({ children }: { children: ReactNode }) {
  return <EvaluatorShell><EvaluatorSessionGuard>{children}</EvaluatorSessionGuard></EvaluatorShell>
}
