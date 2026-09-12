import {
  getStudentSemesterResults,
  type StudentSubjectResult,
} from "@/lib/results"
import type { Department, Subject } from "@/types/osm"

const rankingCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
})

const scoreTolerance = 1e-9

type RankingScoreInput = {
  id: string
  totalMarks: number
  maximumMarks: number
  rollNumber?: string
  studentName?: string
}

export type RankedStudentResult = StudentSubjectResult & {
  rank: number
}

export type StudentPerformanceRankingCandidate = {
  id: string
  studentId: string
  studentName: string
  rollNumber: string
  registrationNumber: string
  departmentId: string
  departmentName: string
  departmentCode: string
  programId: string
  programName: string
  programCode: string
  semesterId: string
  semesterName: string
  semesterNumber: number
  totalMarks: number
  maximumMarks: number
  percentage: number
  completedResults: number
  expectedResults: number | null
  isComplete: boolean
  completenessLabel: string
  results: StudentSubjectResult[]
}

export type StudentPerformanceRankingEntry =
  StudentPerformanceRankingCandidate & {
    rank: number
  }

export type StudentPerformanceRankingSet = {
  entries: StudentPerformanceRankingEntry[]
  incompleteEntries: StudentPerformanceRankingCandidate[]
  candidateCount: number
  eligibleCount: number
  incompleteCount: number
}

export type StudentPerformanceRankingFilters = {
  semesterId?: string
  departmentId?: string
  programId?: string
  searchQuery?: string
}

export type SubjectRankingEntry = {
  id: string
  rank: number
  studentId: string
  studentName: string
  rollNumber: string
  registrationNumber: string
  departmentId: string
  departmentName: string
  programId: string
  programName: string
  semesterId: string
  semesterName: string
  subjectId: string
  subjectCode: string
  subjectName: string
  examId: string
  examName: string
  totalMarks: number
  maximumMarks: number
  percentage: number
  result: StudentSubjectResult
}

export type SubjectRankingFilters = {
  subjectId?: string
  examId?: string
  searchQuery?: string
}

export type RankingAnalyticsFilters = {
  semesterId?: string
  departmentId?: string
  programId?: string
  subjectId?: string
  examId?: string
}

export type RankingAnalyticsSummary = {
  completedResults: number
  studentsWithResults: number
  subjectsEvaluated: number
  totalMarks: number
  maximumMarks: number
  averagePercentage: number
}

export type PerformanceAnalyticsEntry = {
  id: string
  name: string
  code: string
  totalMarks: number
  maximumMarks: number
  percentage: number
  resultCount: number
  studentCount: number
}

