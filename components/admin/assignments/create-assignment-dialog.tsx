"use client"

import { AnswerSheetStatusBadge } from "@/components/admin/answer-sheets/answer-sheet-status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  answerSheetStatusLabels,
  resolveAnswerSheets,
  type ResolvedAnswerSheet,
} from "@/lib/answer-sheets"
import {
  MAX_ACTIVE_SHEETS_PER_EVALUATOR,
  getApprovedEvaluators,
  getEligibleUnassignedSheets,
  getEvaluatorAssignmentWorkload,
  isEvaluatorEligibleForSubject,
  validateAssignment,
  type AnswerSheetAssignmentInput,
  type AnswerSheetAssignmentResult,
  type AssignmentValidationField,
} from "@/lib/assignments"
import { cn } from "@/lib/utils"
import type {
  AnswerSheet,
  Department,
  Evaluator,
  Exam,
  Program,
  Semester,
  Student,
  Subject,
} from "@/types/osm"
import { ClipboardCheck, UsersRound } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type CreateAssignmentDialogProps = {
  open: boolean
  answerSheets: AnswerSheet[]
  students: Student[]
  evaluators: Evaluator[]
  departments: Department[]
  programs: Program[]
  semesters: Semester[]
  subjects: Subject[]
  exams: Exam[]
  assignAnswerSheets: (
    input: AnswerSheetAssignmentInput
  ) => AnswerSheetAssignmentResult
  onOpenChange: (open: boolean) => void
}

type FieldErrors = Partial<Record<AssignmentValidationField, string>>

const defaultAssignmentInput: AnswerSheetAssignmentInput = {
  departmentId: "",
  semesterId: "",
  subjectId: "",
  examId: "",
  evaluatorId: "",
  answerSheetIds: [],
}

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function findById<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id)
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

function SelectionEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function CreateAssignmentDialog({
  open,
  answerSheets,
  students,
  evaluators,
  departments,
  programs,
  semesters,
  subjects,
  exams,
  assignAnswerSheets,
  onOpenChange,
}: CreateAssignmentDialogProps) {
  const [form, setForm] = useState<AnswerSheetAssignmentInput>(
    defaultAssignmentInput
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [rootError, setRootError] = useState<string | null>(null)
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const selectedDepartment = findById(departments, form.departmentId)
  const selectedSemester = findById(semesters, form.semesterId)
  const selectedSubject = findById(subjects, form.subjectId)
  const selectedExam = findById(exams, form.examId)
  const approvedEvaluators = useMemo(
    () => getApprovedEvaluators(evaluators),
    [evaluators]
  )
  const matchingEvaluators = useMemo(
    () =>
      form.subjectId
        ? approvedEvaluators.filter((evaluator) =>
            isEvaluatorEligibleForSubject(evaluator, form.subjectId)
          )
        : approvedEvaluators,
    [approvedEvaluators, form.subjectId]
  )
  const selectedEvaluator = findById(approvedEvaluators, form.evaluatorId)
  const selectedEvaluatorWorkload = selectedEvaluator
    ? getEvaluatorAssignmentWorkload({
        evaluator: selectedEvaluator,
        answerSheets,
      })
    : null
  const compatibleSubjects = useMemo(
    () =>
      subjects.filter((subject) => {
        const matchesDepartment =
          form.departmentId.length === 0 ||
          subject.departmentId === form.departmentId
        const matchesSemester =
          form.semesterId.length === 0 || subject.semesterId === form.semesterId

        return matchesDepartment && matchesSemester
      }),
    [form.departmentId, form.semesterId, subjects]
  )
  const compatibleExams = useMemo(
    () =>
      exams.filter((exam) => {
        const matchesSemester =
          form.semesterId.length === 0 || exam.semesterId === form.semesterId
        const matchesSubject =
          form.subjectId.length === 0 || exam.subjectId === form.subjectId

        return matchesSemester && matchesSubject
      }),
    [exams, form.semesterId, form.subjectId]
  )
  const eligibleSheets = useMemo(
    () =>
      getEligibleUnassignedSheets({
        answerSheets,
        students,
        departments,
        programs,
        semesters,
        subjects,
        exams,
        evaluators,
        departmentId: form.departmentId,
        semesterId: form.semesterId,
        subjectId: form.subjectId,
        examId: form.examId,
      }),
    [
      answerSheets,
      departments,
      evaluators,
      exams,
      form.departmentId,
      form.examId,
      form.semesterId,
      form.subjectId,
      programs,
      semesters,
      students,
      subjects,
    ]
  )
  const selectedSheetIdSet = useMemo(
    () => new Set(form.answerSheetIds),
    [form.answerSheetIds]
  )
  const selectedSheets = useMemo(
    () =>
      resolveAnswerSheets(
        answerSheets.filter((answerSheet) =>
          selectedSheetIdSet.has(answerSheet.id)
        ),
        {
          students,
          departments,
          programs,
          semesters,
          subjects,
          exams,
          evaluators,
        }
      ),
    [
      answerSheets,
      departments,
      evaluators,
      exams,
      programs,
      selectedSheetIdSet,
      semesters,
      students,
      subjects,
    ]
  )
  const capacity = selectedEvaluatorWorkload?.availableCapacity ?? 0
  const selectionLimitReached =
    Boolean(selectedEvaluatorWorkload) && form.answerSheetIds.length >= capacity
  const hasFullAcademicContext = Boolean(
    form.departmentId && form.semesterId && form.subjectId && form.examId
  )

  function resetState() {
    setForm(defaultAssignmentInput)
    setFieldErrors({})
    setRootError(null)
    setIsConfirmationOpen(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetState()
    }

    onOpenChange(nextOpen)
  }

  function handleDepartmentChange(value: string) {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      departmentId: value,
      subjectId: "",
      evaluatorId: "",
      answerSheetIds: [],
    }))
  }

  function handleSemesterChange(value: string) {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      semesterId: value,
      subjectId: "",
      examId: "",
      evaluatorId: "",
      answerSheetIds: [],
    }))
  }

  function handleSubjectChange(value: string) {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      subjectId: value,
      examId: "",
      evaluatorId: "",
      answerSheetIds: [],
    }))
  }

  function handleExamChange(value: string) {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      examId: value,
      answerSheetIds: [],
    }))
  }

  function handleEvaluatorChange(value: string) {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      evaluatorId: value,
      answerSheetIds: [],
    }))
  }

  function handleSheetSelection(answerSheetId: string, checked: boolean) {
    setRootError(null)
    setFieldErrors({})

    if (!selectedEvaluatorWorkload) {
      setFieldErrors({
        evaluatorId: "Select an approved evaluator before selecting sheets.",
      })
      return
    }

    setForm((currentForm) => {
      const selectedIds = new Set(currentForm.answerSheetIds)

      if (checked) {
        if (selectedIds.size >= selectedEvaluatorWorkload.availableCapacity) {
          setFieldErrors({
            answerSheetIds: `Select no more than ${selectedEvaluatorWorkload.availableCapacity} answer sheets for this evaluator.`,
          })

          return currentForm
        }

        selectedIds.add(answerSheetId)
      } else {
        selectedIds.delete(answerSheetId)
      }

      return {
        ...currentForm,
        answerSheetIds: Array.from(selectedIds),
      }
    })
  }

  function handleSelectAllAvailable() {
    if (!selectedEvaluatorWorkload || selectedEvaluatorWorkload.availableCapacity <= 0) {
      setFieldErrors({
        evaluatorId: `This evaluator already has ${MAX_ACTIVE_SHEETS_PER_EVALUATOR} active answer sheets.`,
      })
      return
    }

    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      answerSheetIds: eligibleSheets
        .slice(0, selectedEvaluatorWorkload.availableCapacity)
        .map((row) => row.answerSheet.id),
    }))
  }

  function handleClearSelection() {
    setRootError(null)
    setFieldErrors({})
    setForm((currentForm) => ({
      ...currentForm,
      answerSheetIds: [],
    }))
  }

  function handleReviewAssignment() {
    const validation = validateAssignment({
      input: form,
      answerSheets,
      students,
      departments,
      programs,
      semesters,
      subjects,
      exams,
      evaluators,
    })

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors ?? {})
      setRootError(validation.message)
      return
    }

    setFieldErrors({})
    setRootError(null)
    setIsConfirmationOpen(true)
  }

  function handleConfirmAssignment() {
    const result = assignAnswerSheets(form)

    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? {})
      setRootError(result.message)
      setIsConfirmationOpen(false)
      return
    }

    toast.success(
      `${result.assignedCount} answer sheets assigned to ${
        selectedEvaluator?.name ?? "the selected evaluator"
      }.`
    )
    resetState()
    onOpenChange(false)
  }

  function renderEligibleSheets() {
    if (!hasFullAcademicContext) {
      return (
        <SelectionEmptyState>
          Select department, semester, subject, and exam to view eligible
          unassigned answer sheets.
        </SelectionEmptyState>
      )
    }

    if (eligibleSheets.length === 0) {
      return (
        <SelectionEmptyState>
          No unassigned answer sheets are available for this selection.
        </SelectionEmptyState>
      )
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {eligibleSheets.length} unassigned sheets available for this
            academic context.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!selectedEvaluatorWorkload || capacity <= 0}
              onClick={handleSelectAllAvailable}
            >
              Select All Available
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={form.answerSheetIds.length === 0}
              onClick={handleClearSelection}
            >
              Clear
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Select</TableHead>
              <TableHead>Sheet</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right">Pages</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eligibleSheets.map((row) => {
              const isSelected = selectedSheetIdSet.has(row.answerSheet.id)
              const isDisabled =
                !selectedEvaluatorWorkload ||
                selectedEvaluatorWorkload.availableCapacity <= 0 ||
                (!isSelected && selectionLimitReached)

              return (
                <TableRow key={row.answerSheet.id}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${row.answerSheet.id}`}
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={(checked) =>
                        handleSheetSelection(row.answerSheet.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium uppercase">
                        {row.answerSheet.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.subject?.code ?? "Subject code unavailable"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p>{row.student?.name ?? "Student unavailable"}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.student?.rollNumber ?? "Roll number unavailable"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.pageCount}
                  </TableCell>
                  <TableCell>
                    <AnswerSheetStatusBadge status={row.answerSheet.status} />
                    <span className="sr-only">
                      {answerSheetStatusLabels[row.answerSheet.status]}
                    </span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Assign Answer Sheets</DialogTitle>
            <DialogDescription>
              Choose an academic context, select an approved evaluator, and
              assign only eligible unassigned sheets.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {rootError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {rootError}
              </div>
            ) : null}

            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Academic context</h3>
                <p className="text-sm text-muted-foreground">
                  Sheets are selected only from the chosen department, subject,
                  semester, and exam.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="assignment-department">Department</Label>
                  <select
                    id="assignment-department"
                    className={cn(
                      selectClassName,
                      fieldErrors.departmentId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    value={form.departmentId}
                    aria-invalid={Boolean(fieldErrors.departmentId)}
                    aria-describedby={
                      fieldErrors.departmentId
                        ? "assignment-department-error"
                        : undefined
                    }
                    onChange={(event) =>
                      handleDepartmentChange(event.target.value)
                    }
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="assignment-department-error"
                    message={fieldErrors.departmentId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-semester">Semester</Label>
                  <select
                    id="assignment-semester"
                    className={cn(
                      selectClassName,
                      fieldErrors.semesterId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    value={form.semesterId}
                    aria-invalid={Boolean(fieldErrors.semesterId)}
                    aria-describedby={
                      fieldErrors.semesterId
                        ? "assignment-semester-error"
                        : undefined
                    }
                    onChange={(event) => handleSemesterChange(event.target.value)}
                  >
                    <option value="">Select semester</option>
                    {semesters.map((semester) => (
                      <option key={semester.id} value={semester.id}>
                        {semester.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="assignment-semester-error"
                    message={fieldErrors.semesterId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-subject">Subject</Label>
                  <select
                    id="assignment-subject"
                    className={cn(
                      selectClassName,
                      fieldErrors.subjectId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    value={form.subjectId}
                    aria-invalid={Boolean(fieldErrors.subjectId)}
                    aria-describedby={
                      fieldErrors.subjectId
                        ? "assignment-subject-error"
                        : undefined
                    }
                    disabled={!form.departmentId || !form.semesterId}
                    onChange={(event) => handleSubjectChange(event.target.value)}
                  >
                    <option value="">
                      {!form.departmentId || !form.semesterId
                        ? "Select context first"
                        : compatibleSubjects.length === 0
                          ? "No matching subjects"
                          : "Select subject"}
                    </option>
                    {compatibleSubjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.code} | {subject.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="assignment-subject-error"
                    message={fieldErrors.subjectId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-exam">Exam</Label>
                  <select
                    id="assignment-exam"
                    className={cn(
                      selectClassName,
                      fieldErrors.examId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    value={form.examId}
                    aria-invalid={Boolean(fieldErrors.examId)}
                    aria-describedby={
                      fieldErrors.examId ? "assignment-exam-error" : undefined
                    }
                    disabled={!form.semesterId || !form.subjectId}
                    onChange={(event) => handleExamChange(event.target.value)}
                  >
                    <option value="">
                      {!form.semesterId
                        ? "Select semester first"
                        : !form.subjectId
                          ? "Select subject first"
                          : "Select exam"}
                    </option>
                    {compatibleExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.name}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="assignment-exam-error"
                    message={fieldErrors.examId}
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Approved evaluator</h3>
                  <p className="text-sm text-muted-foreground">
                    Only approved evaluators with matching subject expertise are
                    available.
                  </p>
                </div>

                {approvedEvaluators.length === 0 ? (
                  <SelectionEmptyState>
                    No approved evaluators are currently available. Approve an
                    evaluator before creating assignments.
                  </SelectionEmptyState>
                ) : form.subjectId && matchingEvaluators.length === 0 ? (
                  <SelectionEmptyState>
                    No approved evaluators match this subject expertise.
                  </SelectionEmptyState>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="assignment-evaluator">Evaluator</Label>
                  <select
                    id="assignment-evaluator"
                    className={cn(
                      selectClassName,
                      fieldErrors.evaluatorId &&
                        "border-destructive ring-3 ring-destructive/20"
                    )}
                    value={form.evaluatorId}
                    aria-invalid={Boolean(fieldErrors.evaluatorId)}
                    aria-describedby={
                      fieldErrors.evaluatorId
                        ? "assignment-evaluator-error"
                        : undefined
                    }
                    disabled={
                      !form.subjectId ||
                      approvedEvaluators.length === 0 ||
                      matchingEvaluators.length === 0
                    }
                    onChange={(event) =>
                      handleEvaluatorChange(event.target.value)
                    }
                  >
                    <option value="">
                      {!form.subjectId
                        ? "Select subject first"
                        : "Select evaluator"}
                    </option>
                    {matchingEvaluators.map((evaluator) => (
                      <option key={evaluator.id} value={evaluator.id}>
                        {evaluator.name} | {evaluator.designation}
                      </option>
                    ))}
                  </select>
                  <FieldError
                    id="assignment-evaluator-error"
                    message={fieldErrors.evaluatorId}
                  />
                </div>

                {selectedEvaluatorWorkload ? (
                  <div className="rounded-lg border bg-muted/25 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
                        <UsersRound className="size-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <p className="font-medium">
                            {selectedEvaluatorWorkload.evaluator.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedEvaluatorWorkload.evaluator.designation}
                          </p>
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                              Active workload
                            </p>
                            <p className="mt-1 tabular-nums">
                              {selectedEvaluatorWorkload.activeSheets}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                              Maximum workload
                            </p>
                            <p className="mt-1 tabular-nums">
                              {MAX_ACTIVE_SHEETS_PER_EVALUATOR}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                              Available capacity
                            </p>
                            <p className="mt-1 tabular-nums">
                              {selectedEvaluatorWorkload.availableCapacity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                              Completed previously
                            </p>
                            <p className="mt-1 tabular-nums">
                              {selectedEvaluatorWorkload.completedSheets}
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={selectedEvaluatorWorkload.capacityUsedPercent}
                          aria-label={`${selectedEvaluatorWorkload.evaluator.name} active workload capacity`}
                        />
                        {selectedEvaluatorWorkload.availableCapacity <= 0 ? (
                          <p className="text-sm text-destructive">
                            This evaluator currently has no assignment capacity.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Answer sheets</h3>
                  <p className="text-sm text-muted-foreground">
                    Select explicit unassigned sheets. Selection is limited by
                    evaluator capacity.
                  </p>
                </div>
                {renderEligibleSheets()}
                <FieldError
                  id="assignment-sheets-error"
                  message={fieldErrors.answerSheetIds}
                />
              </div>
            </section>
          </div>

          <DialogFooter showCloseButton>
            <Button
              type="button"
              onClick={handleReviewAssignment}
              disabled={form.answerSheetIds.length === 0 || capacity <= 0}
            >
              <ClipboardCheck data-icon="inline-start" className="size-4" />
              Review Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Assign {form.answerSheetIds.length} Answer Sheets?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEvaluator?.name ?? "The selected evaluator"} will receive{" "}
              {form.answerSheetIds.length} sheets for{" "}
              {selectedSubject?.name ?? "the selected subject"},{" "}
              {selectedSemester?.name ?? "the selected semester"},{" "}
              {selectedExam?.name ?? "the selected exam"}. These sheets will be
              added to the active workload for this evaluator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border bg-muted/25 p-3 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Evaluator
                </dt>
                <dd className="mt-1">
                  {selectedEvaluator?.name ?? "Evaluator unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Subject
                </dt>
                <dd className="mt-1">
                  {selectedSubject?.code ?? "Code"} |{" "}
                  {selectedSubject?.name ?? "Subject unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Department
                </dt>
                <dd className="mt-1">
                  {selectedDepartment?.name ?? "Department unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                  Capacity After Assignment
                </dt>
                <dd className="mt-1 tabular-nums">
                  {selectedEvaluatorWorkload
                    ? selectedEvaluatorWorkload.availableCapacity -
                      form.answerSheetIds.length
                    : 0}{" "}
                  remaining
                </dd>
              </div>
            </dl>
          </div>
          {selectedSheets.length > 0 ? (
            <div className="max-h-36 overflow-y-auto rounded-lg border p-2 text-sm">
              <ul className="space-y-1">
                {selectedSheets.map((row: ResolvedAnswerSheet) => (
                  <li
                    key={row.answerSheet.id}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1"
                  >
                    <span className="font-medium uppercase">
                      {row.answerSheet.id}
                    </span>
                    <span className="text-muted-foreground">
                      {row.student?.name ?? "Student unavailable"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAssignment}>
              Confirm Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
