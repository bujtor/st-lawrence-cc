import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function authorized(req: NextRequest): boolean {
  const secret = process.env.SYNC_API_SECRET
  const provided = req.headers.get('x-sync-token')
  if (!secret || !provided) return false
  const a = Buffer.from(secret)
  const b = Buffer.from(provided)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// GET /api/sync/runs — returns the last 50 sync_run records (admin-only, x-sync-token gated)
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = supabaseAdmin()
  const { data, error } = await supabase
    .from('sync_runs')
    .select('id, started_at, finished_at, trigger, target, season, status, error, result_summary')
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ runs: data, count: data?.length ?? 0 })
}
