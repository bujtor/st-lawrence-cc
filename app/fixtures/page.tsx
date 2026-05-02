import { supabase } from '@/lib/supabase'
import FixtureList from '@/components/FixtureList'
import { fetchRecentForm } from '@/lib/recent-form'

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

  // Which matches in this season have scorecards synced (controls the in-modal
  // "View scorecard" link AND whether a row is a clickable scorecard link).
  const { data: scs } = await supabase
    .from('match_scorecards')
    .select('match_id')
    .eq('season', season)
  const scorecardIds = new Set((scs ?? []).map((s) => s.match_id))

  // Overall last 5 results across all seasons — header strip on the list.
  const recentForm = await fetchRecentForm(5)

  return (
    <FixtureList
      fixtures={fixtures || []}
      season={season}
      scorecardIds={Array.from(scorecardIds)}
      recentForm={recentForm}
    />
  )
}
