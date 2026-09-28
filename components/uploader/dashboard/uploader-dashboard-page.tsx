"use client"

import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import { UploadCloud } from "lucide-react"
import Link from "next/link"

export function UploaderDashboardPage() {
  const hydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const uploaders = useOsmStore((state) => state.uploaders)
  const centres = useOsmStore((state) => state.nodalCentres)
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const batches = useOsmStore((state) => state.uploadBatches)
  const exams = useOsmStore((state) => state.exams)
  const uploader = uploaders.find((item) => item.id === currentUser?.uploaderId)
  const centre = centres.find((item) => item.id === uploader?.nodalCentreId)
  const college = colleges.find((item) => item.id === centre?.affiliatedCollegeId)
  const ownBatches = batches.filter((batch) => batch.uploaderId === uploader?.id)

  if (!hydrated) return <Card><CardContent className="p-8">Loading uploader dashboard...</CardContent></Card>
  if (currentUser?.role !== "nodal_centre_uploader" || !uploader || !centre) return <EvaluatorAccessState title="Uploader profile unavailable" description="This demo uploader is not linked to a valid approved nodal centre." />
  return <div className="space-y-6"><section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-2"><p className="text-sm font-medium text-primary">Centre Script Upload</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Uploader Dashboard</h1><p className="text-sm text-muted-foreground">Submit examination script intake for your assigned centre.</p></div><Button render={<Link href="/uploader/upload-batches" />}><UploadCloud data-icon="inline-start" className="size-4" />Create Upload Batch</Button></section><div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">My Upload Batches</p><p className="mt-1 text-3xl font-semibold">{ownBatches.length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Awaiting Processing</p><p className="mt-1 text-3xl font-semibold">{ownBatches.filter((batch) => batch.status === "uploaded" || batch.status === "ready_for_processing").length}</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Centre</p><p className="mt-1 text-lg font-semibold">{centre.code}</p></CardContent></Card></div><Card><CardHeader><CardTitle>My centre</CardTitle><CardDescription>{college?.name ?? "Affiliated college unavailable"}</CardDescription></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-xs text-muted-foreground">Nodal centre</p><p className="mt-1 font-medium">{centre.name} ({centre.code})</p></div><div><p className="text-xs text-muted-foreground">Uploader</p><p className="mt-1 font-medium">{uploader.name}</p></div><div><p className="text-xs text-muted-foreground">Centre status</p><Badge variant="outline">{centre.status}</Badge></div><div><p className="text-xs text-muted-foreground">Recent batches</p><p className="mt-1 font-medium">{ownBatches.slice(0, 3).map((batch) => `${batch.batchNumber} · ${exams.find((exam) => exam.id === batch.examId)?.name ?? "Exam"}`).join(" | ") || "No uploads yet"}</p></div></CardContent></Card></div>
}
