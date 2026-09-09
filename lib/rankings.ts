import type { StudentSubjectResult } from "@/lib/results"

export type RankedStudentResult = StudentSubjectResult & {
  rank: number
}

export function rankStudentResults(
  results: StudentSubjectResult[]
): RankedStudentResult[] {
  const sortedResults = [...results].sort((first, second) => {
    if (second.percentage !== first.percentage) {
      return second.percentage - first.percentage
    }

    return first.rollNumber.localeCompare(second.rollNumber)
  })

  let previousPercentage: number | null = null
  let previousRank = 0

  return sortedResults.map((result, index) => {
    const rank =
      previousPercentage === result.percentage ? previousRank : index + 1

    previousPercentage = result.percentage
    previousRank = rank

    return {
      ...result,
      rank,
    }
  })
}
