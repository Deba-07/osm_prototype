import { AdminShell } from "@/components/layout/role-shell"
import type { ReactNode } from "react"

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
