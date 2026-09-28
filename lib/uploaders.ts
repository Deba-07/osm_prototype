import type {
  AffiliatedCollege,
  NodalCentre,
  Uploader,
  UploaderRegistrationInput,
} from "@/types/osm"

export function normalizeUploaderEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateUploaderRelationship({
  collegeId,
  nodalCentreId,
  affiliatedColleges,
  nodalCentres,
}: {
  collegeId: string
  nodalCentreId: string
  affiliatedColleges: AffiliatedCollege[]
  nodalCentres: NodalCentre[]
}) {
  const college = affiliatedColleges.find((item) => item.id === collegeId)
  const nodalCentre = nodalCentres.find((item) => item.id === nodalCentreId)

  if (!college) return "Select a valid affiliated college."
  if (!nodalCentre) return "Select a valid nodal centre."
  if (nodalCentre.affiliatedCollegeId !== college.id) {
    return "The nodal centre must belong to the selected affiliated college."
  }

  return undefined
}

export function findUploaderRegistrationDuplicate({
  uploaders,
  email,
}: {
  uploaders: Uploader[]
  email: string
}) {
  const normalizedEmail = normalizeUploaderEmail(email)
  return uploaders.find(
    (uploader) => normalizeUploaderEmail(uploader.email) === normalizedEmail
  )
}

export function validateUploaderRegistration({
  input,
  uploaders,
  affiliatedColleges,
  nodalCentres,
}: {
  input: UploaderRegistrationInput
  uploaders: Uploader[]
  affiliatedColleges: AffiliatedCollege[]
  nodalCentres: NodalCentre[]
}) {
  const relationshipError = validateUploaderRelationship({
    collegeId: input.collegeId,
    nodalCentreId: input.nodalCentreId,
    affiliatedColleges,
    nodalCentres,
  })

  if (relationshipError) return relationshipError
  if (findUploaderRegistrationDuplicate({ uploaders, email: input.email })) {
    return "An uploader with this email is already registered."
  }

  return undefined
}
