import { supabase } from '@/lib/supabase'
import FixtureList from '@/components/FixtureList'

export const dynamic = 'force-dynamic'

export default async function FixturesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const season = parseInt(sp.season ?? String(new Date().getFullYear()), 10)

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('season', season)
    .order('match_date', { ascending: true })

  // Which 2026 matches have scorecards synced (enables "View scorecard" link in the modal).
  const { data: scs } = await supabase
    .from('match_scorecards')
    .select('match_id')
    .eq('season', season)
  const scorecardIds = new Set((scs ?? []).map((s) => s.match_id))

  return <FixtureList fixtures={fixtures || []} season={season} scorecardIds={Array.from(scorecardIds)} />
}
