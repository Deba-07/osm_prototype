"use client"

import { RegistrationSuccess } from "@/components/evaluator-registration/registration-success"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { cn } from "@/lib/utils"
import {
  evaluatorDesignationOptions,
  evaluatorRegistrationSchema,
  findEvaluatorRegistrationDuplicate,
  type EvaluatorRegistrationFormInput,
  type EvaluatorRegistrationFormValues,
} from "@/lib/validations/evaluator"
import { useOsmStore } from "@/stores/osm-store"
import type { Evaluator } from "@/types/osm"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p id={id} className="text-xs leading-5 text-destructive">
      {message}
    </p>
  )
}

function RegistrationFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28" />
      <Skeleton className="h-96" />
    </div>
  )
}

const defaultValues: EvaluatorRegistrationFormInput = {
  name: "",
  email: "",
  phone: "",
  facultyId: "",
  departmentId: "",
  designation: "Assistant Professor",
  experienceYears: 0,
  subjectExpertise: [],
}

export function EvaluatorRegistrationForm() {
  const isHydrated = useOsmStoreHydrated()
  const evaluators = useOsmStore((state) => state.evaluators)
  const registerEvaluator = useOsmStore((state) => state.registerEvaluator)
  const [submittedEvaluator, setSubmittedEvaluator] =
    useState<Evaluator | null>(null)
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<
    EvaluatorRegistrationFormInput,
    unknown,
    EvaluatorRegistrationFormValues
  >({
    resolver: zodResolver(evaluatorRegistrationSchema),
    defaultValues,
  })

  const selectedDepartmentId = useWatch({
    control,
    name: "departmentId",
  })
  const availableSubjects = useMemo(
    () =>
      selectedDepartmentId
        ? subjects.filter(
            (subject) => subject.departmentId === selectedDepartmentId
          )
        : [],
    [selectedDepartmentId]
  )
  const rootError = errors.root?.message

  function handleDepartmentSelectionChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const selectedDepartmentSubjectIds = new Set(
      subjects
        .filter((subject) => subject.departmentId === event.target.value)
        .map((subject) => subject.id)
    )
    const nextSubjectExpertise = getValues("subjectExpertise").filter(
      (subjectId) => selectedDepartmentSubjectIds.has(subjectId)
    )

    setValue("subjectExpertise", nextSubjectExpertise, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleRegisterAnother() {
    setSubmittedEvaluator(null)
    reset(defaultValues)
  }

  function onSubmit(values: EvaluatorRegistrationFormValues) {
    const duplicate = findEvaluatorRegistrationDuplicate({
      evaluators,
      email: values.email,
      facultyId: values.facultyId,
    })

    if (duplicate) {
      if (duplicate.email.toLowerCase() === values.email.toLowerCase()) {
        setError("email", {
          type: "manual",
          message: "An evaluator with this email is already registered.",
        })
      }

      if (duplicate.facultyId.toUpperCase() === values.facultyId.toUpperCase()) {
        setError("facultyId", {
          type: "manual",
          message: "This Faculty ID is already registered.",
        })
      }

      setError("root", {
        type: "manual",
        message:
          "This evaluator appears to be registered already. Check the email and Faculty ID.",
      })

      return
    }

    const evaluator = registerEvaluator({
      name: values.name,
      email: values.email,
      phone: values.phone,
      facultyId: values.facultyId,
      departmentId: values.departmentId,
      designation: values.designation,
      subjectExpertise: values.subjectExpertise,
      experienceYears: values.experienceYears,
    })

    setSubmittedEvaluator(evaluator)
    toast.success("Registration submitted for verification.")
  }

  if (!isHydrated) {
    return <RegistrationFormSkeleton />
  }

  if (submittedEvaluator) {
    return (
      <RegistrationSuccess
        evaluator={submittedEvaluator}
        onRegisterAnother={handleRegisterAnother}
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
          <CardTitle>Evaluator Registration</CardTitle>
          <CardDescription>
            Register as a faculty evaluator for university answer-sheet
            evaluation. All registrations are reviewed by the university admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-8"
            noValidate
            onSubmit={handleSubmit(onSubmit)}
          >
            {rootError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {rootError}
              </div>
            ) : null}

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Personal Information</h2>
                <p className="text-sm text-muted-foreground">
                  Contact details for verification and answer-sheet assignment
                  communication.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "name-error" : undefined}
                    {...register("name")}
                  />
                  <FieldError id="name-error" message={errors.name?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    {...register("email")}
                  />
                  <FieldError
                    id="email-error"
                    message={errors.email?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "phone-error" : undefined}
                    {...register("phone")}
                  />
                  <FieldError
                    id="phone-error"
                    message={errors.phone?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facultyId">Faculty ID</Label>
                  <Input
                    id="facultyId"
                    autoComplete="off"
                    placeholder="DSU-FAC-CSE-032"
                    aria-invalid={Boolean(errors.facultyId)}
                    aria-describedby={
                      errors.facultyId ? "facultyId-error" : undefined
                    }
                    {...register("facultyId")}
                  />
                  <FieldError
                    id="facultyId-error"
                    message={errors.facultyId?.message}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">
                  Professional Information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Department and role information used by the admin review
                  queue.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    id="departmentId"
                    className={cn(
                      "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      errors.departmentId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    aria-invalid={Boolean(errors.departmentId)}
                    aria-describedby={
                      errors.departmentId ? "departmentId-error" : undefined
                    }
                    {...register("departmentId", {
                      onChange: handleDepartmentSelectionChange,
                    })}
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="departmentId-error"
                    message={errors.departmentId?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <select
                    id="designation"
                    className={cn(
                      "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                      errors.designation &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    aria-invalid={Boolean(errors.designation)}
                    aria-describedby={
                      errors.designation ? "designation-error" : undefined
                    }
                    {...register("designation")}
                  >
                    {evaluatorDesignationOptions.map((designation) => (
                      <option key={designation} value={designation}>
                        {designation}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="designation-error"
                    message={errors.designation?.message}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min={0}
                    max={50}
                    aria-invalid={Boolean(errors.experienceYears)}
                    aria-describedby={
                      errors.experienceYears
                        ? "experienceYears-error"
                        : undefined
                    }
                    {...register("experienceYears")}
                  />
                  <FieldError
                    id="experienceYears-error"
                    message={errors.experienceYears?.message}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-medium">Academic Expertise</h2>
                <p className="text-sm text-muted-foreground">
                  Select one or more subjects from the chosen department.
                </p>
              </div>
              <Controller
                control={control}
                name="subjectExpertise"
                render={({ field }) => {
                  const selectedSubjects = field.value ?? []

                  return (
                    <div
                      className={cn(
                        "rounded-lg border p-3",
                        errors.subjectExpertise &&
                          "border-destructive ring-3 ring-destructive/20"
                      )}
                      aria-describedby={
                        errors.subjectExpertise
                          ? "subjectExpertise-error"
                          : undefined
                      }
                    >
                      {availableSubjects.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {availableSubjects.map((subject) => {
                            const checkboxId = `subject-${subject.id}`
                            const isChecked = selectedSubjects.includes(
                              subject.id
                            )

                            return (
                              <div
                                key={subject.id}
                                className="flex items-start gap-3 rounded-lg border bg-background p-3"
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={isChecked}
                                  aria-invalid={Boolean(
                                    errors.subjectExpertise
                                  )}
                                  onCheckedChange={(checked) => {
                                    const nextSubjects = checked
                                      ? Array.from(
                                          new Set([
                                            ...selectedSubjects,
                                            subject.id,
                                          ])
                                        )
                                      : selectedSubjects.filter(
                                          (subjectId) =>
                                            subjectId !== subject.id
                                        )

                                    field.onChange(nextSubjects)
                                  }}
                                />
                                <Label
                                  htmlFor={checkboxId}
                                  className="block cursor-pointer space-y-1 leading-normal"
                                >
                                  <span>{subject.name}</span>
                                  <span className="block text-xs font-normal text-muted-foreground">
                                    {subject.code} | {subject.maximumMarks} marks
                                  </span>
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          Select a department to view subject expertise areas.
                        </div>
                      )}
                    </div>
                  )
                }}
              />
              <FieldError
                id="subjectExpertise-error"
                message={errors.subjectExpertise?.message}
              />
            </section>

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
