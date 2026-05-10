import { NextRequest, NextResponse } from 'next/server'
import { isCaptainAuthed } from '@/lib/captain-auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Captain-only manual sync trigger. Used by the "Sync now" button on
 * /availability when the Vercel cron has been napping. Re-uses the
 * existing /api/sync handler under the hood, with the server-side
 * SYNC_API_SECRET that visitors never see.
 */
export async function POST(req: NextRequest) {
  if (!(await isCaptainAuthed())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const syncSecret = process.env.SYNC_API_SECRET
  if (!syncSecret) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }

  const season = new Date().getFullYear()
  const url = new URL('/api/sync', req.url)
  url.searchParams.set('target', 'all')
  url.searchParams.set('season', String(season))

  try {
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'x-sync-token': syncSecret,
        'x-sync-trigger': 'captain-manual',
      },
    })
    const data = await res.json()
    return NextResponse.json({ status: res.ok ? 'ok' : 'error', upstream_status: res.status, ...data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ status: 'error', message: msg }, { status: 500 })
  }
}
