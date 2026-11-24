import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isCronAuthorized } from '@/lib/cron-auth'
import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'
import { todayLondon, shiftDate } from '@/lib/london-time'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Days back to purge. 1 would do if the cron never missed a night; 3 covers a
// skipped or late run at the cost of a few extra page rebuilds.
const WINDOW_DAYS = 3

/**
 * Nightly cache purge for pages whose content depends on today's date.
 *
 * Fixture and club pages are cached with no time-based expiry (ISR,
 * revalidate = false) and otherwise refresh only after a sync or a captain edit.
 * But a fixture page switches from its "upcoming" to its "past" layout once the
 * match date passes, and a club page's "next fixture v them" card moves on. This
 * purges just those pages for fixtures played in the last few days, so the rest
 * of the archive stays cached. Runs from vercel.json shortly after midnight.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ?today=YYYY-MM-DD replays another date (manual testing; still needs auth).
  const override = req.nextUrl.searchParams.get('today')
  if (override && !/^\d{4}-\d{2}-\d{2}$/.test(override)) {
    return NextResponse.json({ error: 'today must be YYYY-MM-DD' }, { status: 400 })
  }
  const today = override ?? todayLondon()
  const from = shiftDate(today, -WINDOW_DAYS)

  const { data, error } = await supabase
    .from('fixtures')
    .select('id, opponent')
    .gte('match_date', from)
    .lt('match_date', today)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const fixturePaths = (data ?? []).map(f => `/fixtures/${f.id}`)
  const clubPaths = [...new Set(
    (data ?? []).map(f => f.opponent?.trim()).filter((n): n is string => !!n).map(clubSlug).filter(Boolean),
  )].map(slug => `/clubs/${slug}`)

  for (const p of [...fixturePaths, ...clubPaths]) revalidatePath(p)

  return NextResponse.json({ today, from, purged: [...fixturePaths, ...clubPaths] })
}
