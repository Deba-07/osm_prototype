import { EvaluatorShell } from "@/components/layout/role-shell"
import type { ReactNode } from "react"

export default function EvaluatorLayout({ children }: { children: ReactNode }) {
  return <EvaluatorShell>{children}</EvaluatorShell>
}
