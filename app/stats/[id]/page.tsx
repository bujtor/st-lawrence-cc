import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatOvers } from '@/lib/play-cricket'

export const dynamic = 'force-dynamic'

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

function fmtAvg(runs: number, inns: number, notOut: number) {
  const d = inns - notOut
  if (d <= 0) return '−'
  return (runs / d).toFixed(1)
}

function fmtBowlAvg(runs: number, wkts: number) {
  if (wkts === 0) return '−'
  return (runs / wkts).toFixed(1)
}

function fmtEcon(runs: number, overs: number) {
  if (overs === 0) return '−'
  return (runs / overs).toFixed(2)
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberId = parseInt(id, 10)
  if (isNaN(memberId)) notFound()

  // Resolve player
  const { data: playerRows } = await supabase
    .from('players')
    .select('name, play_cricket_member_id')
    .eq('play_cricket_member_id', memberId)
    .limit(1)

  const player = playerRows?.[0]
  if (!player) notFound()

  // All batting entries for this player, with match info
  const { data: battingAll } = await supabase
    .from('batting_entries')
    .select('match_id, season, runs, balls, how_out, bowler_name, innings_number')
    .eq('batsman_id', memberId)
    .eq('is_our_batsman', true)
    .order('match_id', { ascending: false })

  // All bowling entries for this player
  const { data: bowlingAll } = await supabase
    .from('bowling_entries')
    .select('match_id, season, overs, runs, wickets, maidens, innings_number')
    .eq('bowler_id', memberId)
    .eq('is_our_bowler', true)
    .order('match_id', { ascending: false })

  // Scorecards for match date + opponent
  const allMatchIds = [
    ...new Set([
      ...(battingAll ?? []).map(r => r.match_id),
      ...(bowlingAll ?? []).map(r => r.match_id),
    ]),
  ]

  const scorecardMap = new Map<
    number,
    {
      match_date: string
      home_club_name: string
      away_club_name: string
      our_team_id: string
      home_team_id: string
      away_team_id: string
    }
  >()

  if (allMatchIds.length > 0) {
    const { data: scsFixed } = await supabase
      .from('match_scorecards')
      .select('match_id, home_club_name, away_club_name, our_team_id, home_team_id, away_team_id')
      .in('match_id', allMatchIds)

    // match_date lives on fixtures, not scorecards — look it up there
    const { data: fixRows } = await supabase
      .from('fixtures')
      .select('play_cricket_match_id, match_date')
      .in('play_cricket_match_id', allMatchIds)

    const fixDateMap = new Map<number, string>()
    for (const f of fixRows ?? []) {
      if (f.play_cricket_match_id) fixDateMap.set(f.play_cricket_match_id, f.match_date)
    }

    for (const sc of scsFixed ?? []) {
      scorecardMap.set(sc.match_id, {
        match_date: fixDateMap.get(sc.match_id) ?? '',
        home_club_name: sc.home_club_name ?? '',
        away_club_name: sc.away_club_name ?? '',
        our_team_id: sc.our_team_id ?? '',
        home_team_id: sc.home_team_id ?? '',
        away_team_id: sc.away_team_id ?? '',
      })
    }
  }

  function getOpponent(matchId: number) {
    const sc = scorecardMap.get(matchId)
    if (!sc) return '?'
    return (sc.our_team_id === sc.home_team_id ? sc.away_club_name : sc.home_club_name) || '?'
  }

  function getMatchDate(matchId: number) {
    return scorecardMap.get(matchId)?.match_date ?? ''
  }

  // Aggregate by season - batting
  type SeasonBat = { inns: number; notOut: number; runs: number; hs: number; fifties: number; hundreds: number }
  const batBySeason = new Map<number, SeasonBat>()
  let careerRuns = 0, careerInns = 0, careerNO = 0, careerHS = 0, career50s = 0, career100s = 0

  for (const row of battingAll ?? []) {
    const s = row.season
    if (!batBySeason.has(s)) batBySeason.set(s, { inns: 0, notOut: 0, runs: 0, hs: 0, fifties: 0, hundreds: 0 })
    const agg = batBySeason.get(s)!
    agg.inns++
    careerInns++
    const r = row.runs ?? 0
    agg.runs += r
    careerRuns += r
    if (r > agg.hs) agg.hs = r
    if (r > careerHS) careerHS = r
    if (r >= 100) { agg.hundreds++; career100s++ }
    else if (r >= 50) { agg.fifties++; career50s++ }
    const ho = (row.how_out ?? '').toLowerCase()
    if (ho === 'not out' || ho === '') { agg.notOut++; careerNO++ }
  }

  // Aggregate by season - bowling
  type SeasonBowl = { overs: number; runs: number; wickets: number; bestWkts: number; bestRuns: number; fiveWs: number }
  const bowlBySeason = new Map<number, SeasonBowl>()
  let careerWkts = 0, careerBowlRuns = 0, careerOvers = 0
  let careerBestWkts = 0, careerBestRuns = 999

  for (const row of bowlingAll ?? []) {
    const s = row.season
    if (!bowlBySeason.has(s)) bowlBySeason.set(s, { overs: 0, runs: 0, wickets: 0, bestWkts: 0, bestRuns: 999, fiveWs: 0 })
    const agg = bowlBySeason.get(s)!
    agg.overs += row.overs ?? 0
    agg.runs += row.runs ?? 0
    const w = row.wickets ?? 0
    agg.wickets += w
    const r = row.runs ?? 0
    if (w > agg.bestWkts || (w === agg.bestWkts && r < agg.bestRuns)) { agg.bestWkts = w; agg.bestRuns = r }
    if (w >= 5) agg.fiveWs++
    careerOvers += row.overs ?? 0
    careerBowlRuns += r
    careerWkts += w
    if (w > careerBestWkts || (w === careerBestWkts && r < careerBestRuns)) { careerBestWkts = w; careerBestRuns = r }
  }

  // Catches / stumpings / run-outs for career header
  const { data: fieldingCareer } = await supabase
    .from('batting_entries')
    .select('how_out')
    .eq('fielder_id', memberId)
    .eq('is_our_fielder', true)

  let catches = 0, runOuts = 0, stumpings = 0
  for (const f of fieldingCareer ?? []) {
    const ho = (f.how_out ?? '').toLowerCase()
    if (ho.startsWith('ct')) catches++
    else if (ho.startsWith('run out')) runOuts++
    else if (ho.startsWith('st')) stumpings++
  }

  const careerMatches = new Set([
    ...(battingAll ?? []).map(r => r.match_id),
    ...(bowlingAll ?? []).map(r => r.match_id),
  ]).size

  // Recent innings (last 10)
  const recentBat = (battingAll ?? []).slice(0, 10)
  // Recent bowling (last 10)
  const recentBowl = (bowlingAll ?? []).slice(0, 10)

  const batSeasons = Array.from(batBySeason.keys()).sort((a, b) => b - a)
  const bowlSeasons = Array.from(bowlBySeason.keys()).sort((a, b) => b - a)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/stats" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold no-underline">
          ← Back to Stats
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{player.name}</h1>
        <p className="text-sm text-gray-400">Career Statistics</p>
      </div>

      {/* Career tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Matches</div>
          <div className="text-2xl font-extrabold text-gray-900">{careerMatches}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Runs</div>
          <div className="text-2xl font-extrabold text-gray-900">{careerRuns}</div>
          <div className="text-xs text-gray-500 mt-1">HS {careerHS} · Avg {fmtAvg(careerRuns, careerInns, careerNO)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">50s / 100s</div>
          <div className="text-2xl font-extrabold text-gray-900">{career50s}/{career100s}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Wickets</div>
          <div className="text-2xl font-extrabold text-gray-900">{careerWkts}</div>
          <div className="text-xs text-gray-500 mt-1">
            Best {careerBestWkts}/{careerBestRuns === 999 ? 0 : careerBestRuns} · Avg {fmtBowlAvg(careerBowlRuns, careerWkts)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Econ</div>
          <div className="text-2xl font-extrabold text-gray-900">{fmtEcon(careerBowlRuns, careerOvers)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Catches</div>
          <div className="text-2xl font-extrabold text-gray-900">{catches}</div>
          <div className="text-xs text-gray-500 mt-1">RO {runOuts} · St {stumpings}</div>
        </div>
      </div>

      {/* Batting season breakdown */}
      {batSeasons.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Batting by Season</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Season</th>
                  <th className="px-3 py-2 text-right">Inn</th>
                  <th className="px-3 py-2 text-right">NO</th>
                  <th className="px-3 py-2 text-right">Runs</th>
                  <th className="px-3 py-2 text-right">HS</th>
                  <th className="px-3 py-2 text-right">Avg</th>
                  <th className="px-3 py-2 text-right">50/100</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batSeasons.map(s => {
                  const a = batBySeason.get(s)!
                  return (
                    <tr key={s} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-gray-800">{s}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.inns}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.notOut}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{a.runs}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.hs}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmtAvg(a.runs, a.inns, a.notOut)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.fifties}/{a.hundreds}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Bowling season breakdown */}
      {bowlSeasons.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Bowling by Season</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Season</th>
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
                {bowlSeasons.map(s => {
                  const a = bowlBySeason.get(s)!
                  return (
                    <tr key={s} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 font-semibold text-gray-800">{s}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{formatOvers(a.overs)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.runs}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{a.wickets}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.bestWkts}/{a.bestRuns === 999 ? 0 : a.bestRuns}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmtBowlAvg(a.runs, a.wickets)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{fmtEcon(a.runs, a.overs)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600">{a.fiveWs}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent innings */}
      {recentBat.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Recent Innings</h2>
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
            {recentBat.map((row, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="text-xs text-gray-400 min-w-[80px]">
                  {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                </div>
                <div className="flex-1 text-sm text-gray-700 truncate">vs {getOpponent(row.match_id)}</div>
                <div className="text-sm font-semibold text-gray-900 min-w-[30px] text-right">{row.runs ?? '−'}</div>
                <div className="text-xs text-gray-400 truncate max-w-[120px]">
                  {row.how_out === 'not out' || row.how_out === '' ? (
                    <span className="text-emerald-600">not out</span>
                  ) : (
                    <>b {row.bowler_name ?? '−'}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent bowling figures */}
      {recentBowl.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Recent Bowling</h2>
          <div className="rounded-xl border border-gray-100 divide-y divide-gray-50">
            {recentBowl.map((row, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                <div className="text-xs text-gray-400 min-w-[80px]">
                  {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                </div>
                <div className="flex-1 text-sm text-gray-700 truncate">vs {getOpponent(row.match_id)}</div>
                <div className="text-sm font-mono text-gray-700">
                  {formatOvers(row.overs ?? 0)}-{row.maidens ?? 0}-{row.runs ?? 0}-{row.wickets ?? 0}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {careerMatches === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No scorecard data found for {player.name}.</p>
          <p className="text-sm mt-1">Data populates as matches are synced from Play-Cricket.</p>
        </div>
      )}
    </div>
  )
}
