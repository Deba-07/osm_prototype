"use client"

import { AnswerSheetViewer } from "@/components/evaluator/evaluation/answer-sheet-viewer"
import { EvaluationHeader } from "@/components/evaluator/evaluation/evaluation-header"
import { QuestionMarkForm } from "@/components/evaluator/evaluation/question-mark-form"
import { EvaluatorAccessState } from "@/components/evaluator/evaluator-access-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { departments } from "@/data/departments"
import { exams } from "@/data/exams"
import { programs } from "@/data/programs"
import { examQuestions } from "@/data/questions"
import { semesters } from "@/data/semesters"
import { subjects } from "@/data/subjects"
import { useOsmStoreHydrated } from "@/hooks/use-osm-store-hydrated"
import { resolveAnswerSheetDetails } from "@/lib/answer-sheets"
import { getCurrentEvaluator } from "@/lib/evaluator-dashboard"
import {
  calculateEvaluationMaximumMarks,
  calculateEvaluationTotal,
  getEvaluationCompletion,
  getEvaluationForAnswerSheet,
  getEvaluationQuestions,
  getQuestionMarksForEvaluation,
  getSubmittedEvaluationForAnswerSheet,
} from "@/lib/evaluations"
import { useOsmStore } from "@/stores/osm-store"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

type EvaluationWorkspaceProps = {
  answerSheetId: string
}

type WorkspaceUnavailableStateProps = {
  title: string
  description: string
}

function EvaluationWorkspaceSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading evaluation workspace">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-64" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.9fr)]">
        <Skeleton className="h-[42rem]" />
        <Skeleton className="h-[42rem]" />
      </div>
    </div>
  )
}

function WorkspaceUnavailableState({
  title,
  description,
}: WorkspaceUnavailableStateProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" render={<Link href="/evaluator/assigned" />}>
          <ArrowLeft data-icon="inline-start" className="size-4" />
          Back to assigned sheets
        </Button>
      </CardContent>
    </Card>
  )
}

