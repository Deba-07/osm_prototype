import { z } from "zod"

export const uploaderRegistrationSchema = z.object({
  name: z.string().trim().min(3, "Enter the uploader's full name."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform((value) => value.toLowerCase()),
  collegeId: z.string().min(1, "Select an affiliated college."),
  nodalCentreId: z.string().min(1, "Select a nodal centre."),
})

export type UploaderRegistrationFormInput = z.input<
  typeof uploaderRegistrationSchema
>

export type UploaderRegistrationFormValues = z.output<
  typeof uploaderRegistrationSchema
>
