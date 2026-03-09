import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'
import AvailabilityGrid from '@/components/AvailabilityGrid'
import PinGate from '@/components/PinGate'
import SetPinCookie from '@/components/SetPinCookie'

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const correctPin = process.env.AVAILABILITY_PIN || '1234'

  // Check PIN from query param or cookie
  const pinFromUrl = typeof params.pin === 'string' ? params.pin : undefined
  const cookieStore = await cookies()
  const pinFromCookie = cookieStore.get('av_pin')?.value

  const authenticated = pinFromUrl === correctPin || pinFromCookie === correctPin

  if (!authenticated) {
    return <PinGate />
  }

  const needsCookie = pinFromUrl === correctPin && pinFromCookie !== correctPin

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
    <>
      {needsCookie && <SetPinCookie pin={correctPin} />}
      <AvailabilityGrid
        allPlayers={playersRes.data || []}
        initialFixtures={fixturesRes.data || []}
        initialAvailability={availabilityRes.data || []}
      />
    </>
  )
}