export function EvaluationWorkspace({
  answerSheetId,
}: EvaluationWorkspaceProps) {
  const isHydrated = useOsmStoreHydrated()
  const currentUser = useOsmStore((state) => state.currentUser)
  const evaluators = useOsmStore((state) => state.evaluators)
  const answerSheets = useOsmStore((state) => state.answerSheets)
  const students = useOsmStore((state) => state.students)
  const evaluations = useOsmStore((state) => state.evaluations)
  const saveEvaluationDraft = useOsmStore((state) => state.saveEvaluationDraft)
  const submitEvaluation = useOsmStore((state) => state.submitEvaluation)
  const evaluator = getCurrentEvaluator(currentUser, evaluators)
  const answerSheet = answerSheets.find((sheet) => sheet.id === answerSheetId)

  const details = useMemo(
    () =>
      answerSheet
        ? resolveAnswerSheetDetails(answerSheet, {
            students,
            departments,
            programs,
            semesters,
            subjects,
            exams,
            evaluators,
          })
        : null,
    [answerSheet, evaluators, students]
  )
  const questions = useMemo(
    () =>
      answerSheet
        ? getEvaluationQuestions({
            answerSheet,
            questions: examQuestions,
          })
        : [],
    [answerSheet]
  )
  const evaluation = useMemo(() => {
    if (!answerSheet || !evaluator) {
      return undefined
    }

    return answerSheet.status === "completed"
      ? getSubmittedEvaluationForAnswerSheet({
          evaluations,
          answerSheetId: answerSheet.id,
          evaluatorId: evaluator.id,
        }) ??
          getEvaluationForAnswerSheet({
            evaluations,
            answerSheetId: answerSheet.id,
            evaluatorId: evaluator.id,
          })
      : getEvaluationForAnswerSheet({
          evaluations,
          answerSheetId: answerSheet.id,
          evaluatorId: evaluator.id,
        })
  }, [answerSheet, evaluations, evaluator])
  const initialQuestionMarks = useMemo(
    () =>
      getQuestionMarksForEvaluation({
        questions,
        evaluation,
      }),
    [evaluation, questions]
  )
  const maximumMarks = useMemo(
    () => calculateEvaluationMaximumMarks(questions),
    [questions]
  )
  const persistedTotalMarks = useMemo(
    () => calculateEvaluationTotal(initialQuestionMarks),
    [initialQuestionMarks]
  )
  const persistedCompletion = useMemo(
    () => getEvaluationCompletion(initialQuestionMarks),
    [initialQuestionMarks]
  )
  const nextAssignedSheetId = useMemo(
    () =>
      evaluator
        ? answerSheets.find(
            (sheet) =>
              sheet.id !== answerSheetId &&
              sheet.assignedEvaluatorId === evaluator.id &&
              sheet.status === "assigned"
          )?.id
        : undefined,
    [answerSheetId, answerSheets, evaluator]
  )

  if (!isHydrated) {
    return <EvaluationWorkspaceSkeleton />
  }

  if (currentUser?.role !== "evaluator" || !currentUser.evaluatorId) {
    return (
      <EvaluatorAccessState
        title="No evaluator session is active"
        description="Return to the demo login and choose an approved evaluator account before opening an answer sheet."
      />
    )
  }

  if (!evaluator) {
    return (
      <EvaluatorAccessState
        title="Evaluator account not found"
        description="The current mock session does not match an evaluator record in the demo store."
      />
    )
  }

  if (evaluator.status !== "approved") {
    return (
      <EvaluatorAccessState
        title="Evaluator account not approved"
        description="University verification is required before answer sheets can be opened."
      />
    )
  }

  if (!answerSheet || !details) {
    return (
      <WorkspaceUnavailableState
        title="Answer sheet not found"
        description="No answer-sheet record exists for this route in the current demo store."
      />
    )
  }

  if (answerSheet.status === "unassigned" || !answerSheet.assignedEvaluatorId) {
    return (
      <WorkspaceUnavailableState
        title="Answer sheet is not assigned"
        description="Unassigned answer sheets are managed by the admin assignment workflow and cannot be opened by evaluators."
      />
    )
  }

  if (answerSheet.assignedEvaluatorId !== evaluator.id) {
    return (
      <WorkspaceUnavailableState
        title="Access denied"
        description="This answer sheet is assigned to another evaluator and cannot be inspected from the current evaluator session."
      />
    )
  }

  const isReadOnly = answerSheet.status === "completed"
  const studentName = details.student?.name ?? "Student unavailable"
  const subjectName = details.subject?.name ?? "Subject unavailable"

  return (
    <div className="space-y-6">
      <Button variant="ghost" render={<Link href="/evaluator/assigned" />}>
        <ArrowLeft data-icon="inline-start" className="size-4" />
        Assigned Sheets
      </Button>

      <EvaluationHeader
        details={details}
        totalMarks={persistedTotalMarks}
        maximumMarks={maximumMarks}
        completion={persistedCompletion}
      />

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(380px,0.9fr)]">
        <AnswerSheetViewer
          key={answerSheet.id}
          answerSheetId={answerSheet.id}
          pageImages={answerSheet.pageImages}
        />
        <QuestionMarkForm
          key={[
            answerSheet.id,
            answerSheet.status,
            evaluation?.id ?? "new",
            evaluation?.status ?? "none",
            evaluation?.submittedAt ?? "draft",
          ].join(":")}
          answerSheetId={answerSheet.id}
          evaluatorId={evaluator.id}
          studentName={studentName}
          subjectName={subjectName}
          questions={questions}
          initialQuestionMarks={initialQuestionMarks}
          maximumMarks={maximumMarks}
          readOnly={isReadOnly}
          submittedAt={evaluation?.submittedAt}
          nextAssignedSheetId={nextAssignedSheetId}
          saveEvaluationDraft={saveEvaluationDraft}
          submitEvaluation={submitEvaluation}
        />
      </section>
    </div>
  )
}
