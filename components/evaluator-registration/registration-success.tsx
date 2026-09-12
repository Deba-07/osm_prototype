import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Evaluator } from "@/types/osm"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

type RegistrationSuccessProps = {
  evaluator: Evaluator
  onRegisterAnother: () => void
}

export function RegistrationSuccess({
  evaluator,
  onRegisterAnother,
}: RegistrationSuccessProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <CardTitle>Registration submitted</CardTitle>
            <CardDescription>
              Your evaluator registration has been sent for university
              verification.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/25 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-medium">{evaluator.name}</p>
              <p className="text-sm text-muted-foreground">
                {evaluator.email}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Faculty ID: {evaluator.facultyId}
              </p>
            </div>
            <Badge variant="outline">Pending Verification</Badge>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The evaluator will become eligible for answer-sheet assignment only
          after the university admin approves this registration.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button render={<Link href="/login" />}>Back to Login</Button>
        <Button type="button" variant="outline" onClick={onRegisterAnother}>
          Register Another Evaluator
        </Button>
      </CardFooter>
    </Card>
  )
}
