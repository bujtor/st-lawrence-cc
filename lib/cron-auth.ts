import type { NextRequest } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

function constantTimeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Vercel auto-sets `Authorization: Bearer $CRON_SECRET` on cron invocations when
// CRON_SECRET is configured. The presence of `x-vercel-cron` alone is NOT a secret —
// any client can set that header, so we require the bearer instead.
// A manual trigger is also allowed with the sync token (x-sync-token).
export function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader && authHeader.startsWith('Bearer ')) {
    const provided = authHeader.slice(7)
    if (constantTimeMatch(cronSecret, provided)) return true
  }
  const syncSecret = process.env.SYNC_API_SECRET
  const syncProvided = req.headers.get('x-sync-token')
  if (syncSecret && syncProvided && constantTimeMatch(syncSecret, syncProvided)) return true
  return false
}
