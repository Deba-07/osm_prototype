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
import { toast } from "sonner"

export function DemoLoginPanel() {
  const router = useRouter()
  const isHydrated = useOsmStoreHydrated()
  const loginAsAdmin = useOsmStore((state) => state.loginAsAdmin)
  const requestDemoOtp = useOsmStore((state) => state.requestDemoOtp)
  const evaluators = useOsmStore((state) => state.evaluators)
  const [selectedEvaluatorEmail, setSelectedEvaluatorEmail] = useState("")
  const approvedEvaluators = useMemo(
    () => evaluators.filter((evaluator) => evaluator.status === "approved"),
    [evaluators]
  )

  function handleAdminLogin() {
    loginAsAdmin()
    router.push("/admin/dashboard")
  }

  function handleEvaluatorLogin() {
    if (!selectedEvaluatorEmail) return
    const result = requestDemoOtp(selectedEvaluatorEmail)
    if (!result.success) {
      toast.error(result.message)
      return
    }
    router.push("/evaluator/verify")
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Choose Demo Role</CardTitle>
        <CardDescription>
          Open the University Admin dashboard or continue as an approved
          evaluator.
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
            University Admin
          </Button>
          <div className="space-y-2">
            {isHydrated ? (
              <>
                <Label htmlFor="demo-evaluator">Approved evaluator email</Label>
                <select
                  id="demo-evaluator"
                  className={cn(
                    "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  )}
                  value={selectedEvaluatorEmail}
                  onChange={(event) =>
                    setSelectedEvaluatorEmail(event.target.value)
                  }
                >
                  <option value="">Select approved evaluator</option>
                  {approvedEvaluators.map((evaluator) => (
                    <option key={evaluator.id} value={evaluator.email}>
                      {evaluator.email} | {evaluator.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start"
                  disabled={!selectedEvaluatorEmail}
                  onClick={handleEvaluatorLogin}
                >
                  <UserCheck data-icon="inline-start" className="size-4" />
                  Request Demo OTP
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
