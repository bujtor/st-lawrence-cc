import { supabase } from '@/lib/supabase'
import { formatOvers } from '@/lib/play-cricket'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SEASONS = [2023, 2024, 2025, 2026]

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
  const season = parseInt(sp.season ?? String(new Date().getFullYear()), 10)

  // Team summary from match_scorecards
  const { data: scorecards } = await supabase
    .from('match_scorecards')
    .select(
      'result_text, our_team_id, home_team_id, away_team_id, our_runs, opp_runs, toss_won_by_team_id, result, result_applied_to'
    )
    .eq('season', season)

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

  // Top Batters
  const { data: battingRaw } = await supabase
    .from('batting_entries')
    .select('batsman_name, batsman_id, runs, balls, how_out, match_id')
    .eq('season', season)
    .eq('is_our_batsman', true)

  type BatterAgg = {
    name: string
    id: number | null
    matches: Set<number>
    inns: number
    notOut: number
    runs: number
    hs: number
    fifties: number
    hundreds: number
    totalBalls: number
  }
  const batterMap = new Map<string, BatterAgg>()

  for (const row of battingRaw ?? []) {
    const key = String(row.batsman_id ?? row.batsman_name)
    if (!batterMap.has(key)) {
      batterMap.set(key, {
        name: row.batsman_name ?? '?',
        id: row.batsman_id ?? null,
        matches: new Set(),
        inns: 0,
        notOut: 0,
        runs: 0,
        hs: 0,
        fifties: 0,
        hundreds: 0,
        totalBalls: 0,
      })
    }
    const agg = batterMap.get(key)!
    agg.matches.add(row.match_id)
    agg.inns++
    const r = row.runs ?? 0
    agg.runs += r
    if (r > agg.hs) agg.hs = r
    if (r >= 100) agg.hundreds++
    else if (r >= 50) agg.fifties++
    agg.totalBalls += row.balls ?? 0
    const ho = (row.how_out ?? '').toLowerCase()
    if (ho === 'not out' || ho === '') agg.notOut++
  }

  const topBatters = Array.from(batterMap.values())
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 10)

  // Top Bowlers
  const { data: bowlingRaw } = await supabase
    .from('bowling_entries')
    .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
    .eq('season', season)
    .eq('is_our_bowler', true)

  type BowlerAgg = {
    name: string
    id: number | null
    matches: Set<number>
    overs: number
    runs: number
    wickets: number
    bestWkts: number
    bestRuns: number
    fiveWs: number
  }
  const bowlerMap = new Map<string, BowlerAgg>()

  for (const row of bowlingRaw ?? []) {
    const key = String(row.bowler_id ?? row.bowler_name)
    if (!bowlerMap.has(key)) {
      bowlerMap.set(key, {
        name: row.bowler_name ?? '?',
        id: row.bowler_id ?? null,
        matches: new Set(),
        overs: 0,
        runs: 0,
        wickets: 0,
        bestWkts: 0,
        bestRuns: 999,
        fiveWs: 0,
      })
    }
    const agg = bowlerMap.get(key)!
    agg.matches.add(row.match_id)
    agg.overs += row.overs ?? 0
    agg.runs += row.runs ?? 0
    const w = row.wickets ?? 0
    agg.wickets += w
    if (w >= 5) agg.fiveWs++
    const r = row.runs ?? 0
    if (w > agg.bestWkts || (w === agg.bestWkts && r < agg.bestRuns)) {
      agg.bestWkts = w
      agg.bestRuns = r
    }
  }

  const topBowlers = Array.from(bowlerMap.values())
    .filter(b => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets || (a.wickets > 0 ? a.runs / a.wickets - b.runs / b.wickets : 0))
    .slice(0, 10)

  // Top Fielders
  const { data: fieldingRaw } = await supabase
    .from('batting_entries')
    .select('fielder_name, fielder_id, how_out')
    .eq('season', season)
    .eq('is_our_fielder', true)
    .not('fielder_id', 'is', null)

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

  const topFielders = Array.from(fielderMap.values())
    .map(f => ({ ...f, total: f.catches + f.runOuts + f.stumpings }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header + season selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Statistics</h1>
          <p className="text-sm text-gray-400 mt-0.5">{season} Season</p>
        </div>
        <div className="flex gap-1.5">
          {SEASONS.map(s => (
            <Link
              key={s}
              href={`/stats?season=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors no-underline ${
                s === season
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Stats for {season} will populate as matches are played.</p>
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
          {topBatters.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Top Batters</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                    {topBatters.map((b, i) => (
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
            </section>
          )}

          {/* Section 3: Top Bowlers */}
          {topBowlers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Top Bowlers</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                    {topBowlers.map((b, i) => (
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
            </section>
          )}

          {/* Section 4: Top Fielders */}
          {topFielders.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Top Fielders</h2>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                    {topFielders.map((f, i) => (
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
            </section>
          )}
        </>
      )}
    </div>
  )
}
