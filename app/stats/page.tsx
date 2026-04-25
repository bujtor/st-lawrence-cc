import { supabase } from '@/lib/supabase'
import { aggregateBatting, aggregateBowling, type BatRow, type BowlRow } from '@/lib/aggregations'
import LeaderboardTable, { type BatterRow, type BowlerRow, type FielderRow } from '@/components/LeaderboardTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Substantive data exists from 2008. Years before that have only sparse
// matches (1-5/year) so excluded. 2026 = current season.
const ALL_SEASONS = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => 2008 + i)

const ALL_TIME = 'all' as const
type SeasonParam = number | typeof ALL_TIME

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const seasonRaw = sp.season ?? String(new Date().getFullYear())
  const isAllTime = seasonRaw === ALL_TIME
  const season: SeasonParam = isAllTime ? ALL_TIME : parseInt(seasonRaw, 10)

  // Team summary from match_scorecards. With "all time" we omit the .eq filter.
  let scorecardsQ = supabase
    .from('match_scorecards')
    .select(
      'result_text, our_team_id, home_team_id, away_team_id, our_runs, opp_runs, toss_won_by_team_id, result, result_applied_to'
    )
  if (!isAllTime) scorecardsQ = scorecardsQ.eq('season', season as number)
  const { data: scorecards } = await scorecardsQ

  const isEmpty = !scorecards || scorecards.length === 0

  let played = 0,
    won = 0,
    lost = 0,
    tied = 0,
    drew = 0,
    abandoned = 0,
    runsFor = 0,
    runsAgainst = 0,
    homeW = 0,
    homeL = 0,
    awayW = 0,
    awayL = 0,
    tossWon = 0,
    wonAfterToss = 0

  if (scorecards) {
    for (const s of scorecards) {
      played++
      const rt = s.result_text ?? ''
      if (rt === 'Won') won++
      else if (rt === 'Lost') lost++
      else if (rt === 'Tied') tied++
      else if (rt === 'Drew') drew++
      else if (rt === 'Abandoned') abandoned++

      runsFor += s.our_runs ?? 0
      runsAgainst += s.opp_runs ?? 0

      const isHome = s.our_team_id === s.home_team_id
      if (rt === 'Won') {
        if (isHome) homeW++
        else awayW++
      } else if (rt === 'Lost') {
        if (isHome) homeL++
        else awayL++
      }

      if (s.toss_won_by_team_id && String(s.toss_won_by_team_id) === String(s.our_team_id)) {
        tossWon++
        if (rt === 'Won') wonAfterToss++
      }
    }
  }

  const tossWinPct = played > 0 ? ((tossWon / played) * 100).toFixed(0) + '%' : '−'
  const winAfterTossPct = tossWon > 0 ? ((wonAfterToss / tossWon) * 100).toFixed(0) + '%' : '−'

  // Top Batters. All-time spans many seasons → bump above the default 1000 cap.
  let battingQ = supabase
    .from('batting_entries')
    .select('batsman_name, batsman_id, runs, balls, how_out, match_id')
    .eq('is_our_batsman', true)
    .limit(20000)
  if (!isAllTime) battingQ = battingQ.eq('season', season as number)
  const { data: battingRaw } = await battingQ

  const batterMap = aggregateBatting((battingRaw ?? []) as BatRow[])

  // Convert to serialisable plain rows for the client component (Set → number)
  const batters: BatterRow[] = Array.from(batterMap.values()).map((b) => ({
    id: b.id,
    name: b.name,
    matches: b.matches.size,
    inns: b.inns,
    notOut: b.notOut,
    runs: b.runs,
    hs: b.hs,
    fifties: b.fifties,
    hundreds: b.hundreds,
    totalBalls: b.totalBalls,
  }))

  // Top Bowlers
  let bowlingQ = supabase
    .from('bowling_entries')
    .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
    .eq('is_our_bowler', true)
    .limit(20000)
  if (!isAllTime) bowlingQ = bowlingQ.eq('season', season as number)
  const { data: bowlingRaw } = await bowlingQ

  const bowlerMap = aggregateBowling((bowlingRaw ?? []) as BowlRow[])

  const bowlers: BowlerRow[] = Array.from(bowlerMap.values())
    .filter((b) => b.wickets > 0)
    .map((b) => ({
      id: b.id,
      name: b.name,
      matches: b.matches.size,
      overs: b.overs,
      runs: b.runs,
      wickets: b.wickets,
      bestWkts: b.bestWkts,
      bestRuns: b.bestRuns,
      fiveWs: b.fiveWs,
    }))

  // Top Fielders
  let fieldingQ = supabase
    .from('batting_entries')
    .select('fielder_name, fielder_id, how_out')
    .eq('is_our_fielder', true)
    .not('fielder_id', 'is', null)
    .limit(20000)
  if (!isAllTime) fieldingQ = fieldingQ.eq('season', season as number)
  const { data: fieldingRaw } = await fieldingQ

  type FielderAgg = {
    name: string
    catches: number
    runOuts: number
    stumpings: number
  }
  const fielderMap = new Map<string, FielderAgg>()

  for (const row of fieldingRaw ?? []) {
    const key = String(row.fielder_id ?? row.fielder_name)
    if (!fielderMap.has(key)) {
      fielderMap.set(key, { name: row.fielder_name ?? '?', catches: 0, runOuts: 0, stumpings: 0 })
    }
    const agg = fielderMap.get(key)!
    const ho = (row.how_out ?? '').toLowerCase()
    if (ho.startsWith('ct')) agg.catches++
    else if (ho.startsWith('run out')) agg.runOuts++
    else if (ho.startsWith('st')) agg.stumpings++
  }

  const fielders: FielderRow[] = Array.from(fielderMap.values())
    .map((f) => ({ ...f, total: f.catches + f.runOuts + f.stumpings }))
    .filter((f) => f.total > 0)

  const recentSeasons = ALL_SEASONS.slice(-4) // last 4 seasons
  const olderSeasons = ALL_SEASONS.slice(0, -4).slice().reverse() // 2008-2022 desc
  const headingSubtitle = isAllTime ? 'All-time totals (2008–2026)' : `${season} Season`

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header + season selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Statistics</h1>
          <p className="text-sm text-gray-400 mt-0.5">{headingSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {recentSeasons.map(s => (
            <Link
              key={s}
              href={`/stats?season=${s}`}
              className={`px-4 min-h-[44px] inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors no-underline ${
                !isAllTime && s === season
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </Link>
          ))}
          <Link
            href={`/stats?season=${ALL_TIME}`}
            className={`px-4 min-h-[44px] inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors no-underline ${
              isAllTime
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            All time
          </Link>
          <details className="relative">
            <summary
              className="px-4 min-h-[44px] inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-colors no-underline bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer list-none"
            >
              Older ▾
            </summary>
            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 grid grid-cols-3 gap-1 min-w-[200px]">
              {olderSeasons.map(s => (
                <Link
                  key={s}
                  href={`/stats?season=${s}`}
                  className={`px-3 py-2 rounded text-xs font-semibold no-underline text-center transition-colors ${
                    !isAllTime && s === season
                      ? 'bg-emerald-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">
            {isAllTime
              ? 'No stats yet — sync some scorecards.'
              : `Stats for ${season} will populate as matches are played.`}
          </p>
          <p className="text-sm mt-1">Scorecards sync automatically after each match.</p>
        </div>
      ) : (
        <>
          {/* Section 1: Team Summary */}
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Team Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Played</div>
                <div className="text-2xl font-extrabold text-gray-900">{played}</div>
                <div className="text-xs text-gray-500 mt-1">{won}W · {lost}L · {tied}T · {drew}D{abandoned > 0 ? ` · ${abandoned}A` : ''}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Runs</div>
                <div className="text-2xl font-extrabold text-gray-900">{runsFor.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Conceded {runsAgainst.toLocaleString()}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Home / Away</div>
                <div className="text-2xl font-extrabold text-gray-900">{homeW}-{homeL}</div>
                <div className="text-xs text-gray-500 mt-1">Away {awayW}-{awayL}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Toss</div>
                <div className="text-2xl font-extrabold text-gray-900">{tossWinPct}</div>
                <div className="text-xs text-gray-500 mt-1">Win after toss {winAfterTossPct}</div>
              </div>
            </div>
          </section>

          {/* Top Batters */}
          {batters.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Batters
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {batters.length} {batters.length === 1 ? 'batter' : 'batters'} &middot; click any column to sort
                </span>
              </h2>
              <LeaderboardTable kind="batters" rows={batters} defaultSortKey="runs" />
            </section>
          )}

          {/* Top Bowlers */}
          {bowlers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Bowlers
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {bowlers.length} {bowlers.length === 1 ? 'bowler' : 'bowlers'} &middot; click any column to sort
                </span>
              </h2>
              <LeaderboardTable kind="bowlers" rows={bowlers} defaultSortKey="wickets" />
            </section>
          )}

          {/* Top Fielders */}
          {fielders.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Fielders
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {fielders.length} {fielders.length === 1 ? 'fielder' : 'fielders'} &middot; click any column to sort
                </span>
              </h2>
              <LeaderboardTable kind="fielders" rows={fielders} defaultSortKey="total" />
            </section>
          )}
        </>
      )}
    </div>
  )
}
