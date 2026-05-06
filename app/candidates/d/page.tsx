import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { todayLondon, londonWallTimeToUtc } from '@/lib/london-time'
import { fetchRecentForm } from '@/lib/recent-form'
import RecentFormStrip from './_components/RecentFormStrip'

const sponsors = [
  { name: 'Barber Jack', file: 'barber-jack.png' },
  { name: 'JML', file: 'jml.jpeg' },
  { name: 'Regal Point', file: 'regal-point.jpg' },
  { name: 'Gulliver', file: 'gulliver.png' },
  { name: 'Savills', file: 'savills.png' },
  // Harding Motors logo pending — paid sponsor, name-only chip until logo arrives
  { name: 'Harding Motors', file: null },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function formatMeetTime(t: string | null | undefined): string {
  if (!t) return ''
  return t.slice(0, 5)
}

const heroImages = [
  '/images/gallery/hero-ground.jpg',
  '/images/gallery/hero-batting-hedge.jpg',
  '/images/gallery/hero-big-hit.jpg',
  '/images/gallery/hero-batting-cottage.jpg',
]

export const dynamic = 'force-dynamic'

type FixtureRow = {
  id: number
  match_date: string
  opponent: string
  venue: string
  home_away: string
  start_time: string | null
  meet_time: string | null
  result_text: string | null
  season: number
  play_cricket_match_id: number | null
  competition: string | null
}

export default async function Home() {
  const heroImage = heroImages[Math.floor(Math.random() * heroImages.length)]
  const today = todayLondon()

  // Get today's fixtures + next upcoming
  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(3)

  const todayFixture = (upcomingFixtures ?? []).find((f: FixtureRow) => f.match_date === today) as FixtureRow | undefined
  const nextFixture = (upcomingFixtures ?? []).find((f: FixtureRow) => f.match_date > today) as FixtureRow | undefined

  // Last result
  const { data: lastResults } = await supabase
    .from('fixtures')
    .select('*')
    .lt('match_date', today)
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1)
  const lastResult = lastResults?.[0] as FixtureRow | undefined

  // Determine match state
  let matchState: 'live' | 'today-result' | 'upcoming' | 'none' = 'none'
  let displayFixture: FixtureRow | undefined

  if (todayFixture) {
    if (todayFixture.result_text) {
      matchState = 'today-result'
      displayFixture = todayFixture
    } else if (todayFixture.start_time) {
      // Check if live (between start_time and ~23:30 London)
      const nowMs = new Date().getTime()
      const startUtc = londonWallTimeToUtc(today, todayFixture.start_time)
      const endUtc = londonWallTimeToUtc(today, '23:30:00')
      if (startUtc != null && endUtc != null && nowMs >= startUtc && nowMs <= endUtc) {
        matchState = 'live'
      } else {
        matchState = 'upcoming'
      }
      displayFixture = todayFixture
    } else {
      matchState = 'upcoming'
      displayFixture = todayFixture
    }
  } else if (nextFixture) {
    matchState = 'upcoming'
    displayFixture = nextFixture
  }

  // H2H for the display fixture (last 5 results vs them)
  let h2hWon = 0, h2hPlayed = 0
  let h2hLast3: string[] = []
  if (displayFixture) {
    const opponent = displayFixture.opponent
    const { data: priorFixtures } = await supabase
      .from('fixtures')
      .select('play_cricket_match_id')
      .eq('opponent', opponent)
      .not('play_cricket_match_id', 'is', null)

    const priorMatchIds = (priorFixtures ?? [])
      .map((f: { play_cricket_match_id: number | null }) => f.play_cricket_match_id)
      .filter((x: number | null): x is number => typeof x === 'number')

    if (priorMatchIds.length > 0) {
      const { data: h2hMatches } = await supabase
        .from('match_scorecards')
        .select('match_id, result_text')
        .in('match_id', priorMatchIds)
        .order('match_id', { ascending: false })
        .limit(5)

      for (const sc of h2hMatches ?? []) {
        h2hPlayed++
        if (sc.result_text === 'Won') h2hWon++
        // (h2hLost not tracked — only won count displayed)
      }
      h2hLast3 = (h2hMatches ?? []).slice(0, 3).map((sc: { result_text: string | null }) => sc.result_text ?? 'Unknown')
    }
  }

  // Overall recent form — last 5 completed matches, regardless of opponent.
  const recentForm = await fetchRecentForm(5)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with real ground photo.
          Mobile is taller — the match-day widget stacks 2-3 cards beneath
          the badge, so 420px clipped the top.
          Desktop scales with viewport width so the cricket photo keeps a
          consistent aspect on bigger monitors instead of letterboxing the
          batsman out of frame; bounded so it never goes silly small/tall. */}
      <div className="relative h-[600px] md:h-[30vw] md:min-h-[420px] md:max-h-[640px] overflow-hidden">
        <Image
          src={heroImage}
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-4 w-full flex flex-col md:flex-row items-center md:items-end md:justify-between gap-6">
            {/* Logo + subtitle - left/center */}
            <div className="text-center md:text-left">
              <Image
                src="/images/badge.png"
                alt="St Lawrence Cricket Club"
                width={320}
                height={180}
                className="invert w-auto max-h-24 md:max-h-32 mb-3 drop-shadow-2xl mx-auto md:mx-0"
                priority
              />
              <p className="text-white/70 text-sm font-light tracking-wide">Bitchet Green, Sevenoaks, Kent</p>
              <p className="text-white/40 text-xs mt-0.5">Kent County Village League &middot; Est. 1877</p>
            </div>

            {/* Match-day widget — right side overlay */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto md:max-w-xs">

              {/* LIVE MATCH */}
              {matchState === 'live' && displayFixture && (
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border border-red-500/60">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Match in Progress</div>
                  </div>
                  <div className="text-base font-bold text-white">vs {displayFixture.opponent}</div>
                  <div className="text-xs text-white/60 mt-0.5">{displayFixture.venue}</div>
                  {displayFixture.play_cricket_match_id && (
                    <a
                      href={`https://stlawrence.play-cricket.com/website/results/${displayFixture.play_cricket_match_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-[10px] text-emerald-400 font-semibold no-underline hover:text-emerald-300"
                    >
                      Watch on Play-Cricket →
                    </a>
                  )}
                  {h2hPlayed > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1">Last 3 H2H</div>
                      <div className="flex gap-1">
                        {h2hLast3.map((r, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              r === 'Won' ? 'bg-emerald-500/30 text-emerald-300'
                              : r === 'Lost' ? 'bg-rose-500/30 text-rose-300'
                              : 'bg-white/10 text-white/50'
                            }`}
                          >
                            {r === 'Won' ? 'W' : r === 'Lost' ? 'L' : r === 'Drew' ? 'D' : 'A'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TODAY'S RESULT */}
              {matchState === 'today-result' && displayFixture && (
                <Link
                  href={`/candidates/d/fixtures/${displayFixture.id}`}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 no-underline hover:bg-white/15 transition-colors"
                >
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1.5">
                    {"Today's Result"}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-white">vs {displayFixture.opponent}</div>
                      <div className="text-xs text-white/60 mt-0.5">{displayFixture.venue}</div>
                    </div>
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      displayFixture.result_text === 'Won' ? 'bg-emerald-500/30 text-emerald-300'
                      : displayFixture.result_text === 'Lost' ? 'bg-rose-500/30 text-rose-300'
                      : 'bg-white/20 text-white/70'
                    }`}>
                      {displayFixture.result_text}
                    </div>
                  </div>
                </Link>
              )}

              {/* UPCOMING MATCH */}
              {matchState === 'upcoming' && displayFixture && (
                <Link href="/candidates/d/fixtures" className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 no-underline hover:bg-white/15 transition-colors">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1.5">
                    {displayFixture.match_date === today ? 'Today' : 'Next Match'}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-white">vs {displayFixture.opponent}</div>
                      <div className="text-xs text-white/60 mt-0.5">
                        {displayFixture.match_date !== today && `${formatDate(displayFixture.match_date)} · `}
                        {displayFixture.venue}
                      </div>
                      {displayFixture.meet_time && (
                        <div className="text-xs text-white/40 mt-0.5">
                          Meet {formatMeetTime(displayFixture.meet_time)}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        displayFixture.home_away === 'H' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-sky-500/30 text-sky-300'
                      }`}>
                        {displayFixture.home_away === 'H' ? 'Home' : 'Away'}
                      </span>
                      <div className="text-lg font-bold text-white mt-1">{displayFixture.start_time?.slice(0, 5)}</div>
                    </div>
                  </div>
                  {h2hPlayed > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-white/40">
                      Won {h2hWon} of last {h2hPlayed} vs them
                    </div>
                  )}
                </Link>
              )}

              {/* LAST RESULT (only when no today fixture) */}
              {matchState !== 'today-result' && matchState !== 'live' && lastResult && (
                <Link
                  href={`/candidates/d/fixtures/${lastResult.id}`}
                  className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20 no-underline hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Last Result</div>
                      <div className="text-sm font-semibold text-white mt-0.5">vs {lastResult.opponent}</div>
                    </div>
                    <div className={`text-xs font-medium text-right ${
                      lastResult.result_text === 'Won' ? 'text-emerald-400'
                      : lastResult.result_text === 'Lost' ? 'text-rose-400'
                      : 'text-white/50'
                    }`}>
                      {lastResult.result_text}
                    </div>
                  </div>
                </Link>
              )}

              {/* RECENT FORM strip — overall last 5, each clickable */}
              {recentForm.length > 0 && (
                <div className="bg-black/30 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/15">
                  <RecentFormStrip results={recentForm} variant="dark" label="Overall · last 5" />
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Sponsors - just below hero (extra top padding on mobile so it doesn't crowd the hero widget) */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 pt-9 pb-5 md:py-5">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {sponsors.map((s) => (
              <div key={s.name} className="grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all">
                {s.file ? (
                  <Image
                    src={`/images/sponsors/${s.file}`}
                    alt={s.name}
                    width={100}
                    height={50}
                    className="object-contain max-h-[32px] w-auto"
                  />
                ) : (
                  <span className="text-sm font-semibold tracking-wide text-gray-700">
                    {s.name}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Saints Want You - recruitment banner */}
      <div className="relative overflow-hidden bg-gray-900">
        <Image
          src="/images/gallery/team-pavilion.jpg"
          alt="St Lawrence CC team"
          fill
          className="object-cover opacity-30"
        />
        <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              The Saints Want You!
            </h2>
            <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl">
              Interested in village cricket? We&apos;re a friendly social club founded in 1877. Cricket should be fun and enjoyed by all &mdash; new players welcome regardless of age or ability.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 flex-shrink-0">
            <Link
              href="/candidates/d/contact"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-lg no-underline transition-colors shadow-lg"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>

      {/* Photo strip */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/batting-shot.jpg" alt="Batting at St Lawrence" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/bowling-action.jpg" alt="Bowling action" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/pavilion-social.jpg" alt="Tea break at the pavilion" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/candidates/d/fixtures" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Fixtures</div>
            <div className="text-xs text-gray-400 mt-1">Schedule & results</div>
          </Link>
          <Link href="/candidates/d/table" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">League Table</div>
            <div className="text-xs text-gray-400 mt-1">KCVL standings</div>
          </Link>
          <Link href="/candidates/d/stats" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Statistics</div>
            <div className="text-xs text-gray-400 mt-1">Batting & bowling</div>
          </Link>
          <Link href="/candidates/d/about" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">About</div>
            <div className="text-xs text-gray-400 mt-1">Ground & contact</div>
          </Link>
          <Link href="/candidates/d/clubs" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center col-span-2 md:col-span-1">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Opponents</div>
            <div className="text-xs text-gray-400 mt-1">H2H records</div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/images/badge.png" alt="St Lawrence CC" width={80} height={28} className="h-5 w-auto opacity-40" />
              <div className="text-xs text-gray-400">
                St Lawrence Cricket Club &middot; Bitchet Green, TN15 0NB
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a href="https://stlawrence.play-cricket.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 no-underline transition-colors">
                Play-Cricket
              </a>
              <a href="https://www.serioussport.co.uk/teamstores/st-lawrence-cc" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 no-underline transition-colors">
                Club Shop
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
