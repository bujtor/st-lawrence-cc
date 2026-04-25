import { supabase } from '@/lib/supabase'
import { formatOvers } from '@/lib/play-cricket'
import { aggregateBatting, aggregateBowling, type BatRow, type BowlRow } from '@/lib/aggregations'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Substantive data exists from 2008. Years before that have only sparse
// matches (1-5/year) so excluded. 2026 = current season.
const ALL_SEASONS = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => 2008 + i)

const ALL_TIME = 'all' as const
type SeasonParam = number | typeof ALL_TIME

function fmtAvg(runs: number, inns: number, notOut: number): string {
  const denom = inns - notOut
  if (denom <= 0) return '−'
  return (runs / denom).toFixed(1)
}

function fmtBowlAvg(runs: number, wkts: number): string {
  if (wkts === 0) return '−'
  return (runs / wkts).toFixed(1)
}

function fmtEcon(runs: number, overs: number): string {
  if (overs === 0) return '−'
  return (runs / overs).toFixed(2)
}

function fmtSR(runs: number, balls: number): string {
  if (balls === 0) return '−'
  return ((runs / balls) * 100).toFixed(1)
}

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

  const allBatters = Array.from(batterMap.values())
    .sort((a, b) => b.runs - a.runs)

  // Top Bowlers
  let bowlingQ = supabase
    .from('bowling_entries')
    .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
    .eq('is_our_bowler', true)
    .limit(20000)
  if (!isAllTime) bowlingQ = bowlingQ.eq('season', season as number)
  const { data: bowlingRaw } = await bowlingQ

  const bowlerMap = aggregateBowling((bowlingRaw ?? []) as BowlRow[])

  const allBowlers = Array.from(bowlerMap.values())
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || (a.wickets > 0 ? a.runs / a.wickets - b.runs / b.wickets : 0))

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

  const allFielders = Array.from(fielderMap.values())
    .map(f => ({ ...f, total: f.catches + f.runOuts + f.stumpings }))
    .filter(f => f.total > 0)
    .sort((a, b) => b.total - a.total)

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

          {/* Section 2: Top Batters */}
          {allBatters.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Batters
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {allBatters.length} {allBatters.length === 1 ? 'batter' : 'batters'}
                </span>
              </h2>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2 text-left w-6">#</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-right">M</th>
                        <th className="px-3 py-2 text-right">Inn</th>
                        <th className="px-3 py-2 text-right">NO</th>
                        <th className="px-3 py-2 text-right">Runs</th>
                        <th className="px-3 py-2 text-right">HS</th>
                        <th className="px-3 py-2 text-right">Avg</th>
                        <th className="px-3 py-2 text-right">50/100</th>
                        <th className="px-3 py-2 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allBatters.slice(0, 10).map((b, i) => (
                        <tr key={b.id ?? b.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            {b.id ? (
                              <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                                {b.name}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-800">{b.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.matches.size}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.inns}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.notOut}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{b.runs}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.hs}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{fmtAvg(b.runs, b.inns, b.notOut)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.fifties}/{b.hundreds}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{fmtSR(b.runs, b.totalBalls)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allBatters.length > 10 && (
                  <details className="border-t border-gray-100 group">
                    <summary className="px-3 py-2.5 cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/30 transition-colors list-none flex items-center gap-1.5">
                      <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
                      Show all {allBatters.length} batters
                    </summary>
                    <div className="overflow-x-auto border-t border-gray-100">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-50">
                          {allBatters.slice(10).map((b, i) => (
                            <tr key={b.id ?? b.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 text-gray-400 text-xs w-6">{i + 11}</td>
                              <td className="px-3 py-2.5">
                                {b.id ? (
                                  <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                                    {b.name}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-gray-800">{b.name}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.matches.size}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.inns}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.notOut}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{b.runs}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.hs}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{fmtAvg(b.runs, b.inns, b.notOut)}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.fifties}/{b.hundreds}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{fmtSR(b.runs, b.totalBalls)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            </section>
          )}

          {/* Section 3: Top Bowlers */}
          {allBowlers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Bowlers
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {allBowlers.length} {allBowlers.length === 1 ? 'bowler' : 'bowlers'}
                </span>
              </h2>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2 text-left w-6">#</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-right">M</th>
                        <th className="px-3 py-2 text-right">O</th>
                        <th className="px-3 py-2 text-right">R</th>
                        <th className="px-3 py-2 text-right">W</th>
                        <th className="px-3 py-2 text-right">Best</th>
                        <th className="px-3 py-2 text-right">Avg</th>
                        <th className="px-3 py-2 text-right">Econ</th>
                        <th className="px-3 py-2 text-right">5W</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allBowlers.slice(0, 10).map((b, i) => (
                        <tr key={b.id ?? b.name} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            {b.id ? (
                              <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                                {b.name}
                              </Link>
                            ) : (
                              <span className="font-medium text-gray-800">{b.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.matches.size}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{formatOvers(b.overs)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.runs}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{b.wickets}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.bestWkts}/{b.bestRuns === 999 ? 0 : b.bestRuns}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{fmtBowlAvg(b.runs, b.wickets)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{fmtEcon(b.runs, b.overs)}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{b.fiveWs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allBowlers.length > 10 && (
                  <details className="border-t border-gray-100 group">
                    <summary className="px-3 py-2.5 cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/30 transition-colors list-none flex items-center gap-1.5">
                      <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
                      Show all {allBowlers.length} bowlers
                    </summary>
                    <div className="overflow-x-auto border-t border-gray-100">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-50">
                          {allBowlers.slice(10).map((b, i) => (
                            <tr key={b.id ?? b.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 text-gray-400 text-xs w-6">{i + 11}</td>
                              <td className="px-3 py-2.5">
                                {b.id ? (
                                  <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                                    {b.name}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-gray-800">{b.name}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.matches.size}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{formatOvers(b.overs)}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.runs}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{b.wickets}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.bestWkts}/{b.bestRuns === 999 ? 0 : b.bestRuns}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{fmtBowlAvg(b.runs, b.wickets)}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{fmtEcon(b.runs, b.overs)}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{b.fiveWs}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            </section>
          )}

          {/* Section 4: Top Fielders */}
          {allFielders.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Top Fielders
                <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
                  · {allFielders.length} {allFielders.length === 1 ? 'fielder' : 'fielders'}
                </span>
              </h2>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2 text-left w-6">#</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-right">Catches</th>
                        <th className="px-3 py-2 text-right">Run-outs</th>
                        <th className="px-3 py-2 text-right">Stumpings</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {allFielders.slice(0, 10).map((f, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-800">{f.name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{f.catches}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{f.runOuts}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600">{f.stumpings}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{f.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {allFielders.length > 10 && (
                  <details className="border-t border-gray-100 group">
                    <summary className="px-3 py-2.5 cursor-pointer text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/30 transition-colors list-none flex items-center gap-1.5">
                      <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
                      Show all {allFielders.length} fielders
                    </summary>
                    <div className="overflow-x-auto border-t border-gray-100">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-50">
                          {allFielders.slice(10).map((f, i) => (
                            <tr key={i + 10} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2.5 text-gray-400 text-xs w-6">{i + 11}</td>
                              <td className="px-3 py-2.5 font-medium text-gray-800">{f.name}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{f.catches}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{f.runOuts}</td>
                              <td className="px-3 py-2.5 text-right text-gray-600">{f.stumpings}</td>
                              <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{f.total}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
