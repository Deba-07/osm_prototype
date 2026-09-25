"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { examInCharges } from "@/data/exams"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import { Building2, CheckCircle2, MapPin, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function InstituteSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading institute details">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export function InstitutePage() {
  const hydrated = useOsmStoreHydrated()
  const university = useOsmStore((state) => state.universityContext)
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const collegeImport = useOsmStore((state) => state.collegeImport)
  const importAffiliatedColleges = useOsmStore(
    (state) => state.importAffiliatedColleges
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const examInCharge = examInCharges.find(
    (item) => item.id === university.examInChargeId
  )

  function handleImport() {
    setIsProcessing(true)
    window.setTimeout(() => {
      const result = importAffiliatedColleges()
      setIsProcessing(false)
      toast.success(
        result.importedCount > 0
          ? `College list processed. Imported ${result.importedCount} colleges.`
          : "College list already imported. No new colleges were added."
      )
    }, 650)
  }

  if (!hydrated) {
    return <InstituteSkeleton />
  }

  const importLabel = isProcessing
    ? "Processing college list..."
    : collegeImport.status === "imported"
      ? "Import College List Again"
      : "Import College List"

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">University Admin</p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Institute & affiliated colleges
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Manage the institute context that anchors affiliated colleges and the
          examination configuration.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Institute details</CardTitle>
                <CardDescription className="mt-1">
                  The current demo institution context.
                </CardDescription>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-5" aria-hidden="true" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <p className="text-xs text-muted-foreground">Institute name</p>
              <p className="mt-1 font-medium">{university.name}</p>
              <p className="text-sm text-muted-foreground">{university.code}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Exam-in-charge</p>
              <p className="mt-1 font-medium">{examInCharge?.name ?? "Not assigned"}</p>
              <p className="text-sm text-muted-foreground">
                {examInCharge?.designation ?? ""}
              </p>
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground sm:col-span-2 lg:col-span-1">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                {university.city}, {university.state}, {university.country} · {university.pin}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Affiliated colleges</CardTitle>
                <CardDescription className="mt-1">
                  {colleges.length} colleges connected to this institute.
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={isProcessing}>
                <Upload data-icon="inline-start" className="size-4" />
                {importLabel}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {collegeImport.status === "imported" && (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-medium">College list processed</p>
                  <p className="text-muted-foreground">
                    Imported {collegeImport.importedCount} colleges in this demo session.
                  </p>
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">College</th>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {colleges.map((college) => (
                    <tr key={college.id}>
                      <td className="px-4 py-3 font-medium">{college.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{college.code}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {college.city}, {college.state}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={college.status === "active" ? "secondary" : "outline"}>
                          {college.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
