"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import { useOsmStore } from "@/stores/osm-store"
import type { MockUser } from "@/types/osm"
import { LogIn, RotateCcw, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type DemoSessionControlsProps = {
  compact?: boolean
  className?: string
}

function getRoleLabel(currentUser: MockUser | null) {
  if (!currentUser) {
    return "No active session"
  }

  return currentUser.role === "admin" ? "University Admin" : "Evaluator"
}

export function DemoSessionControls({
  compact = false,
  className,
}: DemoSessionControlsProps) {
  const router = useRouter()
  const isHydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const resetDemo = useOsmStore((state) => state.resetDemo)
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  function handleResetDemo() {
    resetDemo()
    setIsResetDialogOpen(false)
    router.refresh()
    toast.success("Demo data reset to the seeded baseline.")
  }

  if (!isHydrated) {
    return (
      <div
        className={cn(
          compact
            ? "flex flex-col gap-2 rounded-lg border bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
            : "space-y-3",
          className
        )}
        aria-label="Loading demo session"
      >
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className={cn("flex gap-2", compact ? "sm:justify-end" : "")}>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          compact
            ? "flex flex-col gap-3 rounded-lg border bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
            : "space-y-3",
          className
        )}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            <Badge variant={currentUser ? "secondary" : "outline"}>
              {getRoleLabel(currentUser)}
            </Badge>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {currentUser?.name ?? "Choose a demo role"}
          </p>
        </div>

        <div
          className={cn(
            "flex gap-2",
            compact ? "flex-wrap sm:justify-end" : "flex-col"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            className={compact ? "" : "w-full justify-start"}
            render={<Link href="/login" />}
          >
            <LogIn data-icon="inline-start" className="size-4" />
            Switch User
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={compact ? "" : "w-full justify-start"}
            onClick={() => setIsResetDialogOpen(true)}
          >
            <RotateCcw data-icon="inline-start" className="size-4" />
            Reset Demo
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the original prototype data and remove changes
              made during this demo session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleResetDemo}>
              Reset Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
