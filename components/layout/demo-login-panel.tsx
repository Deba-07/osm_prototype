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
import { Building2, ShieldCheck, UserCheck, UploadCloud } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

export function DemoLoginPanel() {
  const router = useRouter()
  const isHydrated = useOsmStoreHydrated()
  const loginAsAdmin = useOsmStore((state) => state.loginAsAdmin)
  const loginAsUploader = useOsmStore((state) => state.loginAsUploader)
  const loginAsSuperintendent = useOsmStore((state) => state.loginAsSuperintendent)
  const requestDemoOtp = useOsmStore((state) => state.requestDemoOtp)
  const evaluators = useOsmStore((state) => state.evaluators)
  const uploaders = useOsmStore((state) => state.uploaders)
  const centres = useOsmStore((state) => state.nodalCentres)
  const [selectedEvaluatorEmail, setSelectedEvaluatorEmail] = useState("")
  const [selectedUploaderId, setSelectedUploaderId] = useState("")
  const [selectedCentreId, setSelectedCentreId] = useState("")
  const approvedEvaluators = useMemo(
    () => evaluators.filter((evaluator) => evaluator.status === "approved"),
    [evaluators]
  )
  const approvedUploaders = useMemo(() => uploaders.filter((uploader) => uploader.status === "approved"), [uploaders])

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

  function handleUploaderLogin() {
    if (selectedUploaderId && loginAsUploader(selectedUploaderId)) router.push("/uploader/dashboard")
  }

  function handleSuperintendentLogin() {
    if (selectedCentreId && loginAsSuperintendent(selectedCentreId)) router.push("/superintendent/dashboard")
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
          <div className="space-y-2"><label className="text-sm font-medium">Approved uploader</label><select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={selectedUploaderId} onChange={(event) => setSelectedUploaderId(event.target.value)}><option value="">Select uploader</option>{approvedUploaders.map((uploader) => <option key={uploader.id} value={uploader.id}>{uploader.name}</option>)}</select><Button type="button" variant="outline" className="h-12 w-full justify-start" disabled={!selectedUploaderId} onClick={handleUploaderLogin}><UploadCloud data-icon="inline-start" className="size-4" />Nodal Centre Uploader</Button></div>
          <div className="space-y-2"><label className="text-sm font-medium">Centre superintendent</label><select className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm" value={selectedCentreId} onChange={(event) => setSelectedCentreId(event.target.value)}><option value="">Select centre</option>{centres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code} · {centre.superintendent.name}</option>)}</select><Button type="button" variant="outline" className="h-12 w-full justify-start" disabled={!selectedCentreId} onClick={handleSuperintendentLogin}><Building2 data-icon="inline-start" className="size-4" />Centre Superintendent</Button></div>
        </div>
      </CardContent>
    </Card>
  )
}
