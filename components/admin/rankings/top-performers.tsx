import { Badge } from "@/components/ui/badge"

export type TopPerformerItem = {
  id: string
  rank: number
  name: string
  context: string
  score: string
  marks: string
  detail: string
}

type TopPerformersProps = {
  title: string
  description: string
  performers: TopPerformerItem[]
  emptyMessage: string
}

export function TopPerformers({
  title,
  description,
  performers,
  emptyMessage,
}: TopPerformersProps) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      {performers.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {performers.map((performer) => (
            <article
              key={performer.id}
              className="rounded-lg border bg-muted/20 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge variant="secondary" className="tabular-nums">
                  Rank {performer.rank}
                </Badge>
                <span className="text-lg font-semibold tabular-nums">
                  {performer.score}
                </span>
              </div>
              <div className="mt-4 min-w-0 space-y-1">
                <p className="truncate font-medium">{performer.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {performer.context}
                </p>
              </div>
              <div className="mt-4 grid gap-1 text-xs text-muted-foreground">
                <span className="tabular-nums">{performer.marks}</span>
                <span>{performer.detail}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )}
    </section>
  )
}
