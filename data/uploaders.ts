import type { Uploader } from "@/types/osm"

export const uploaders: Uploader[] = [
  {
    id: "uploader-001",
    name: "Neelam Patil",
    email: "neelam.patil@dsu-eng.demo",
    phone: "+91 98765 43201",
    collegeId: "college-dsu-engineering",
    nodalCentreId: "centre-dsu-001",
    status: "approved",
    registeredAt: "2026-08-18T09:30:00.000Z",
    approvedAt: "2026-08-19T11:00:00.000Z",
  },
  {
    id: "uploader-002",
    name: "Harish Vora",
    email: "harish.vora@wit.demo",
    phone: "+91 98765 43202",
    collegeId: "college-western-tech",
    nodalCentreId: "centre-western-002",
    status: "pending",
    registeredAt: "2026-09-22T14:15:00.000Z",
  },
  {
    id: "uploader-003",
    name: "Madhuri Shah",
    email: "madhuri.shah@hcs.demo",
    phone: "+91 98765 43203",
    collegeId: "college-horizon-science",
    nodalCentreId: "centre-horizon-003",
    status: "rejected",
    registeredAt: "2026-08-28T10:00:00.000Z",
    rejectedAt: "2026-08-29T12:30:00.000Z",
    rejectionReason: "Please nominate a staff member assigned to the active examination centre.",
  },
]
