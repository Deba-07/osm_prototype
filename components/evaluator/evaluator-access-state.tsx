import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, ShieldAlert } from "lucide-react"
import Link from "next/link"

type EvaluatorAccessStateProps = {
  title: string
  description: string
}

export function EvaluatorAccessState({
  title,
  description,
}: EvaluatorAccessStateProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" render={<Link href="/login" />}>
          <ArrowLeft data-icon="inline-start" className="size-4" />
          Return to demo login
        </Button>
      </CardContent>
    </Card>
  )
}
