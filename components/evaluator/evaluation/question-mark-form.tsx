"use client"

import { SubmitEvaluationDialog } from "@/components/evaluator/evaluation/submit-evaluation-dialog"
import { Badge } from "@/components/ui/badge"
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
import { Progress } from "@/components/ui/progress"
import {
  calculateEvaluationTotal,
  getEvaluationCompletion,
  validateQuestionMarks,
} from "@/lib/evaluations"
import type { Evaluation, EvaluationDraftInput } from "@/types/osm"
import type { ExamQuestion, QuestionMark } from "@/types/osm"
import { ArrowRight, CheckCircle2, Save } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

type QuestionMarkFormProps = {
  answerSheetId: string
  evaluatorId: string
  studentName: string
  subjectName: string
  questions: ExamQuestion[]
  initialQuestionMarks: QuestionMark[]
  maximumMarks: number
  readOnly: boolean
  submittedAt?: string
  nextAssignedSheetId?: string
  saveEvaluationDraft: (input: EvaluationDraftInput) => Evaluation | undefined
  submitEvaluation: (input: EvaluationDraftInput) => Evaluation | undefined
}

type MarkValueState = Record<string, string>

function formatMarks(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/\.?0+$/, "")
}

function formatSubmittedAt(timestamp?: string) {
  if (!timestamp) {
    return "Not available"
  }

  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function buildMarkValues(questionMarks: QuestionMark[]): MarkValueState {
  return Object.fromEntries(
    questionMarks.map((questionMark) => [
      questionMark.questionId,
      questionMark.marksAwarded === null
        ? ""
        : formatMarks(questionMark.marksAwarded),
    ])
  )
}

function parseMarkValue(value: string | undefined) {
  const trimmedValue = value?.trim() ?? ""

  if (trimmedValue.length === 0) {
    return null
  }

  return Number(trimmedValue)
}

function buildQuestionMarks(
  questions: ExamQuestion[],
  markValues: MarkValueState
): QuestionMark[] {
  return questions.map((question) => ({
    questionId: question.id,
    questionNumber: question.questionNumber,
    maximumMarks: question.maximumMarks,
    marksAwarded: parseMarkValue(markValues[question.id]),
  }))
}

function getSnapshot(markValues: MarkValueState) {
  return JSON.stringify(
    Object.entries(markValues).sort(([firstKey], [secondKey]) =>
      firstKey.localeCompare(secondKey)
    )
  )
}

function getFirstErrorQuestionId(fieldErrors: Record<string, string>) {
  return Object.keys(fieldErrors).find((questionId) => questionId !== "questions")
}

function focusQuestionInput(questionId: string | undefined) {
  if (!questionId) {
    return
  }

  window.requestAnimationFrame(() => {
    document.getElementById(`marks-${questionId}`)?.focus()
  })
}

export function QuestionMarkForm({
  answerSheetId,
  evaluatorId,
  studentName,
  subjectName,
  questions,
  initialQuestionMarks,
  maximumMarks,
  readOnly,
  submittedAt,
  nextAssignedSheetId,
  saveEvaluationDraft,
  submitEvaluation,
}: QuestionMarkFormProps) {
  const [markValues, setMarkValues] = useState<MarkValueState>(() =>
    buildMarkValues(initialQuestionMarks)
  )
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const initialSnapshot = useMemo(
    () => getSnapshot(buildMarkValues(initialQuestionMarks)),
    [initialQuestionMarks]
  )
  const currentSnapshot = useMemo(() => getSnapshot(markValues), [markValues])
  const currentQuestionMarks = useMemo(
    () => buildQuestionMarks(questions, markValues),
    [markValues, questions]
  )
  const draftValidation = useMemo(
    () =>
      validateQuestionMarks({
        questions,
        questionMarks: currentQuestionMarks,
      }),
    [currentQuestionMarks, questions]
  )
  const submissionValidation = useMemo(
    () =>
      validateQuestionMarks({
        questions,
        questionMarks: currentQuestionMarks,
        requireComplete: true,
      }),
    [currentQuestionMarks, questions]
  )
  const completion = getEvaluationCompletion(currentQuestionMarks)
  const totalMarks = calculateEvaluationTotal(currentQuestionMarks)
  const hasValidDraftMarks = draftValidation.success
  const hasUnsavedChanges = currentSnapshot !== initialSnapshot
  const totalMarksLabel = Number.isFinite(totalMarks)
    ? formatMarks(totalMarks)
    : "Invalid"
  const maximumMarksLabel = formatMarks(maximumMarks)
  const visibleFieldErrors = {
    ...(draftValidation.success ? {} : draftValidation.fieldErrors),
    ...(hasTriedSubmit && !submissionValidation.success
      ? submissionValidation.fieldErrors
      : {}),
  }

  function updateMarkValue(questionId: string, value: string) {
    setMarkValues((currentValues) => ({
      ...currentValues,
      [questionId]: value,
    }))
  }

  function handleSaveDraft() {
    if (!draftValidation.success) {
      toast.error(draftValidation.message)
      focusQuestionInput(getFirstErrorQuestionId(draftValidation.fieldErrors))
      return
    }

    const savedEvaluation = saveEvaluationDraft({
      answerSheetId,
      evaluatorId,
      questionMarks: draftValidation.questionMarks,
    })

    if (!savedEvaluation) {
      toast.error("Draft could not be saved for this answer sheet.")
      return
    }

    setHasTriedSubmit(false)
    toast.success("Draft saved")
  }

  function handleSubmitRequest() {
    setHasTriedSubmit(true)

    if (!submissionValidation.success) {
      toast.error(submissionValidation.message)
      focusQuestionInput(
        getFirstErrorQuestionId(submissionValidation.fieldErrors)
      )
      return
    }

    setIsSubmitDialogOpen(true)
  }

  function handleSubmitConfirm() {
    if (!submissionValidation.success) {
      return
    }

    const submittedEvaluation = submitEvaluation({
      answerSheetId,
      evaluatorId,
      questionMarks: submissionValidation.questionMarks,
    })

    if (!submittedEvaluation) {
      toast.error("Evaluation could not be submitted.")
      return
    }

    setIsSubmitDialogOpen(false)
    toast.success("Evaluation submitted")
  }

  if (questions.length === 0) {
    return (
      <Card className="xl:sticky xl:top-4">
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>
            Question-wise marks cannot be captured without exam questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="font-medium">
              No evaluation questions are configured
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Add question definitions for this subject and examination before
              marks can be saved or submitted.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="xl:sticky xl:top-4">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>
                {readOnly ? "Evaluation Completed" : "Question-wise Marks"}
              </CardTitle>
              <CardDescription>
                {readOnly
                  ? "Submitted marks are read-only in this prototype."
                  : "Enter awarded marks for each configured question."}
              </CardDescription>
            </div>
            {hasUnsavedChanges && !readOnly ? (
              <Badge variant="secondary">Unsaved changes</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {readOnly ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Evaluation Completed</p>
                  <p className="mt-1 text-xs">
                    Submitted on {formatSubmittedAt(submittedAt)}.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Evaluation completion</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {completion.evaluatedQuestions} of {completion.totalQuestions}{" "}
                questions evaluated
              </p>
            </div>
            <Progress
              value={completion.percentage}
              aria-label="Question evaluation completion"
            />
          </div>

          <div className="space-y-3">
            {questions.map((question) => {
              const fieldError = visibleFieldErrors[question.id]
              const inputId = `marks-${question.id}`
              const errorId = `${inputId}-error`
              const currentValue = markValues[question.id] ?? ""

              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        Question {question.questionNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Maximum: {formatMarks(question.maximumMarks)}
                      </p>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {currentValue.trim().length > 0
                        ? currentValue
                        : "Blank"}{" "}
                      / {formatMarks(question.maximumMarks)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={inputId}>Marks Awarded</Label>
                    <Input
                      id={inputId}
                      type="number"
                      min={0}
                      max={question.maximumMarks}
                      step="any"
                      inputMode="decimal"
                      value={currentValue}
                      readOnly={readOnly}
                      aria-invalid={Boolean(fieldError)}
                      aria-describedby={fieldError ? errorId : undefined}
                      placeholder={readOnly ? "Not marked" : "Enter marks"}
                      onChange={(event) =>
                        updateMarkValue(question.id, event.target.value)
                      }
                    />
                    {fieldError ? (
                      <p id={errorId} className="text-xs text-destructive">
                        {fieldError}
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-lg border bg-muted/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Calculated Total</p>
              <p className="text-xl font-semibold tabular-nums">
                {totalMarksLabel} / {maximumMarksLabel}
              </p>
            </div>
          </div>

          {readOnly ? (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button variant="outline" render={<Link href="/evaluator/dashboard" />}>
                Back to Dashboard
              </Button>
              <Button render={<Link href="/evaluator/completed" />}>
                View Completed Evaluations
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
              {nextAssignedSheetId ? (
                <Button
                  variant="outline"
                  render={
                    <Link href={`/evaluator/evaluate/${nextAssignedSheetId}`} />
                  }
                >
                  Next Assigned Sheet
                  <ArrowRight data-icon="inline-end" className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={!hasUnsavedChanges || !hasValidDraftMarks}
                onClick={handleSaveDraft}
              >
                <Save data-icon="inline-start" className="size-4" />
                Save Draft
              </Button>
              <Button
                type="button"
                disabled={!hasValidDraftMarks}
                onClick={handleSubmitRequest}
              >
                Submit Evaluation
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SubmitEvaluationDialog
        open={isSubmitDialogOpen}
        studentName={studentName}
        subjectName={subjectName}
        evaluatedQuestions={completion.evaluatedQuestions}
        totalQuestions={completion.totalQuestions}
        totalMarks={totalMarksLabel}
        maximumMarks={maximumMarksLabel}
        onOpenChange={setIsSubmitDialogOpen}
        onConfirm={handleSubmitConfirm}
      />
    </>
  )
}
