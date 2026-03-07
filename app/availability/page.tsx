import { supabase } from '@/lib/supabase'
import AvailabilityGrid from '@/components/AvailabilityGrid'

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage() {
  const season = new Date().getFullYear()

  const [playersRes, fixturesRes, availabilityRes] = await Promise.all([
    supabase
      .from('players')
      .select('*')
      .eq('is_active', true)
      .order('is_ringin', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('fixtures')
      .select('*')
      .eq('season', season)
      .order('match_date', { ascending: true }),
    supabase
      .from('availability')
      .select('*')
      .in(
        'fixture_id',
        (
          await supabase.from('fixtures').select('id').eq('season', season)
        ).data?.map((f) => f.id) || []
      ),
  ])

  return (
    <AvailabilityGrid
      allPlayers={playersRes.data || []}
      initialFixtures={fixturesRes.data || []}
      initialAvailability={availabilityRes.data || []}
    />
  )
}
