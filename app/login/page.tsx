import { Badge } from "@/components/ui/badge"
import { DemoLoginPanel } from "@/components/layout/demo-login-panel"

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center bg-muted/25 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="space-y-3">
          <Badge variant="secondary">Demo session</Badge>
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              Open OSM Demo
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Choose University Admin or an approved evaluator. This prototype
              uses mock role switching, not production authentication.
            </p>
          </div>
        </section>
        <DemoLoginPanel />
      </div>
    </main>
  )
}
