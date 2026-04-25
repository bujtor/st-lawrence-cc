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
  const { expectedToken } = await import('@/lib/captain-auth')

  // Check PIN from query param or signed captain-session cookie
  const pinFromUrl = typeof params.pin === 'string' ? params.pin : undefined
  const cookieStore = await cookies()
  const captainCookie = cookieStore.get('captain-session')?.value
  const expected = expectedToken()

  // Cookie auth: compare signed token
  const cookieAuthed = expected !== null && captainCookie === expected

  // URL PIN auth (for WhatsApp link)
  const pinAuthed = pinFromUrl === correctPin

  const authenticated = pinAuthed || cookieAuthed

  if (!authenticated) {
    return <PinGate />
  }

  // If authed via URL PIN but no valid cookie yet, trigger cookie refresh via SetPinCookie
  const needsCookie = pinAuthed && !cookieAuthed

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
