import { EvaluatorRegistrationForm } from "@/components/evaluator-registration/evaluator-registration-form"

export default function EvaluatorRegistrationPage() {
  return (
    <main className="flex flex-1 bg-muted/25 px-4 py-8 md:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">OSM</p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Evaluator Registration
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Register as a faculty evaluator for university answer-sheet
            evaluation. New registrations remain pending until admin
            verification.
          </p>
        </div>
        <EvaluatorRegistrationForm />
      </div>
    </main>
  )
}
