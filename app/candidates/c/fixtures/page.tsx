import { supabase } from '@/lib/supabase'
import { fetchRecentForm, fetchFormByOpponent } from '@/lib/recent-form'
import { todayLondon } from '@/lib/london-time'
import CFixturesList from './_components/CFixturesList'

export const dynamic = 'force-dynamic'

export default async function CFixturesPage({
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

  const { data: scs } = await supabase
    .from('match_scorecards')
    .select('match_id')
    .eq('season', season)
  const scorecardIds = Array.from(new Set((scs ?? []).map((s) => s.match_id)))

  const recentForm = await fetchRecentForm(5)
  const formByOpponent = await fetchFormByOpponent(5)

  return (
    <CFixturesList
      fixtures={fixtures || []}
      season={season}
      scorecardIds={scorecardIds}
      recentForm={recentForm}
      formByOpponent={formByOpponent}
      todayDate={todayLondon()}
    />
  )
}
