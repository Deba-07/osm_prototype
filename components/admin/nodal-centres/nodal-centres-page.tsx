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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { universityContext } from "@/data/university"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { NodalCentre, NodalCentreStatus } from "@/types/osm"
import { Eye, MapPinned, Search, UserRound } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

const statusLabels: Record<NodalCentreStatus, string> = {
  active: "Active",
  pending: "Pending",
  inactive: "Inactive",
}

const statusClassNames: Record<NodalCentreStatus, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300",
  inactive:
    "border-border bg-muted/60 text-muted-foreground dark:bg-muted/40",
}

type StatusFilter = "all" | NodalCentreStatus

function NodalCentresSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading nodal centres">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-[28rem]" />
    </div>
  )
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function StatusBadge({ status }: { status: NodalCentreStatus }) {
  return (
    <Badge variant="outline" className={statusClassNames[status]}>
      {statusLabels[status]}
    </Badge>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{children}</p>
    </div>
  )
}

export function NodalCentresPage() {
  const hydrated = useOsmStoreHydrated()
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const updateNodalCentreStatus = useOsmStore(
    (state) => state.updateNodalCentreStatus
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [collegeFilter, setCollegeFilter] = useState("")
  const [selectedCentreId, setSelectedCentreId] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      total: nodalCentres.length,
      active: nodalCentres.filter((centre) => centre.status === "active").length,
      pending: nodalCentres.filter((centre) => centre.status === "pending").length,
      inactive: nodalCentres.filter((centre) => centre.status === "inactive").length,
    }),
    [nodalCentres]
  )
  const filteredCentres = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchQuery)

    return nodalCentres.filter((centre) => {
      const matchesStatus = statusFilter === "all" || centre.status === statusFilter
      const matchesCollege =
        collegeFilter.length === 0 || centre.affiliatedCollegeId === collegeFilter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        centre.name.toLowerCase().includes(normalizedSearch) ||
        centre.code.toLowerCase().includes(normalizedSearch) ||
        centre.superintendent.name.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesCollege && matchesSearch
    })
  }, [collegeFilter, nodalCentres, searchQuery, statusFilter])
  const selectedCentre =
    nodalCentres.find((centre) => centre.id === selectedCentreId) ?? null

  function getCollegeName(centre: NodalCentre) {
    return (
      colleges.find((college) => college.id === centre.affiliatedCollegeId)?.name ??
      "Unknown college"
    )
  }

  function changeStatus(centre: NodalCentre, status: NodalCentreStatus) {
    if (!updateNodalCentreStatus(centre.id, status)) {
      return
    }

    toast.success(`${centre.name} is now ${statusLabels[status].toLowerCase()}.`)
  }

  if (!hydrated) {
    return <NodalCentresSkeleton />
  }

  const statCards = [
    { label: "Total centres", value: counts.total, tone: "text-foreground" },
    { label: "Active", value: counts.active, tone: "text-emerald-700 dark:text-emerald-300" },
    { label: "Pending", value: counts.pending, tone: "text-amber-700 dark:text-amber-300" },
    { label: "Inactive", value: counts.inactive, tone: "text-muted-foreground" },
  ]

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">University Admin</p>
        <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
          Nodal Centre Management
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Coordinate physical examination centres and the superintendents responsible
          for script operations across {universityContext.name}.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Nodal centre summary">
        {statCards.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={cn("text-3xl font-semibold", stat.tone)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Centre directory</CardTitle>
          <CardDescription>
            Search centres, filter by status or college, and inspect centre assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(240px,1.4fr)_repeat(2,minmax(180px,1fr))]">
            <div className="space-y-2">
              <Label htmlFor="nodal-centre-search">Search centres</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="nodal-centre-search"
                  className="pl-8"
                  placeholder="Centre name, code, superintendent"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nodal-centre-status">Status</Label>
              <select
                id="nodal-centre-status"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nodal-centre-college">Affiliated college</Label>
              <select
                id="nodal-centre-college"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={collegeFilter}
                onChange={(event) => setCollegeFilter(event.target.value)}
              >
                <option value="">All colleges</option>
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.code} · {college.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Centre</th>
                  <th className="px-4 py-3 font-medium">College</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Superintendent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCentres.map((centre) => (
                  <tr key={centre.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{centre.name}</p>
                      <p className="text-xs text-muted-foreground">{centre.code}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{getCollegeName(centre)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {centre.city}, {centre.state}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{centre.superintendent.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={centre.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCentreId(centre.id)}
                        >
                          <Eye data-icon="inline-start" className="size-3.5" />
                          Details
                        </Button>
                        {centre.status === "pending" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => changeStatus(centre, "active")}
                          >
                            Activate
                          </Button>
                        )}
                        {centre.status === "active" && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => changeStatus(centre, "inactive")}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCentres.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No nodal centres match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedCentre)} onOpenChange={(open) => !open && setSelectedCentreId(null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedCentre && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCentre.name}</DialogTitle>
                <DialogDescription>
                  {selectedCentre.code} · Centre details and responsibility assignment
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPinned className="size-4 text-muted-foreground" aria-hidden="true" />
                    <StatusBadge status={selectedCentre.status} />
                  </div>
                  <DetailRow label="Institute">{universityContext.name}</DetailRow>
                  <DetailRow label="Affiliated college">{getCollegeName(selectedCentre)}</DetailRow>
                  <DetailRow label="Centre code">{selectedCentre.code}</DetailRow>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <UserRound className="size-4 text-muted-foreground" aria-hidden="true" />
                    Centre superintendent
                  </div>
                  <DetailRow label="Name">{selectedCentre.superintendent.name}</DetailRow>
                  <DetailRow label="Email">{selectedCentre.superintendent.email}</DetailRow>
                  <DetailRow label="Phone">{selectedCentre.superintendent.phone}</DetailRow>
                </div>
                <div className="sm:col-span-2">
                  <DetailRow label="Address">
                    {selectedCentre.address}, {selectedCentre.city}, {selectedCentre.state},{" "}
                    {selectedCentre.country} · {selectedCentre.pin}
                  </DetailRow>
                </div>
              </div>
              <DialogFooter showCloseButton>
                {selectedCentre.status === "pending" && (
                  <Button onClick={() => changeStatus(selectedCentre, "active")}>
                    Activate centre
                  </Button>
                )}
                {selectedCentre.status === "active" && (
                  <Button
                    variant="outline"
                    onClick={() => changeStatus(selectedCentre, "inactive")}
                  >
                    Deactivate centre
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
