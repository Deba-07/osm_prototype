"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { Uploader, UploaderStatus } from "@/types/osm"
import { CheckCircle2, Eye, Search, UserRoundPlus, XCircle } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type StatusFilter = "all" | UploaderStatus
const statusLabels: Record<UploaderStatus, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected" }
const statusClassNames: Record<UploaderStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}

function StatusBadge({ status }: { status: UploaderStatus }) {
  return <Badge variant="outline" className={statusClassNames[status]}>{statusLabels[status]}</Badge>
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return <div className="space-y-1"><dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">{label}</dt><dd className="text-sm">{value}</dd></div>
}

function UploadersSkeleton() {
  return <div className="space-y-6" aria-label="Loading uploader registrations"><div className="space-y-3"><Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-full max-w-md" /><Skeleton className="h-5 w-full max-w-xl" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div><Skeleton className="h-[28rem]" /></div>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

export function UploadersPage() {
  const hydrated = useOsmStoreHydrated()
  const uploaders = useOsmStore((state) => state.uploaders)
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const approveUploader = useOsmStore((state) => state.approveUploader)
  const rejectUploader = useOsmStore((state) => state.rejectUploader)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [collegeFilter, setCollegeFilter] = useState("")
  const [centreFilter, setCentreFilter] = useState("")
  const [selectedUploaderId, setSelectedUploaderId] = useState<string | null>(null)

  const counts = useMemo(() => ({
    total: uploaders.length,
    pending: uploaders.filter((uploader) => uploader.status === "pending").length,
    approved: uploaders.filter((uploader) => uploader.status === "approved").length,
    rejected: uploaders.filter((uploader) => uploader.status === "rejected").length,
  }), [uploaders])
  const filteredUploaders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return uploaders.filter((uploader) => {
      const matchesSearch = query.length === 0 || uploader.name.toLowerCase().includes(query) || uploader.email.toLowerCase().includes(query)
      const matchesStatus = statusFilter === "all" || uploader.status === statusFilter
      const matchesCollege = !collegeFilter || uploader.collegeId === collegeFilter
      const matchesCentre = !centreFilter || uploader.nodalCentreId === centreFilter
      return matchesSearch && matchesStatus && matchesCollege && matchesCentre
    })
  }, [centreFilter, collegeFilter, searchQuery, statusFilter, uploaders])
  const selectedUploader = uploaders.find((uploader) => uploader.id === selectedUploaderId) ?? null

  function getCollegeName(uploader: Uploader) {
    return colleges.find((college) => college.id === uploader.collegeId)?.name ?? "Unknown college"
  }
  function getCentreName(uploader: Uploader) {
    return nodalCentres.find((centre) => centre.id === uploader.nodalCentreId)?.name ?? "Unknown centre"
  }
  function handleApprove(uploader: Uploader) {
    if (approveUploader(uploader.id)) toast.success(uploader.name + " was approved.")
  }
  function handleReject(uploader: Uploader) {
    if (rejectUploader(uploader.id, "Registration did not meet the current centre verification requirements.")) toast.success(uploader.name + " was rejected.")
  }

  if (!hydrated) return <UploadersSkeleton />
  const statCards = [
    { label: "Total uploaders", value: counts.total, tone: "text-foreground" },
    { label: "Pending", value: counts.pending, tone: "text-amber-700 dark:text-amber-300" },
    { label: "Approved", value: counts.approved, tone: "text-emerald-700 dark:text-emerald-300" },
    { label: "Rejected", value: counts.rejected, tone: "text-destructive" },
  ]

  return <div className="space-y-6">
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl space-y-2"><p className="text-sm font-medium text-muted-foreground">University Admin</p><h1 className="text-2xl font-semibold tracking-normal md:text-3xl">Uploader Verification</h1><p className="text-sm leading-6 text-muted-foreground">Review registration requests from affiliated-college staff before future answer-sheet upload access is introduced.</p></div><Button variant="outline" render={<Link href="/register/uploader" />}><UserRoundPlus data-icon="inline-start" className="size-4" />Open Registration Form</Button></section>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Uploader summary">{statCards.map((stat) => <Card key={stat.label} size="sm"><CardContent className="space-y-2"><p className="text-sm text-muted-foreground">{stat.label}</p><p className={cn("text-3xl font-semibold", stat.tone)}>{stat.value}</p></CardContent></Card>)}</section>
    <Card><CardHeader><CardTitle>Uploader registrations</CardTitle><CardDescription>Search, filter, and inspect uploader registrations linked to a valid college and nodal centre.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(160px,1fr))]">
        <div className="space-y-2"><Label htmlFor="uploader-search">Search</Label><div className="relative"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="uploader-search" className="pl-8" placeholder="Name or email" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} /></div></div>
        <div className="space-y-2"><Label htmlFor="uploader-status">Status</Label><select id="uploader-status" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <div className="space-y-2"><Label htmlFor="uploader-college-filter">College</Label><select id="uploader-college-filter" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={collegeFilter} onChange={(event) => setCollegeFilter(event.target.value)}><option value="">All colleges</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.code} · {college.name}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor="uploader-centre-filter">Nodal centre</Label><select id="uploader-centre-filter" className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={centreFilter} onChange={(event) => setCentreFilter(event.target.value)}><option value="">All centres</option>{nodalCentres.map((centre) => <option key={centre.id} value={centre.id}>{centre.code} · {centre.name}</option>)}</select></div>
      </div>
      <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[950px] text-sm"><thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Uploader</th><th className="px-4 py-3 font-medium">College</th><th className="px-4 py-3 font-medium">Nodal centre</th><th className="px-4 py-3 font-medium">Registered</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr></thead><tbody className="divide-y">
        {filteredUploaders.map((uploader) => <tr key={uploader.id}><td className="px-4 py-3"><p className="font-medium">{uploader.name}</p><p className="text-xs text-muted-foreground">{uploader.email}</p></td><td className="px-4 py-3 text-muted-foreground">{getCollegeName(uploader)}</td><td className="px-4 py-3 text-muted-foreground">{getCentreName(uploader)}</td><td className="px-4 py-3 text-muted-foreground">{formatDate(uploader.registeredAt)}</td><td className="px-4 py-3"><StatusBadge status={uploader.status} /></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setSelectedUploaderId(uploader.id)}><Eye data-icon="inline-start" className="size-3.5" />Details</Button>{uploader.status === "pending" && <><Button type="button" variant="destructive" size="sm" onClick={() => handleReject(uploader)}>Reject</Button><Button type="button" size="sm" onClick={() => handleApprove(uploader)}>Approve</Button></>}</div></td></tr>)}
        {filteredUploaders.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No uploader registrations match the current filters.</td></tr>}
      </tbody></table></div>
    </CardContent></Card>
    <Dialog open={Boolean(selectedUploader)} onOpenChange={(open) => !open && setSelectedUploaderId(null)}><DialogContent className="sm:max-w-2xl">{selectedUploader && <><DialogHeader><DialogTitle>Uploader registration</DialogTitle><DialogDescription>Review the identity and centre relationship before verification.</DialogDescription></DialogHeader><div className="space-y-5"><div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/25 p-4"><div><p className="text-base font-medium">{selectedUploader.name}</p><p className="text-sm text-muted-foreground">{selectedUploader.email}</p></div><StatusBadge status={selectedUploader.status} /></div><dl className="grid gap-4 sm:grid-cols-2"><DetailItem label="Email" value={selectedUploader.email} /><DetailItem label="Phone" value={selectedUploader.phone ?? "Not provided"} /><DetailItem label="Affiliated college" value={getCollegeName(selectedUploader)} /><DetailItem label="Nodal centre" value={getCentreName(selectedUploader)} /><DetailItem label="Registered" value={formatDate(selectedUploader.registeredAt)} />{selectedUploader.rejectionReason && <DetailItem label="Rejection reason" value={selectedUploader.rejectionReason} />}</dl></div><DialogFooter showCloseButton>{selectedUploader.status === "pending" && <><Button type="button" variant="destructive" onClick={() => handleReject(selectedUploader)}><XCircle data-icon="inline-start" className="size-4" />Reject</Button><Button type="button" onClick={() => handleApprove(selectedUploader)}><CheckCircle2 data-icon="inline-start" className="size-4" />Approve</Button></>}</DialogFooter></>}</DialogContent></Dialog>
  </div>
}
