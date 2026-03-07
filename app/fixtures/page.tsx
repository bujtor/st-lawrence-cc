import { supabase } from '@/lib/supabase'
import FixtureList from '@/components/FixtureList'

export const dynamic = 'force-dynamic'

export default async function FixturesPage() {
  const season = new Date().getFullYear()

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('season', season)
    .order('match_date', { ascending: true })

  return <FixtureList fixtures={fixtures || []} season={season} />
}
