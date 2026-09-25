"use client"

import { DemoSessionControls } from "@/components/layout/demo-session-controls"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import {
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileStack,
  LayoutDashboard,
  Building2,
  MapPinned,
  UserRoundPlus,
  Files,
  Workflow,
  ListChecks,
  School,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

type NavigationItem = {
  href: string
  label: string
  icon: LucideIcon
}

type RoleShellProps = {
  title: string
  subtitle: string
  navItems: NavigationItem[]
  children: ReactNode
}

const adminNavigation: NavigationItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/students",
    label: "Students",
    icon: Users,
  },
  {
    href: "/admin/institute",
    label: "Institute",
    icon: Building2,
  },
  {
    href: "/admin/nodal-centres",
    label: "Nodal Centres",
    icon: MapPinned,
  },
  {
    href: "/admin/uploaders",
    label: "Uploaders",
    icon: UserRoundPlus,
  },
  {
    href: "/admin/upload-batches",
    label: "Upload Batches",
    icon: Files,
  },
  {
    href: "/admin/pdf-processing",
    label: "PDF Processing",
    icon: Workflow,
  },
  {
    href: "/admin/evaluators",
    label: "Evaluators",
    icon: UserCheck,
  },
  {
    href: "/admin/answer-sheets",
    label: "Answer Sheets",
    icon: FileStack,
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    icon: ClipboardList,
  },
  {
    href: "/admin/results",
    label: "Results",
    icon: ListChecks,
  },
  {
    href: "/admin/rankings",
    label: "Rankings",
    icon: Trophy,
  },
]

const evaluatorNavigation: NavigationItem[] = [
  {
    href: "/evaluator/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/evaluator/assigned",
    label: "Assigned Sheets",
    icon: BookOpenCheck,
  },
  {
    href: "/evaluator/completed",
    label: "Completed",
    icon: CheckCircle2,
  },
]

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function RoleShell({ title, subtitle, navItems, children }: RoleShellProps) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/25 md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <School className="size-5" aria-hidden="true" />
          </div>
          <div>
            <Link href="/" className="text-base font-semibold">
              OSM
            </Link>
            <p className="text-xs text-muted-foreground">Demo workspace</p>
          </div>
        </div>
        <Separator />
        <div className="px-4 py-5">
          <p className="px-2 text-xs font-medium uppercase tracking-normal text-muted-foreground">
            {title}
          </p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(pathname, item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <DemoSessionControls />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b bg-background/95 px-4 py-4 md:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                {subtitle}
              </p>
              <p className="text-base font-semibold">{title}</p>
            </div>
            <nav className="flex gap-2 overflow-x-auto pb-1 md:hidden">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <DemoSessionControls compact className="md:hidden" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleShell
      title="University Admin"
      subtitle="OSM administration"
      navItems={adminNavigation}
    >
      {children}
    </RoleShell>
  )
}

export function EvaluatorShell({ children }: { children: ReactNode }) {
  return (
    <RoleShell
      title="Evaluator Workspace"
      subtitle="Faculty evaluation"
      navItems={evaluatorNavigation}
    >
      {children}
    </RoleShell>
  )
}
