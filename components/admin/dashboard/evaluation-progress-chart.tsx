"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AnswerSheetStatusCount } from "@/lib/dashboard"
import type { AnswerSheetStatus } from "@/types/osm"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

const statusColors: Record<AnswerSheetStatus, string> = {
  completed: "#0f766e",
  in_progress: "#2563eb",
  assigned: "#d97706",
  unassigned: "#71717a",
}

type EvaluationProgressChartProps = {
  statusCounts: AnswerSheetStatusCount[]
  progress: number
  totalSheets: number
}

export function EvaluationProgressChart({
  statusCounts,
  progress,
  totalSheets,
}: EvaluationProgressChartProps) {
  const chartData = statusCounts.map((statusCount) => ({
    name: statusCount.label,
    value: statusCount.count,
    status: statusCount.status,
    fill: statusColors[statusCount.status],
  }))
  const hasData = totalSheets > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Evaluation progress</CardTitle>
            <CardDescription>
              Answer-sheet status distribution from current demo state.
            </CardDescription>
          </div>
          <Badge variant="secondary">{progress}% complete</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div
            className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr]"
            role="img"
            aria-label={`Evaluation progress chart: ${progress}% complete across ${totalSheets} answer sheets.`}
          >
            <div className="relative h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke="var(--background)"
                    strokeWidth={3}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [
                      `${Number(value)} sheets`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-semibold tabular-nums">
                    {progress}%
                  </p>
                  <p className="text-xs text-muted-foreground">complete</p>
                </div>
              </div>
            </div>

            <div className="grid content-center gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {chartData.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No answer-sheet data is available yet.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
