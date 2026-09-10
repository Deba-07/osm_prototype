"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getCompatibleExamsForIntake,
  getCompatibleSubjectsForIntake,
  validateAnswerSheetIntakeInput,
  type AnswerSheetIntakeField,
} from "@/lib/answer-sheets"
import { cn } from "@/lib/utils"
import {
  answerSheetIntakeFormSchema,
  type AnswerSheetIntakeFormInput,
  type AnswerSheetIntakeFormValues,
} from "@/lib/validations/answer-sheet"
import type {
  AnswerSheet,
  AnswerSheetIntakeInput,
  Department,
  Exam,
  Program,
  Semester,
  Student,
  Subject,
} from "@/types/osm"
import { zodResolver } from "@hookform/resolvers/zod"
import { FilePlus2, ScanLine } from "lucide-react"
import { useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

type AddAnswerSheetDialogProps = {
  open: boolean
  answerSheets: AnswerSheet[]
  students: Student[]
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  createAnswerSheet: (input: AnswerSheetIntakeInput) => AnswerSheet | undefined
  onOpenChange: (open: boolean) => void
  onCreated: (answerSheet: AnswerSheet) => void
}

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

const defaultValues: AnswerSheetIntakeFormInput = {
  studentId: "",
  semesterId: "",
  subjectId: "",
  examId: "",
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function findById<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id)
}

