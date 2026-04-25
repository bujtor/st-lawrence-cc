import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

function fmtFullDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

type FixtureRow = {
  id: number
  match_date: string
  opponent: string
  venue: string
  home_away: string
  result_text: string | null
  competition: string | null
  play_cricket_match_id: number | null
  season: number
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Find opponent by matching slug against all known opponents
  const { data: allFixtures } = await supabase
    .from('fixtures')
    .select('id, match_date, opponent, venue, home_away, result_text, competition, play_cricket_match_id, season')
    .order('match_date', { ascending: false })

  const allOpponents = new Set<string>()
  for (const f of allFixtures ?? []) {
    if (f.opponent) allOpponents.add(f.opponent)
  }

  // Case-insensitive slug match
  const matchedOpponent = Array.from(allOpponents).find(
    name => clubSlug(name) === slug
  )

  if (!matchedOpponent) notFound()

  // All fixtures vs this opponent
  const fixtures = (allFixtures ?? []).filter(
    (f: FixtureRow) => f.opponent === matchedOpponent
  ) as FixtureRow[]

  // H2H summary
  let played = 0, won = 0, lost = 0, drew = 0, tied = 0, abandoned = 0
  for (const f of fixtures) {
    played++
    const r = f.result_text ?? ''
    if (r === 'Won') won++
    else if (r === 'Lost') lost++
    else if (r === 'Drew') drew++
    else if (r === 'Tied') tied++
    else if (r === 'Abandoned') abandoned++
  }

  // Get match IDs for scorecard queries
  const matchIds = fixtures
    .map((f: FixtureRow) => f.play_cricket_match_id)
    .filter((x): x is number => typeof x === 'number')

  type TopBat = { batsman_name: string | null; runs: number | null; match_id: number | null }
  type TopBowl = { bowler_name: string | null; wickets: number | null; runs: number | null; match_id: number | null }

  let ourTopBatter: TopBat | undefined
  let ourTopBowler: TopBowl | undefined
  let theirTopBatter: TopBat | undefined

  if (matchIds.length > 0) {
    // Our top scorer against them (single innings)
    const { data: ourBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_batsman', true)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)
    ourTopBatter = ourBat?.[0] as TopBat | undefined

    // Our best bowling against them (single innings)
    const { data: ourBowl } = await supabase
      .from('bowling_entries')
      .select('bowler_name, wickets, runs, overs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_bowler', true)
      .order('wickets', { ascending: false, nullsFirst: false })
      .order('runs', { ascending: true, nullsFirst: false })
      .limit(1)
    ourTopBowler = ourBowl?.[0] as TopBowl | undefined

    // Their top scorer against us (single innings)
    const { data: theirBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_batsman', false)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)
    theirTopBatter = theirBat?.[0] as TopBat | undefined
  }

  // Build map of match_id -> fixture for linking
  const fixtureByMatchId = new Map<number, FixtureRow>()
  for (const f of fixtures) {
    if (f.play_cricket_match_id) fixtureByMatchId.set(f.play_cricket_match_id, f)
  }

  const resultClass = (r: string | null) => {
    if (r === 'Won') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (r === 'Lost') return 'bg-rose-50 text-rose-700 border-rose-200'
    return 'bg-gray-50 text-gray-500 border-gray-200'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/clubs" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold no-underline">
          ← Back to Opponents
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">St Lawrence CC vs {matchedOpponent}</h1>
        <p className="text-sm text-gray-400 mt-1">All-time head-to-head record</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Played</div>
          <div className="text-2xl font-extrabold text-gray-900">{played}</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
          <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Won</div>
          <div className="text-2xl font-extrabold text-emerald-700">{won}</div>
        </div>
        <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 text-center">
          <div className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider mb-1">Lost</div>
          <div className="text-2xl font-extrabold text-rose-700">{lost}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
            {drew > 0 ? 'Drawn' : tied > 0 ? 'Tied' : 'Abandoned'}
          </div>
          <div className="text-2xl font-extrabold text-gray-700">{drew || tied || abandoned}</div>
        </div>
      </div>

      {/* Top performers */}
      {(ourTopBatter || ourTopBowler || theirTopBatter) && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Notable Performances</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {ourTopBatter && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Our top score (single innings)</div>
                <div className="font-semibold text-gray-900">{ourTopBatter.batsman_name ?? 'Unknown'}</div>
                <div className="text-2xl font-extrabold text-gray-900">{ourTopBatter.runs ?? 0}</div>
                {ourTopBatter.match_id && fixtureByMatchId.has(ourTopBatter.match_id) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtFullDate(fixtureByMatchId.get(ourTopBatter.match_id)!.match_date)}
                  </div>
                )}
              </div>
            )}
            {ourTopBowler && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Our best bowling (single innings)</div>
                <div className="font-semibold text-gray-900">{ourTopBowler.bowler_name ?? 'Unknown'}</div>
                <div className="text-2xl font-extrabold text-gray-900">
                  {ourTopBowler.wickets ?? 0}-{ourTopBowler.runs ?? 0}
                </div>
                {ourTopBowler.match_id && fixtureByMatchId.has(ourTopBowler.match_id) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtFullDate(fixtureByMatchId.get(ourTopBowler.match_id)!.match_date)}
                  </div>
                )}
              </div>
            )}
            {theirTopBatter && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">Their highest score against us</div>
                <div className="font-semibold text-gray-700">{theirTopBatter.batsman_name ?? 'Unknown'}</div>
                <div className="text-2xl font-extrabold text-gray-600">{theirTopBatter.runs ?? 0}</div>
                {theirTopBatter.match_id && fixtureByMatchId.has(theirTopBatter.match_id) && (
                  <div className="text-xs text-gray-400 mt-1">
                    {fmtFullDate(fixtureByMatchId.get(theirTopBatter.match_id)!.match_date)}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Match list */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Match History</h2>
        <div className="space-y-2">
          {fixtures.map((f: FixtureRow) => {
            const hasScorecard = !!f.play_cricket_match_id && matchIds.includes(f.play_cricket_match_id)
            const content = (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-800">{fmtFullDate(f.match_date)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {f.home_away === 'H' ? 'Home' : 'Away'} · {f.venue}
                    {f.competition ? ` · ${f.competition}` : ''}
                  </div>
                </div>
                {f.result_text && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${resultClass(f.result_text)}`}>
                    {f.result_text}
                  </span>
                )}
              </div>
            )

            return hasScorecard ? (
              <Link
                key={f.id}
                href={`/fixtures/${f.id}`}
                className="block bg-white rounded-xl border border-gray-100 px-4 py-3 no-underline hover:border-emerald-200 hover:bg-emerald-50/20 transition-all"
              >
                {content}
              </Link>
            ) : (
              <div
                key={f.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3"
              >
                {content}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}


