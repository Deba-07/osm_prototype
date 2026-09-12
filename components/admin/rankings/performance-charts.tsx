"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { PerformanceAnalyticsEntry } from "@/lib/rankings"
import { formatMarks, formatPercentage } from "@/components/admin/rankings/ranking-table"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type PerformanceChartProps = {
  title: string
  description: string
  emptyMessage: string
  entries: PerformanceAnalyticsEntry[]
  barColor: string
}

type PerformanceTooltipPayload = {
  payload?: PerformanceAnalyticsEntry
}

function chartData(entries: PerformanceAnalyticsEntry[]) {
  return entries.map((entry) => ({
    ...entry,
    label: entry.code,
  }))
}

function PerformanceTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: PerformanceTooltipPayload[]
}) {
  const entry = payload?.[0]?.payload

  if (!active || !entry) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-sm">
      <p className="font-medium">{entry.name}</p>
      <p className="mt-1 text-muted-foreground">
        {formatPercentage(entry.percentage)} from {entry.resultCount} result
        {entry.resultCount === 1 ? "" : "s"}
      </p>
      <p className="text-muted-foreground">
        {formatMarks(entry.totalMarks)} / {formatMarks(entry.maximumMarks)}
      </p>
    </div>
  )
}

function PerformanceChart({
  title,
  description,
  emptyMessage,
  entries,
  barColor,
}: PerformanceChartProps) {
  const data = chartData(entries)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="space-y-5">
            <div
              className="h-72 min-w-0"
              role="img"
              aria-label={`${title} weighted percentage chart`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart accessibilityLayer data={data} margin={{ left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    width={36}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<PerformanceTooltip />} />
                  <Bar
                    dataKey="percentage"
                    fill={barColor}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.resultCount} result
                        {entry.resultCount === 1 ? "" : "s"} |{" "}
                        {entry.studentCount} student
                        {entry.studentCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatPercentage(entry.percentage)}
                    </span>
                  </div>
                  <Progress
                    aria-label={`${entry.name} average performance`}
                    value={entry.percentage}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function DepartmentPerformance({
  entries,
}: {
  entries: PerformanceAnalyticsEntry[]
}) {
  return (
    <PerformanceChart
      title="Department Performance"
      description="Weighted submitted-result performance grouped by department."
      emptyMessage="No department performance data matches the selected context."
      entries={entries}
      barColor="#0f766e"
    />
  )
}

export function SubjectPerformance({
  entries,
}: {
  entries: PerformanceAnalyticsEntry[]
}) {
  return (
    <PerformanceChart
      title="Subject Performance"
      description="Weighted submitted-result performance grouped by subject."
      emptyMessage="No subject performance data matches the selected context."
      entries={entries}
      barColor="#2563eb"
    />
  )
}
