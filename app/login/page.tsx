import { DemoLoginPanel } from "@/components/layout/demo-login-panel"
import { RoutePlaceholder } from "@/components/layout/route-placeholder"

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center bg-muted/25 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <RoutePlaceholder
          eyebrow="Demo session"
          title="Login"
          description="A mock role switcher for the prototype. No production authentication is configured."
        >
          <DemoLoginPanel />
        </RoutePlaceholder>
      </div>
    </main>
  )
}
