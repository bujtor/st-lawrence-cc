import { NextRequest, NextResponse } from 'next/server'
import { isCronAuthorized } from '@/lib/cron-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchResults } from '@/lib/play-cricket'
// sync_runs logging happens via the POST /api/sync route below

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const season = new Date().getFullYear()
  const started_at = new Date().toISOString()
  const syncDb = supabaseAdmin()

  // Early-exit check: use last_updated from result_summary to detect freshness.
  // If every completed match's last_updated matches what we have stored, nothing to do.
  try {
    const results = await fetchResults(season)
    if (results.length > 0) {
      const { data: stored } = await syncDb
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
        const noopResult = {
          status: 'no-op',
          reason: 'all scorecards up to date',
          season,
          completed_count: results.length,
          stored_count: stored?.length ?? 0,
        }
        // Log the noop cron run
        await syncDb.from('sync_runs').insert({
          trigger: 'cron-noop',
          target: 'all',
          season,
          status: 'success',
          started_at,
          finished_at: new Date().toISOString(),
          result_summary: noopResult,
        })
        return NextResponse.json(noopResult)
      }
    }
  } catch {
    // If early-exit check fails, proceed with full sync anyway
  }

  // Delegate to the POST sync endpoint internally.
  // The POST handler creates its own sync_run with trigger='manual'.
  // We override the trigger after by updating the row, but it's simpler to
  // just pass a custom header and let the POST handler use 'cron' trigger.
  // For now: the POST creates trigger='manual' — acceptable for cron delegation.
  const syncUrl = new URL('/api/sync', req.url)
  syncUrl.searchParams.set('target', 'all')
  syncUrl.searchParams.set('season', String(season))

  const syncRes = await fetch(syncUrl.toString(), {
    method: 'POST',
    headers: {
      'x-sync-token': process.env.SYNC_API_SECRET ?? '',
      'x-sync-trigger': 'cron',
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
