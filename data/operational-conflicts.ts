import type { OperationalConflict } from "@/types/osm"

export const initialOperationalConflicts: OperationalConflict[] = [
  {
    id: "conflict-nodal-centre-batch-002",
    type: "nodal_centre_conflict",
    status: "detected",
    examId: "exam-2026-sem4-cs204-regular",
    nodalCentreId: "centre-dsu-001",
    uploadBatchId: "batch-002",
    affectedScriptIds: ["script-batch-002-001", "script-batch-002-002"],
    description: "Demo nodal-centre operational conflict detected for the batch intake.",
    detectedAt: "2026-08-24T14:10:00.000Z",
  },
]
