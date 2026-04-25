/**
 * Normalise a Play-Cricket result code to a human-readable string.
 * Extracted from app/api/sync/route.ts for testability.
 */
export function normaliseResult(
  result: string,
  resultAppliedTo: string,
  ourTeamId: string
): string | null {
  if (!result) return null
  if (result === 'W') return resultAppliedTo === ourTeamId ? 'Won' : 'Lost'
  if (result === 'T') return 'Tied'
  if (result === 'D') return 'Drew'
  if (result === 'A') return 'Abandoned'
  if (result === 'C') return 'Cancelled'
  return null
}
