import type { Evaluation, Exam, Student, Subject } from "@/types/osm"

export type StudentSubjectResult = {
  id: string
  evaluationId: string
  studentId: string
  rollNumber: string
  studentName: string
  subjectId: string
  subjectCode: string
  subjectName: string
  semesterId: string
  examId: string
  examName: string
  totalMarks: number
  maximumMarks: number
  percentage: number
}

export function deriveResultsFromEvaluations({
  evaluations,
  students,
  subjects,
  exams,
}: {
  evaluations: Evaluation[]
  students: Student[]
  subjects: Subject[]
  exams: Exam[]
}): StudentSubjectResult[] {
  return evaluations
    .filter((evaluation) => evaluation.status === "submitted")
    .flatMap((evaluation) => {
      const student = students.find((item) => item.id === evaluation.studentId)
      const subject = subjects.find((item) => item.id === evaluation.subjectId)
      const exam = exams.find((item) => item.id === evaluation.examId)

      if (!student || !subject || !exam) {
        return []
      }

      return [
        {
          id: `result-${evaluation.id}`,
          evaluationId: evaluation.id,
          studentId: student.id,
          rollNumber: student.rollNumber,
          studentName: student.name,
          subjectId: subject.id,
          subjectCode: subject.code,
          subjectName: subject.name,
          semesterId: evaluation.semesterId,
          examId: exam.id,
          examName: exam.name,
          totalMarks: evaluation.totalMarks,
          maximumMarks: subject.maximumMarks,
          percentage:
            subject.maximumMarks > 0
              ? Number(
                  ((evaluation.totalMarks / subject.maximumMarks) * 100).toFixed(
                    2
                  )
                )
              : 0,
        },
      ]
    })
}
