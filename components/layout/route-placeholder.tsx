import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ReactNode } from "react"

type RouteStat = {
  label: string
  value: number | string
}

type RoutePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  stats?: RouteStat[]
  children?: ReactNode
}

export function RoutePlaceholder({
  eyebrow,
  title,
  description,
  stats = [],
  children,
}: RoutePlaceholderProps) {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <Badge variant="secondary">{eyebrow}</Badge>
        <div className="max-w-3xl space-y-2">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground">
            {title}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      {stats.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} size="sm">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : null}

      {children ? <div>{children}</div> : null}
    </section>
  )
}
