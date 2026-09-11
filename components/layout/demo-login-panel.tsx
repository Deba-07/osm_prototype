"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import { ShieldCheck, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export function DemoLoginPanel() {
  const router = useRouter()
  const isHydrated = useOsmStoreHydrated()
  const loginAsAdmin = useOsmStore((state) => state.loginAsAdmin)
  const loginAsEvaluator = useOsmStore((state) => state.loginAsEvaluator)
  const evaluators = useOsmStore((state) => state.evaluators)
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState("")
  const approvedEvaluators = useMemo(
    () => evaluators.filter((evaluator) => evaluator.status === "approved"),
    [evaluators]
  )

  function handleAdminLogin() {
    loginAsAdmin()
    router.push("/admin/dashboard")
  }

  function handleEvaluatorLogin() {
    if (selectedEvaluatorId && loginAsEvaluator(selectedEvaluatorId)) {
      router.push("/evaluator/dashboard")
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Demo access</CardTitle>
        <CardDescription>
          Switch between the two prototype roles without real authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="h-12 justify-start"
            onClick={handleAdminLogin}
          >
            <ShieldCheck data-icon="inline-start" className="size-4" />
            Login as admin
          </Button>
          <div className="space-y-2">
            {isHydrated ? (
              <>
                <Label htmlFor="demo-evaluator">Evaluator account</Label>
                <select
                  id="demo-evaluator"
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  )}
                  value={selectedEvaluatorId}
                  onChange={(event) =>
                    setSelectedEvaluatorId(event.target.value)
                  }
                >
                  <option value="">Select approved evaluator</option>
                  {approvedEvaluators.map((evaluator) => (
                    <option key={evaluator.id} value={evaluator.id}>
                      {evaluator.name} | {evaluator.designation}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start"
                  disabled={!selectedEvaluatorId}
                  onClick={handleEvaluatorLogin}
                >
                  <UserCheck data-icon="inline-start" className="size-4" />
                  Login as evaluator
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
