import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

type DashboardStatCardProps = {
  title: string
  value: number | string
  description: string
  icon: LucideIcon
}

export function DashboardStatCard({
  title,
  value,
  description,
  icon: Icon,
}: DashboardStatCardProps) {
  return (
    <Card size="sm">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardDescription>{title}</CardDescription>
            <CardTitle className="mt-1 text-2xl tabular-nums">
              {value}
            </CardTitle>
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
