import { AdminShell } from "@/components/layout/role-shell"
import { DemoRoleGuard } from "@/components/layout/demo-role-guard"
import type { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DemoRoleGuard role="admin"><AdminShell>{children}</AdminShell></DemoRoleGuard>
}
