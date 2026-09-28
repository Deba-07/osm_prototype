"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { validateUploaderRelationship } from "@/lib/uploaders"
import {
  uploaderRegistrationSchema,
  type UploaderRegistrationFormInput,
  type UploaderRegistrationFormValues,
} from "@/lib/validations/uploader"
import { useOsmStore } from "@/stores/osm-store"
import type { Uploader } from "@/types/osm"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-xs leading-5 text-destructive">
      {message}
    </p>
  ) : null
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28" />
      <Skeleton className="h-80" />
    </div>
  )
}

function RegistrationSuccess({
  uploader,
  onRegisterAnother,
}: {
  uploader: Uploader
  onRegisterAnother: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration submitted</CardTitle>
        <CardDescription>
          The uploader registration has been sent for admin verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/25 p-4">
          <p className="font-medium">{uploader.name}</p>
          <p className="text-sm text-muted-foreground">{uploader.email}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: Pending verification
          </p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The uploader will be eligible for future answer-sheet upload workflows
          only after an admin approves this registration.
        </p>
      </CardContent>
      <div className="flex flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" onClick={onRegisterAnother}>
          Register Another Uploader
        </Button>
        <Button render={<Link href="/login" />}>Back to Login</Button>
      </div>
    </Card>
  )
}

export function UploaderRegistrationForm() {
  const hydrated = useOsmStoreHydrated()
  const colleges = useOsmStore((state) => state.affiliatedColleges)
  const nodalCentres = useOsmStore((state) => state.nodalCentres)
  const registerUploader = useOsmStore((state) => state.registerUploader)
  const [submittedUploader, setSubmittedUploader] = useState<Uploader | null>(
    null
  )
  const [rootError, setRootError] = useState<string | undefined>()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    control,
    setError,
  } = useForm<UploaderRegistrationFormInput, unknown, UploaderRegistrationFormValues>(
    {
      resolver: zodResolver(uploaderRegistrationSchema),
      defaultValues: { name: "", email: "", collegeId: "", nodalCentreId: "" },
    }
  )
  const selectedCollegeId = useWatch({ control, name: "collegeId" })
  const availableCentres = useMemo(
    () =>
      nodalCentres.filter(
        (centre) => centre.affiliatedCollegeId === selectedCollegeId
      ),
    [nodalCentres, selectedCollegeId]
  )

  function onSubmit(values: UploaderRegistrationFormValues) {
    setRootError(undefined)
    const relationshipError = validateUploaderRelationship({
      collegeId: values.collegeId,
      nodalCentreId: values.nodalCentreId,
      affiliatedColleges: colleges,
      nodalCentres,
    })

    if (relationshipError) {
      setRootError(relationshipError)
      return
    }

    const uploader = registerUploader(values)
    if (!uploader) {
      setError("email", {
        type: "manual",
        message: "An uploader with this email is already registered.",
      })
      setRootError("This uploader appears to be registered already.")
      return
    }

    setSubmittedUploader(uploader)
    toast.success("Uploader registration submitted for verification.")
  }

  if (!hydrated) return <FormSkeleton />

  if (submittedUploader) {
    return (
      <RegistrationSuccess
        uploader={submittedUploader}
        onRegisterAnother={() => {
          setSubmittedUploader(null)
          reset()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" render={<Link href="/login" />}>
        <ArrowLeft data-icon="inline-start" className="size-4" />
        Back to Login
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Uploader details</CardTitle>
          <CardDescription>
            Select the affiliated college first. Only its nodal centres can be
            selected for this registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
            {rootError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {rootError}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="uploader-name">Full Name</Label>
                <Input id="uploader-name" autoComplete="name" {...register("name")} />
                <FieldError id="uploader-name-error" message={errors.name?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploader-email">Email Address</Label>
                <Input id="uploader-email" type="email" autoComplete="email" {...register("email")} />
                <FieldError id="uploader-email-error" message={errors.email?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploader-college">Affiliated College</Label>
                <select
                  id="uploader-college"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...register("collegeId")}
                >
                  <option value="">Select affiliated college</option>
                  {colleges
                    .filter((college) => college.status === "active")
                    .map((college) => (
                      <option key={college.id} value={college.id}>
                        {college.code} · {college.name}
                      </option>
                    ))}
                </select>
                <FieldError id="uploader-college-error" message={errors.collegeId?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploader-centre">Nodal Centre</Label>
                <select
                  id="uploader-centre"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  disabled={!selectedCollegeId}
                  {...register("nodalCentreId")}
                >
                  <option value="">
                    {selectedCollegeId ? "Select nodal centre" : "Select college first"}
                  </option>
                  {availableCentres
                    .filter((centre) => centre.status === "active")
                    .map((centre) => (
                      <option key={centre.id} value={centre.id}>
                        {centre.code} · {centre.name}
                      </option>
                    ))}
                </select>
                <FieldError id="uploader-centre-error" message={errors.nodalCentreId?.message} />
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-end">
              <Button variant="outline" type="button" onClick={() => reset()}>
                Reset Form
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Send data-icon="inline-start" className="size-4" />
                Submit Registration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
