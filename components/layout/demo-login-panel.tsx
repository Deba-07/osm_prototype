"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useOsmStore } from "@/stores/osm-store"
import { ShieldCheck, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"

export function DemoLoginPanel() {
  const router = useRouter()
  const loginAsAdmin = useOsmStore((state) => state.loginAsAdmin)
  const loginAsEvaluator = useOsmStore((state) => state.loginAsEvaluator)
  const primaryEvaluatorId = "eval-cse-ananya-sen"

  function handleAdminLogin() {
    loginAsAdmin()
    router.push("/admin/dashboard")
  }

  function handleEvaluatorLogin() {
    if (loginAsEvaluator(primaryEvaluatorId)) {
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
          <Button
            type="button"
            variant="outline"
            className="h-12 justify-start"
            onClick={handleEvaluatorLogin}
          >
            <UserCheck data-icon="inline-start" className="size-4" />
            Login as evaluator
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