function normalizeSearch(value: string | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function includesSearch(value: string | undefined, query: string) {
  return Boolean(value?.toLowerCase().includes(query))
}

function getPrecisePercentage(totalMarks: number, maximumMarks: number) {
  if (maximumMarks <= 0) {
    return 0
  }

  return (totalMarks / maximumMarks) * 100
}

function normalizeMarks(value: number) {
  return Number(value.toFixed(2))
}

function compareRankingScores(
  first: RankingScoreInput,
  second: RankingScoreInput
) {
  if (first.maximumMarks <= 0 && second.maximumMarks <= 0) {
    return 0
  }

  if (first.maximumMarks <= 0) {
    return 1
  }

  if (second.maximumMarks <= 0) {
    return -1
  }

  const delta =
    first.totalMarks * second.maximumMarks -
    second.totalMarks * first.maximumMarks

  if (Math.abs(delta) <= scoreTolerance) {
    return 0
  }

  return delta > 0 ? -1 : 1
}

function hasEqualRankingScore(
  first: RankingScoreInput,
  second: RankingScoreInput
) {
  return compareRankingScores(first, second) === 0
}

function compareStableDisplayOrder(
  first: RankingScoreInput,
  second: RankingScoreInput
) {
  const rollComparison = rankingCollator.compare(
    first.rollNumber ?? "",
    second.rollNumber ?? ""
  )

  if (rollComparison !== 0) {
    return rollComparison
  }

  const nameComparison = rankingCollator.compare(
    first.studentName ?? "",
    second.studentName ?? ""
  )

  if (nameComparison !== 0) {
    return nameComparison
  }

  return rankingCollator.compare(first.id, second.id)
}

function matchesStudentSearch(
  entry: {
    studentName: string
    rollNumber: string
    registrationNumber: string
  },
  searchQuery: string | undefined
) {
  const query = normalizeSearch(searchQuery)

  if (query.length === 0) {
    return true
  }

  return (
    includesSearch(entry.studentName, query) ||
    includesSearch(entry.rollNumber, query) ||
    includesSearch(entry.registrationNumber, query)
  )
}

function getCompletedSubjectCount(results: StudentSubjectResult[]) {
  return new Set(results.map((result) => result.subjectId)).size
}

export function getExpectedSubjectCount({
  subjects,
  programId,
  semesterId,
}: {
  subjects: Subject[]
  programId: string
  semesterId: string
}) {
  return subjects.filter(
    (subject) =>
      subject.programId === programId && subject.semesterId === semesterId
  ).length
}

function buildCompletenessLabel({
  completedResults,
  expectedResults,
}: {
  completedResults: number
  expectedResults: number | null
}) {
  if (expectedResults === null) {
    return `${completedResults} completed result${
      completedResults === 1 ? "" : "s"
    }`
  }

  return `${completedResults} / ${expectedResults} subjects`
}

function toStudentPerformanceCandidate({
  semesterResult,
  subjects,
}: {
  semesterResult: ReturnType<typeof getStudentSemesterResults>[number]
  subjects: Subject[]
}): StudentPerformanceRankingCandidate | undefined {
  const firstResult = semesterResult.results[0]

  if (!firstResult) {
    return undefined
  }

  const configuredSubjectCount = getExpectedSubjectCount({
    subjects,
    programId: firstResult.programId,
    semesterId: semesterResult.semesterId,
  })
  const expectedResults =
    configuredSubjectCount > 0 ? configuredSubjectCount : null
  const completedResults = getCompletedSubjectCount(semesterResult.results)
  const isComplete =
    expectedResults !== null && completedResults >= expectedResults

  return {
    id: semesterResult.id,
    studentId: semesterResult.studentId,
    studentName: semesterResult.studentName,
    rollNumber: semesterResult.rollNumber,
    registrationNumber: semesterResult.registrationNumber,
    departmentId: firstResult.departmentId,
    departmentName: firstResult.departmentName,
    departmentCode: firstResult.departmentCode,
    programId: firstResult.programId,
    programName: semesterResult.programName,
    programCode: firstResult.programCode,
    semesterId: semesterResult.semesterId,
    semesterName: semesterResult.semesterName,
    semesterNumber: semesterResult.semesterNumber,
    totalMarks: semesterResult.totalMarks,
    maximumMarks: semesterResult.maximumMarks,
    percentage: getPrecisePercentage(
      semesterResult.totalMarks,
      semesterResult.maximumMarks
    ),
    completedResults,
    expectedResults,
    isComplete,
    completenessLabel: buildCompletenessLabel({
      completedResults,
      expectedResults,
    }),
    results: semesterResult.results,
  }
}

function filterStudentPerformanceCandidates(
  candidates: StudentPerformanceRankingCandidate[],
  filters: StudentPerformanceRankingFilters
) {
  return candidates.filter((entry) => {
    const matchesSemester =
      !filters.semesterId || entry.semesterId === filters.semesterId
    const matchesDepartment =
      !filters.departmentId || entry.departmentId === filters.departmentId
    const matchesProgram =
      !filters.programId || entry.programId === filters.programId

    return (
      matchesSemester &&
      matchesDepartment &&
      matchesProgram &&
      matchesStudentSearch(entry, filters.searchQuery)
    )
  })
}

export function assignCompetitionRanks<T extends RankingScoreInput>(
  entries: T[]
): Array<T & { rank: number }> {
  const sortedEntries = [...entries].sort((first, second) => {
    const scoreComparison = compareRankingScores(first, second)

    if (scoreComparison !== 0) {
      return scoreComparison
    }

    return compareStableDisplayOrder(first, second)
  })

  let previousEntry: T | undefined
  let previousRank = 0

  return sortedEntries.map((entry, index) => {
    const rank =
      previousEntry && hasEqualRankingScore(entry, previousEntry)
        ? previousRank
        : index + 1

    previousEntry = entry
    previousRank = rank

    return {
      ...entry,
      rank,
    }
  })
}

export function rankStudentResults(
  results: StudentSubjectResult[]
): RankedStudentResult[] {
  return assignCompetitionRanks(results)
}

export function rankStudentPerformances(
  candidates: StudentPerformanceRankingCandidate[]
): StudentPerformanceRankingEntry[] {
  const eligibleCandidates = candidates.filter(
    (candidate) => candidate.isComplete && candidate.maximumMarks > 0
  )

  return assignCompetitionRanks(eligibleCandidates)
}

function getStudentPerformanceRankingSet({
  results,
  subjects,
  filters,
}: {
  results: StudentSubjectResult[]
  subjects: Subject[]
  filters: StudentPerformanceRankingFilters
}): StudentPerformanceRankingSet {
  const semesterCandidates = getStudentSemesterResults(results).flatMap(
    (semesterResult) => {
      const candidate = toStudentPerformanceCandidate({
        semesterResult,
        subjects,
      })

      return candidate ? [candidate] : []
    }
  )
  const candidates = filterStudentPerformanceCandidates(
    semesterCandidates,
    filters
  )
  const incompleteEntries = candidates.filter(
    (candidate) => !candidate.isComplete || candidate.maximumMarks <= 0
  )
  const entries = rankStudentPerformances(candidates)

  return {
    entries,
    incompleteEntries,
    candidateCount: candidates.length,
    eligibleCount: entries.length,
    incompleteCount: incompleteEntries.length,
  }
}

export function getUniversityRankings({
  results,
  subjects,
  semesterId,
  searchQuery,
}: {
  results: StudentSubjectResult[]
  subjects: Subject[]
  semesterId: string
  searchQuery?: string
}) {
  return getStudentPerformanceRankingSet({
    results,
    subjects,
    filters: {
      semesterId,
      searchQuery,
    },
  })
}

export function getDepartmentRankings({
  results,
  subjects,
  departmentId,
  semesterId,
  searchQuery,
}: {
  results: StudentSubjectResult[]
  subjects: Subject[]
  departmentId: string
  semesterId: string
  searchQuery?: string
}) {
  return getStudentPerformanceRankingSet({
    results,
    subjects,
    filters: {
      departmentId,
      semesterId,
      searchQuery,
    },
  })
}

export function getSemesterRankings({
  results,
  subjects,
  semesterId,
  departmentId,
  programId,
  searchQuery,
}: {
  results: StudentSubjectResult[]
  subjects: Subject[]
  semesterId: string
  departmentId?: string
  programId?: string
  searchQuery?: string
}) {
  return getStudentPerformanceRankingSet({
    results,
    subjects,
    filters: {
      departmentId,
      programId,
      semesterId,
      searchQuery,
    },
  })
}

export function getSubjectRankings({
  results,
  subjectId,
  examId,
  searchQuery,
}: {
  results: StudentSubjectResult[]
  subjectId: string
  examId: string
  searchQuery?: string
}): SubjectRankingEntry[] {
  if (!subjectId || !examId) {
    return []
  }

  const candidates = results
    .filter(
      (result) => result.subjectId === subjectId && result.examId === examId
    )
    .filter((result) => matchesStudentSearch(result, searchQuery))
    .map((result) => ({
      id: result.id,
      studentId: result.studentId,
      studentName: result.studentName,
      rollNumber: result.rollNumber,
      registrationNumber: result.registrationNumber,
      departmentId: result.departmentId,
      departmentName: result.departmentName,
      programId: result.programId,
      programName: result.programName,
      semesterId: result.semesterId,
      semesterName: result.semesterName,
      subjectId: result.subjectId,
      subjectCode: result.subjectCode,
      subjectName: result.subjectName,
      examId: result.examId,
      examName: result.examName,
      totalMarks: result.totalMarks,
      maximumMarks: result.maximumMarks,
      percentage: getPrecisePercentage(result.totalMarks, result.maximumMarks),
      result,
    }))

  return assignCompetitionRanks(candidates)
}

export function filterRankingResults(
  results: StudentSubjectResult[],
  filters: RankingAnalyticsFilters = {}
) {
  return results.filter((result) => {
    const matchesSemester =
      !filters.semesterId || result.semesterId === filters.semesterId
    const matchesDepartment =
      !filters.departmentId || result.departmentId === filters.departmentId
    const matchesProgram =
      !filters.programId || result.programId === filters.programId
    const matchesSubject =
      !filters.subjectId || result.subjectId === filters.subjectId
    const matchesExam = !filters.examId || result.examId === filters.examId

    return (
      matchesSemester &&
      matchesDepartment &&
      matchesProgram &&
      matchesSubject &&
      matchesExam
    )
  })
}

export function getRankingAnalyticsSummary({
  results,
  filters,
}: {
  results: StudentSubjectResult[]
  filters?: RankingAnalyticsFilters
}): RankingAnalyticsSummary {
  const scopedResults = filterRankingResults(results, filters)
  const totalMarks = normalizeMarks(
    scopedResults.reduce((total, result) => total + result.totalMarks, 0)
  )
  const maximumMarks = scopedResults.reduce(
    (total, result) => total + result.maximumMarks,
    0
  )

  return {
    completedResults: scopedResults.length,
    studentsWithResults: new Set(scopedResults.map((result) => result.studentId))
      .size,
    subjectsEvaluated: new Set(scopedResults.map((result) => result.subjectId))
      .size,
    totalMarks,
    maximumMarks,
    averagePercentage: getPrecisePercentage(totalMarks, maximumMarks),
  }
}

function getPerformanceAnalyticsEntry({
  id,
  name,
  code,
  results,
}: {
  id: string
  name: string
  code: string
  results: StudentSubjectResult[]
}): PerformanceAnalyticsEntry {
  const totalMarks = normalizeMarks(
    results.reduce((total, result) => total + result.totalMarks, 0)
  )
  const maximumMarks = results.reduce(
    (total, result) => total + result.maximumMarks,
    0
  )

  return {
    id,
    name,
    code,
    totalMarks,
    maximumMarks,
    percentage: getPrecisePercentage(totalMarks, maximumMarks),
    resultCount: results.length,
    studentCount: new Set(results.map((result) => result.studentId)).size,
  }
}

function sortPerformanceAnalytics(
  entries: PerformanceAnalyticsEntry[]
): PerformanceAnalyticsEntry[] {
  return [...entries].sort((first, second) => {
    if (second.percentage !== first.percentage) {
      return second.percentage - first.percentage
    }

    return rankingCollator.compare(first.name, second.name)
  })
}

export function getDepartmentPerformanceAnalytics({
  results,
  departments,
  filters,
}: {
  results: StudentSubjectResult[]
  departments: Department[]
  filters?: RankingAnalyticsFilters
}) {
  const scopedResults = filterRankingResults(results, filters)
  const departmentsById = new Map(
    departments.map((department) => [department.id, department])
  )
  const resultsByDepartment = new Map<string, StudentSubjectResult[]>()

  for (const result of scopedResults) {
    const existingResults = resultsByDepartment.get(result.departmentId) ?? []

    resultsByDepartment.set(result.departmentId, [...existingResults, result])
  }

  return sortPerformanceAnalytics(
    Array.from(resultsByDepartment.entries()).map(
      ([departmentId, departmentResults]) => {
        const department = departmentsById.get(departmentId)
        const fallbackResult = departmentResults[0]

        return getPerformanceAnalyticsEntry({
          id: departmentId,
          name:
            department?.name ??
            fallbackResult?.departmentName ??
            "Department unavailable",
          code:
            department?.code ??
            fallbackResult?.departmentCode ??
            "Department unavailable",
          results: departmentResults,
        })
      }
    )
  )
}

export function getSubjectPerformanceAnalytics({
  results,
  subjects,
  filters,
}: {
  results: StudentSubjectResult[]
  subjects: Subject[]
  filters?: RankingAnalyticsFilters
}) {
  const scopedResults = filterRankingResults(results, filters)
  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]))
  const resultsBySubject = new Map<string, StudentSubjectResult[]>()

  for (const result of scopedResults) {
    const existingResults = resultsBySubject.get(result.subjectId) ?? []

    resultsBySubject.set(result.subjectId, [...existingResults, result])
  }

  return sortPerformanceAnalytics(
    Array.from(resultsBySubject.entries()).map(([subjectId, subjectResults]) => {
      const subject = subjectsById.get(subjectId)
      const fallbackResult = subjectResults[0]

      return getPerformanceAnalyticsEntry({
        id: subjectId,
        name:
          subject?.name ?? fallbackResult?.subjectName ?? "Subject unavailable",
        code:
          subject?.code ?? fallbackResult?.subjectCode ?? "Subject unavailable",
        results: subjectResults,
      })
    })
  )
}
