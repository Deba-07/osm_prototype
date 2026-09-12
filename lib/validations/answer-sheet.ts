import { z } from "zod"

const requiredSelection = (message: string) => z.string().min(1, message)

export const answerSheetIntakeFormSchema = z.object({
  studentId: requiredSelection("Select a student."),
  semesterId: requiredSelection("Select a semester."),
  subjectId: requiredSelection("Select a subject."),
  examId: requiredSelection("Select an exam."),
})

export type AnswerSheetIntakeFormInput = z.input<
  typeof answerSheetIntakeFormSchema
>

export type AnswerSheetIntakeFormValues = z.output<
  typeof answerSheetIntakeFormSchema
>
