import { departments } from "@/data/departments"
import { subjects } from "@/data/subjects"
import type { Evaluator } from "@/types/osm"
import { z } from "zod"

const departmentIds = new Set(departments.map((department) => department.id))
const subjectIds = new Set(subjects.map((subject) => subject.id))

export const evaluatorDesignationOptions = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Visiting Faculty",
] as const

function getIndianPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2)
  }

  return digits
}

export function normalizeEvaluatorEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeFacultyId(facultyId: string) {
  return facultyId.trim().toUpperCase()
}

export const evaluatorRegistrationSchema = z
  .object({
    name: z.string().trim().min(3, "Enter the evaluator's full name."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .transform(normalizeEvaluatorEmail),
    phone: z
      .string()
      .trim()
      .refine((value) => {
        const digits = getIndianPhoneDigits(value)

        return /^[6-9]\d{9}$/.test(digits)
      }, "Enter a valid Indian mobile number.")
      .transform((value) => {
        const digits = getIndianPhoneDigits(value)

        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
      }),
    facultyId: z
      .string()
      .trim()
      .min(2, "Enter the faculty ID.")
      .transform(normalizeFacultyId),
    departmentId: z
      .string()
      .min(1, "Select a department.")
      .refine(
        (departmentId) => departmentIds.has(departmentId),
        "Select a valid department."
      ),
    designation: z.enum(evaluatorDesignationOptions, {
      message: "Select a designation.",
    }),
    experienceYears: z.coerce
      .number()
      .int("Years of experience must be a whole number.")
      .min(0, "Years of experience cannot be negative.")
      .max(50, "Enter a realistic years-of-experience value."),
    subjectExpertise: z
      .array(z.string())
      .min(1, "Select at least one subject expertise area.")
      .refine(
        (selectedSubjects) =>
          selectedSubjects.every((subjectId) => subjectIds.has(subjectId)),
        "Select valid subject expertise areas."
      ),
  })
  .superRefine((value, context) => {
    const validDepartmentSubjectIds = new Set(
      subjects
        .filter((subject) => subject.departmentId === value.departmentId)
        .map((subject) => subject.id)
    )
    const hasMismatchedSubject = value.subjectExpertise.some(
      (subjectId) => !validDepartmentSubjectIds.has(subjectId)
    )

    if (hasMismatchedSubject) {
      context.addIssue({
        code: "custom",
        path: ["subjectExpertise"],
        message: "Select expertise subjects from the chosen department.",
      })
    }
  })

export type EvaluatorRegistrationFormInput = z.input<
  typeof evaluatorRegistrationSchema
>

export type EvaluatorRegistrationFormValues = z.output<
  typeof evaluatorRegistrationSchema
>

export function findEvaluatorRegistrationDuplicate({
  evaluators,
  email,
  facultyId,
}: {
  evaluators: Evaluator[]
  email: string
  facultyId: string
}) {
  const normalizedEmail = normalizeEvaluatorEmail(email)
  const normalizedFacultyId = normalizeFacultyId(facultyId)

  return evaluators.find((evaluator) => {
    return (
      normalizeEvaluatorEmail(evaluator.email) === normalizedEmail ||
      normalizeFacultyId(evaluator.facultyId) === normalizedFacultyId
    )
  })
}
