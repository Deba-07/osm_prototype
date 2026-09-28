"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import type { MockUserRole } from "@/types/osm"
import type { ReactNode } from "react"

export function DemoRoleGuard({ role, children }: { role: MockUserRole; children: ReactNode }) {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  if (!hydrated) return <div className="p-8 text-sm text-muted-foreground">Loading demo session...</div>
  if (currentUser?.role !== role) return <EvaluatorAccessState title="Demo role access required" description="This route is not available for the current demo role. Use Switch User to choose the appropriate role." />
  return <>{children}</>
}