export function AddAnswerSheetDialog({
  open,
  answerSheets,
  students,
  departments,
  programs,
  semesters,
  subjects,
  exams,
  createAnswerSheet,
  onOpenChange,
  onCreated,
}: AddAnswerSheetDialogProps) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
    control,
  } = useForm<
    AnswerSheetIntakeFormInput,
    unknown,
    AnswerSheetIntakeFormValues
  >({
    resolver: zodResolver(answerSheetIntakeFormSchema),
    defaultValues,
  })
  const selectedStudentId = useWatch({ control, name: "studentId" })
  const selectedSemesterId = useWatch({ control, name: "semesterId" })
  const selectedStudent = useMemo(
    () => findById(students, selectedStudentId),
    [selectedStudentId, students]
  )
  const selectedDepartment = selectedStudent
    ? findById(departments, selectedStudent.departmentId)
    : undefined
  const selectedProgram = selectedStudent
    ? findById(programs, selectedStudent.programId)
    : undefined
  const compatibleSubjects = useMemo(
    () =>
      getCompatibleSubjectsForIntake({
        student: selectedStudent,
        semesterId: selectedSemesterId,
        subjects,
      }),
    [selectedSemesterId, selectedStudent, subjects]
  )
  const compatibleExams = useMemo(
    () =>
      getCompatibleExamsForIntake({
        semesterId: selectedSemesterId,
        exams,
      }),
    [exams, selectedSemesterId]
  )
  const rootError = errors.root?.message

  function resetDependentAcademicFields() {
    setValue("subjectId", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
    setValue("examId", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function handleStudentChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const student = findById(students, event.target.value)

    setValue("semesterId", student?.currentSemesterId ?? "", {
      shouldDirty: true,
      shouldValidate: true,
    })
    resetDependentAcademicFields()
  }

  function handleSemesterChange() {
    resetDependentAcademicFields()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reset(defaultValues)
    }

    onOpenChange(nextOpen)
  }

  function onSubmit(values: AnswerSheetIntakeFormValues) {
    const validation = validateAnswerSheetIntakeInput({
      input: values,
      answerSheets,
      students,
      subjects,
      semesters,
      exams,
    })

    if (!validation.success) {
      for (const [field, message] of Object.entries(
        validation.fieldErrors
      ) as Array<[AnswerSheetIntakeField, string]>) {
        setError(field, {
          type: "manual",
          message,
        })
      }

      setError("root", {
        type: "manual",
        message: validation.message,
      })

      return
    }

    const answerSheet = createAnswerSheet(validation.data)

    if (!answerSheet) {
      setError("root", {
        type: "manual",
        message:
          "An answer sheet for this student, subject, semester, and exam already exists.",
      })

      return
    }

    toast.success("Answer sheet added successfully.")
    reset(defaultValues)
    onCreated(answerSheet)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add answer sheet</DialogTitle>
          <DialogDescription>
            Create a prototype answer-sheet record for the evaluation intake
            pool.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
          {rootError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {rootError}
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="studentId">Student</Label>
                <select
                  id="studentId"
                  className={cn(
                    selectClassName,
                    errors.studentId &&
                      "border-destructive ring-3 ring-destructive/20"
                  )}
                  aria-invalid={Boolean(errors.studentId)}
                  aria-describedby={
                    errors.studentId ? "studentId-error" : undefined
                  }
                  {...register("studentId", {
                    onChange: handleStudentChange,
                  })}
                >
                  <option value="">Select student</option>
                  {students.map((student) => {
                    const department = findById(departments, student.departmentId)
                    const program = findById(programs, student.programId)

                    return (
                      <option key={student.id} value={student.id}>
                        {student.name} | {student.rollNumber} |{" "}
                        {department?.code ?? "Dept"} |{" "}
                        {program?.code ?? "Program"}
                      </option>
                    )
                  })}
                </select>
                <FieldError
                  id="studentId-error"
                  message={errors.studentId?.message}
                />
              </div>

              {selectedStudent ? (
                <div className="rounded-lg border bg-muted/25 p-3 text-sm md:col-span-2">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        Roll Number
                      </p>
                      <p className="mt-1">{selectedStudent.rollNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        Department
                      </p>
                      <p className="mt-1">
                        {selectedDepartment?.name ?? "Department unavailable"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                        Program
                      </p>
                      <p className="mt-1">
                        {selectedProgram?.code ?? "Program unavailable"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="semesterId">Semester</Label>
                <select
                  id="semesterId"
                  className={cn(
                    selectClassName,
                    errors.semesterId &&
                      "border-destructive ring-3 ring-destructive/20"
                  )}
                  aria-invalid={Boolean(errors.semesterId)}
                  aria-describedby={
                    errors.semesterId ? "semesterId-error" : undefined
                  }
                  {...register("semesterId", {
                    onChange: handleSemesterChange,
                  })}
                >
                  <option value="">Select semester</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="semesterId-error"
                  message={errors.semesterId?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="examId">Exam</Label>
                <select
                  id="examId"
                  className={cn(
                    selectClassName,
                    errors.examId &&
                      "border-destructive ring-3 ring-destructive/20"
                  )}
                  aria-invalid={Boolean(errors.examId)}
                  aria-describedby={errors.examId ? "examId-error" : undefined}
                  disabled={selectedSemesterId.length === 0}
                  {...register("examId")}
                >
                  <option value="">
                    {selectedSemesterId ? "Select exam" : "Select semester first"}
                  </option>
                  {compatibleExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name}
                    </option>
                  ))}
                </select>
                <FieldError id="examId-error" message={errors.examId?.message} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subjectId">Subject</Label>
                <select
                  id="subjectId"
                  className={cn(
                    selectClassName,
                    errors.subjectId &&
                      "border-destructive ring-3 ring-destructive/20"
                  )}
                  aria-invalid={Boolean(errors.subjectId)}
                  aria-describedby={
                    errors.subjectId ? "subjectId-error" : undefined
                  }
                  disabled={!selectedStudent || selectedSemesterId.length === 0}
                  {...register("subjectId")}
                >
                  <option value="">
                    {!selectedStudent
                      ? "Select student first"
                      : selectedSemesterId.length === 0
                        ? "Select semester first"
                        : compatibleSubjects.length === 0
                          ? "No compatible subjects"
                          : "Select subject"}
                  </option>
                  {compatibleSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} | {subject.name}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="subjectId-error"
                  message={errors.subjectId?.message}
                />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-dashed bg-muted/20 p-4">
            <div className="flex gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                <ScanLine className="size-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Scanned file handling</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  This prototype creates the academic record with no persisted
                  scan file storage. Static scan assets can be connected later.
                </p>
                <Input
                  type="text"
                  value="0 scan pages will be stored for this simulated intake"
                  readOnly
                  className="mt-3"
                  aria-label="Simulated scan storage state"
                />
              </div>
            </div>
          </section>

          <DialogFooter className="mx-0 mb-0" showCloseButton>
            <Button type="submit" disabled={isSubmitting}>
              <FilePlus2 data-icon="inline-start" className="size-4" />
              Add Answer Sheet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
