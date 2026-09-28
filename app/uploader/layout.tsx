import { DemoRoleGuard } from "@/components/layout/demo-role-guard"
import { UploaderShell } from "@/components/layout/role-shell"
import type { ReactNode } from "react"

export default function UploaderLayout({ children }: { children: ReactNode }) {
  return <DemoRoleGuard role="nodal_centre_uploader"><UploaderShell>{children}</UploaderShell></DemoRoleGuard>
}
