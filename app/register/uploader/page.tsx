import { UploaderRegistrationForm } from "@/components/uploader-registration/uploader-registration-form"

export default function UploaderRegistrationPage() {
  return (
    <main className="flex flex-1 bg-muted/25 px-4 py-8 md:py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">OSM</p>
          <h1 className="text-2xl font-semibold tracking-normal md:text-3xl">
            Uploader Registration
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Register an affiliated-college uploader for answer-sheet operations.
            New registrations remain pending until admin verification.
          </p>
        </div>
        <UploaderRegistrationForm />
      </div>
    </main>
  )
}
