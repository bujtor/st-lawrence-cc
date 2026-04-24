import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchResults } from '@/lib/play-cricket'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function constantTimeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

// Vercel auto-sets `Authorization: Bearer $CRON_SECRET` on cron invocations when
// CRON_SECRET is configured. The presence of `x-vercel-cron` alone is NOT a secret —
// any client can set that header, so we require the bearer instead.
function authorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (cronSecret && authHeader && authHeader.startsWith('Bearer ')) {
    const provided = authHeader.slice(7)
    if (constantTimeMatch(cronSecret, provided)) return true
  }
  // Allow manual trigger with sync token
  const syncSecret = process.env.SYNC_API_SECRET
  const syncProvided = req.headers.get('x-sync-token')
  if (syncSecret && syncProvided && constantTimeMatch(syncSecret, syncProvided)) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const season = new Date().getFullYear()
  const started_at = new Date().toISOString()

  // Early-exit check: use last_updated from result_summary to detect freshness.
  // If every completed match's last_updated matches what we have stored, nothing to do.
  try {
    const results = await fetchResults(season)
    if (results.length > 0) {
      const supabase = supabaseAdmin()
      const { data: stored } = await supabase
        .from('match_scorecards')
        .select('match_id, last_updated_pc')
        .eq('season', season)

      const storedMap = new Map<number, string>()
      for (const row of stored ?? []) {
        storedMap.set(row.match_id, row.last_updated_pc ?? '')
      }

      const allFresh = results.every(r => {
        const storedVal = storedMap.get(r.id)
        return storedVal !== undefined && storedVal === (r.last_updated ?? '')
      })

      if (allFresh) {
        return NextResponse.json({
          status: 'no-op',
          reason: 'all scorecards up to date',
          season,
          completed_count: results.length,
          stored_count: stored?.length ?? 0,
        })
      }
    }
  } catch {
    // If early-exit check fails, proceed with full sync anyway
  }

  // Delegate to the POST sync endpoint internally
  const syncUrl = new URL('/api/sync', req.url)
  syncUrl.searchParams.set('target', 'all')
  syncUrl.searchParams.set('season', String(season))

  const syncRes = await fetch(syncUrl.toString(), {
    method: 'POST',
    headers: {
      'x-sync-token': process.env.SYNC_API_SECRET ?? '',
    },
  })

  const data = await syncRes.json()
  return NextResponse.json({
    status: 'synced',
    season,
    started_at,
    ...data,
  })
}
