import { DemoRoleGuard } from "@/components/layout/demo-role-guard"
import { SuperintendentShell } from "@/components/layout/role-shell"
import type { ReactNode } from "react"

export default function SuperintendentLayout({ children }: { children: ReactNode }) {
  return <DemoRoleGuard role="centre_superintendent"><SuperintendentShell>{children}</SuperintendentShell></DemoRoleGuard>
}
