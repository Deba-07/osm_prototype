import type { DemoEvaluatorSession, DemoOtpChallenge } from "@/types/osm"

export const DEMO_OTP_CODE = "123456"
export const DEMO_OTP_DURATION_MS = 5 * 60 * 1000
export const DEMO_SESSION_DURATION_MS = 30 * 60 * 1000
export const MAX_DEMO_OTP_ATTEMPTS = 3

export function isDemoOtpExpired(challenge: DemoOtpChallenge, now = Date.now()) {
  return challenge.status === "pending" && Date.parse(challenge.expiresAt) <= now
}

export function isDemoSessionActive(
  session: DemoEvaluatorSession | null | undefined,
  evaluatorId?: string,
  now = Date.now()
) {
  return Boolean(
    session &&
      session.status === "active" &&
      (!evaluatorId || session.evaluatorId === evaluatorId) &&
      Date.parse(session.expiresAt) > now
  )
}
