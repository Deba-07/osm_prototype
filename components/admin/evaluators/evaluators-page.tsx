"use client"

import { EvaluatorReviewDialog } from "@/components/admin/evaluators/evaluator-review-dialog"
import { EvaluatorStats } from "@/components/admin/evaluators/evaluator-stats"
import { evaluatorStatusLabels } from "@/components/admin/evaluators/evaluator-status-badge"
import { EvaluatorTable } from "@/components/admin/evaluators/evaluator-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { departments } from "@/data/departments"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { useOsmStore } from "@/stores/osm-store"
import type { EvaluatorStatus } from "@/types/osm"
import { ArrowRight, Search } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type EvaluatorFilter = "all" | EvaluatorStatus

const filterLabels: Record<EvaluatorFilter, string> = {
  all: "All",
  ...evaluatorStatusLabels,
}

function EvaluatorsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading evaluators">
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full max-w-md" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

export function EvaluatorsPage() {
  const isHydrated = useOsmStoreHydrated()
  const evaluators = useOsmStore((state) => state.evaluators)
  const approveEvaluator = useOsmStore((state) => state.approveEvaluator)
  const rejectEvaluator = useOsmStore((state) => state.rejectEvaluator)
  const [filter, setFilter] = useState<EvaluatorFilter>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEvaluatorId, setSelectedEvaluatorId] = useState<string | null>(
    null
  )

  const counts = useMemo(
    () => ({
      all: evaluators.length,
      pending: evaluators.filter((evaluator) => evaluator.status === "pending")
        .length,
      approved: evaluators.filter(
        (evaluator) => evaluator.status === "approved"
      ).length,
      rejected: evaluators.filter(
        (evaluator) => evaluator.status === "rejected"
      ).length,
    }),
    [evaluators]
  )
  const filteredEvaluators = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchQuery)

    return evaluators.filter((evaluator) => {
      const matchesStatus = filter === "all" || evaluator.status === filter
      const matchesSearch =
        normalizedSearch.length === 0 ||
        evaluator.name.toLowerCase().includes(normalizedSearch) ||
        evaluator.email.toLowerCase().includes(normalizedSearch) ||
        evaluator.facultyId.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [evaluators, filter, searchQuery])
  const selectedEvaluator =
    evaluators.find((evaluator) => evaluator.id === selectedEvaluatorId) ?? null

  function handleApprove(evaluatorId: string) {
    const updated = approveEvaluator(evaluatorId)

    if (updated) {
      toast.success("Evaluator approved successfully.")
    } else {
      toast.info("Only pending evaluators can be approved.")
    }
  }

  function handleReject(evaluatorId: string) {
    const updated = rejectEvaluator(evaluatorId)

    if (updated) {
      toast.success("Evaluator registration rejected.")
    } else {
      toast.info("Only pending evaluators can be rejected.")
    }
  }

  if (!isHydrated) {
    return <EvaluatorsSkeleton />
  }

  const emptyMessage =
    normalizeSearch(searchQuery).length > 0
      ? "No evaluators match your search."
      : filter === "pending"
        ? "No evaluator registrations are awaiting verification."
        : "No evaluators are available for this view."

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            University Admin
          </p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Evaluator Verification
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Review faculty registrations and approve only eligible evaluators
            for future answer-sheet assignment.
          </p>
        </div>
        <Button variant="outline" render={<Link href="/register/evaluator" />}>
          Open Registration Form
          <ArrowRight data-icon="inline-end" className="size-4" />
        </Button>
      </section>

      <EvaluatorStats counts={counts} />

      <Card>
        <CardHeader>
          <CardTitle>Evaluator records</CardTitle>
          <CardDescription>
            Search and filter seeded plus newly submitted evaluator
            registrations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full max-w-md space-y-2">
            <Label htmlFor="evaluator-search">Search evaluators</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="evaluator-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name, email, or Faculty ID"
                className="pl-8"
              />
            </div>
          </div>

          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as EvaluatorFilter)}
          >
            <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
              {(["all", "pending", "approved", "rejected"] as const).map(
                (tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {filterLabels[tab]} ({counts[tab]})
                  </TabsTrigger>
                )
              )}
            </TabsList>
            <TabsContent value={filter} className="mt-4">
              <EvaluatorTable
                evaluators={filteredEvaluators}
                departments={departments}
                subjects={subjects}
                emptyMessage={emptyMessage}
                onReview={setSelectedEvaluatorId}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <EvaluatorReviewDialog
        evaluator={selectedEvaluator}
        departments={departments}
        subjects={subjects}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEvaluatorId(null)
          }
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  )
}
