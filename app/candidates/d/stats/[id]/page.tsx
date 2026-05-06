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

  // Resolve player from our roster first (preferred — gives canonical name).
  const { data: playerRows } = await supabase
    .from('players')
    .select('name, play_cricket_member_id')
    .eq('play_cricket_member_id', memberId)
    .limit(1)

  // All batting / bowling entries (only ours — career = innings for SLCC).
  // Bump limit well above default for prolific career players over many seasons.
  const { data: battingAll } = await supabase
    .from('batting_entries')
    .select('match_id, season, runs, balls, how_out, bowler_name, batsman_name, innings_number')
    .eq('batsman_id', memberId)
    .eq('is_our_batsman', true)
    .order('match_id', { ascending: false })
    .limit(2000)

  const { data: bowlingAll } = await supabase
    .from('bowling_entries')
    .select('match_id, season, overs, runs, wickets, maidens, bowler_name, innings_number')
    .eq('bowler_id', memberId)
    .eq('is_our_bowler', true)
    .order('match_id', { ascending: false })
    .limit(2000)

  // Fall back to a name from the scorecard entries if the player isn't in our roster
  // table yet (scorecard sync can land before players sync re-runs).
  const player = playerRows?.[0]
    ?? (battingAll?.[0] ? { name: battingAll[0].batsman_name ?? '?', play_cricket_member_id: memberId } : null)
    ?? (bowlingAll?.[0] ? { name: bowlingAll[0].bowler_name ?? '?', play_cricket_member_id: memberId } : null)
  if (!player) notFound()

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
      fixture_id: number | null
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

    // match_date + fixture_id live on fixtures — look them up there
    const { data: fixRows } = await supabase
      .from('fixtures')
      .select('id, play_cricket_match_id, match_date')
      .in('play_cricket_match_id', allMatchIds)

    const fixDateMap = new Map<number, string>()
    const fixIdMap = new Map<number, number>()
    for (const f of fixRows ?? []) {
      if (f.play_cricket_match_id) {
        fixDateMap.set(f.play_cricket_match_id, f.match_date)
        fixIdMap.set(f.play_cricket_match_id, f.id)
      }
    }

    for (const sc of scsFixed ?? []) {
      scorecardMap.set(sc.match_id, {
        match_date: fixDateMap.get(sc.match_id) ?? '',
        fixture_id: fixIdMap.get(sc.match_id) ?? null,
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

  // Aggregate by season - batting (plus per-season innings list for expansion)
  type BatRow = { match_id: number; runs: number | null; balls: number | null; how_out: string | null; bowler_name: string | null }
  type SeasonBat = {
    inns: number; notOut: number; runs: number; hs: number; fifties: number; hundreds: number
    rows: BatRow[]
  }
  const batBySeason = new Map<number, SeasonBat>()
  let careerRuns = 0, careerInns = 0, careerNO = 0, careerHS = 0, career50s = 0, career100s = 0

  for (const row of battingAll ?? []) {
    const s = row.season
    if (!batBySeason.has(s)) batBySeason.set(s, { inns: 0, notOut: 0, runs: 0, hs: 0, fifties: 0, hundreds: 0, rows: [] })
    const agg = batBySeason.get(s)!

    // Always include the row in the expandable list (the user wants to see DNBs too)
    agg.rows.push({
      match_id: row.match_id,
      runs: row.runs,
      balls: row.balls,
      how_out: row.how_out,
      bowler_name: row.bowler_name,
    })

    // But skip DNBs from the actual batting aggregations
    const ho = (row.how_out ?? '').toLowerCase()
    if (!ho || ho === 'did not bat') continue

    agg.inns++
    careerInns++
    const r = row.runs ?? 0
    agg.runs += r
    careerRuns += r
    if (r > agg.hs) agg.hs = r
    if (r > careerHS) careerHS = r
    if (r >= 100) { agg.hundreds++; career100s++ }
    else if (r >= 50) { agg.fifties++; career50s++ }
    if (ho === 'not out') { agg.notOut++; careerNO++ }
  }

  // Aggregate by season - bowling (plus per-season rows)
  type BowlRow = { match_id: number; overs: number | null; maidens: number | null; runs: number | null; wickets: number | null }
  type SeasonBowl = {
    overs: number; runs: number; wickets: number; bestWkts: number; bestRuns: number; fiveWs: number
    rows: BowlRow[]
  }
  const bowlBySeason = new Map<number, SeasonBowl>()
  let careerWkts = 0, careerBowlRuns = 0, careerOvers = 0
  let careerBestWkts = 0, careerBestRuns = 999

  for (const row of bowlingAll ?? []) {
    const s = row.season
    if (!bowlBySeason.has(s)) bowlBySeason.set(s, { overs: 0, runs: 0, wickets: 0, bestWkts: 0, bestRuns: 999, fiveWs: 0, rows: [] })
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
    agg.rows.push({
      match_id: row.match_id,
      overs: row.overs,
      maidens: row.maidens,
      runs: row.runs,
      wickets: row.wickets,
    })
  }

  // Catches / stumpings / run-outs for career header
  const { data: fieldingCareer } = await supabase
    .from('batting_entries')
    .select('how_out')
    .eq('fielder_id', memberId)
    .eq('is_our_fielder', true)
    .limit(2000)

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

  function getFixtureId(matchId: number): number | null {
    return scorecardMap.get(matchId)?.fixture_id ?? null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/candidates/d/stats" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold no-underline">
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

      {/* Batting season breakdown — click a season to expand innings */}
      {batSeasons.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Batting by Season
            <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
              · click a season to see every innings
            </span>
          </h2>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {/* Header row */}
            <div className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider grid grid-cols-[1fr_40px_36px_56px_36px_56px_60px] gap-2 px-3 py-2">
              <div>Season</div>
              <div className="text-right">Inn</div>
              <div className="text-right">NO</div>
              <div className="text-right">Runs</div>
              <div className="text-right">HS</div>
              <div className="text-right">Avg</div>
              <div className="text-right">50/100</div>
            </div>
            {batSeasons.map((s) => {
              const a = batBySeason.get(s)!
              return (
                <details key={s} className="group border-t border-gray-50 first:border-t-0">
                  <summary
                    className="grid grid-cols-[1fr_40px_36px_56px_36px_56px_60px] gap-2 px-3 py-2.5 items-center text-sm cursor-pointer hover:bg-gray-50 transition-colors list-none"
                    style={{ listStyle: 'none' }}
                  >
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
                      {s}
                    </div>
                    <div className="text-right text-gray-600">{a.inns}</div>
                    <div className="text-right text-gray-600">{a.notOut}</div>
                    <div className="text-right font-semibold text-gray-900">{a.runs}</div>
                    <div className="text-right text-gray-600">{a.hs}</div>
                    <div className="text-right text-gray-600">{fmtAvg(a.runs, a.inns, a.notOut)}</div>
                    <div className="text-right text-gray-600">{a.fifties}/{a.hundreds}</div>
                  </summary>
                  {/* Expanded: each innings, chronological, linking to fixture */}
                  <div className="bg-gray-50/40 border-t border-gray-100 px-1 py-1">
                    {a.rows
                      .slice()
                      .sort((x, y) => (getMatchDate(y.match_id) || '').localeCompare(getMatchDate(x.match_id) || ''))
                      .map((row, i) => {
                        const fid = getFixtureId(row.match_id)
                        const isNotOut =
                          !row.how_out || (row.how_out ?? '').toLowerCase() === 'not out'
                        const content = (
                          <>
                            <div className="text-xs text-gray-400 min-w-[72px]">
                              {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                            </div>
                            <div className="flex-1 text-sm text-gray-700 truncate">vs {getOpponent(row.match_id)}</div>
                            <div className="text-sm font-semibold text-gray-900 min-w-[30px] text-right">
                              {row.runs ?? '−'}
                              {isNotOut && row.runs != null && <span className="ml-0.5 text-[10px] text-emerald-600">*</span>}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[140px] text-right">
                              {isNotOut ? (
                                <span className="text-emerald-600">not out</span>
                              ) : (
                                <>b {row.bowler_name ?? '−'}</>
                              )}
                            </div>
                          </>
                        )
                        return fid ? (
                          <Link
                            key={i}
                            href={`/candidates/d/fixtures/${fid}`}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white no-underline text-inherit"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                            {content}
                          </div>
                        )
                      })}
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      )}

      {/* Bowling season breakdown — click a season to expand figures */}
      {bowlSeasons.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Bowling by Season
            <span className="text-gray-300 font-normal normal-case tracking-normal ml-2">
              · click a season to see every spell
            </span>
          </h2>
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            {/* Header row */}
            <div className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider grid grid-cols-[1fr_48px_44px_40px_56px_48px_48px_36px] gap-2 px-3 py-2">
              <div>Season</div>
              <div className="text-right">O</div>
              <div className="text-right">R</div>
              <div className="text-right">W</div>
              <div className="text-right">Best</div>
              <div className="text-right">Avg</div>
              <div className="text-right">Econ</div>
              <div className="text-right">5W</div>
            </div>
            {bowlSeasons.map((s) => {
              const a = bowlBySeason.get(s)!
              return (
                <details key={s} className="group border-t border-gray-50 first:border-t-0">
                  <summary
                    className="grid grid-cols-[1fr_48px_44px_40px_56px_48px_48px_36px] gap-2 px-3 py-2.5 items-center text-sm cursor-pointer hover:bg-gray-50 transition-colors list-none"
                    style={{ listStyle: 'none' }}
                  >
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <span className="text-gray-300 group-open:rotate-90 transition-transform inline-block w-3">▸</span>
                      {s}
                    </div>
                    <div className="text-right text-gray-600">{formatOvers(a.overs)}</div>
                    <div className="text-right text-gray-600">{a.runs}</div>
                    <div className="text-right font-semibold text-gray-900">{a.wickets}</div>
                    <div className="text-right text-gray-600">{a.bestWkts}/{a.bestRuns === 999 ? 0 : a.bestRuns}</div>
                    <div className="text-right text-gray-600">{fmtBowlAvg(a.runs, a.wickets)}</div>
                    <div className="text-right text-gray-600">{fmtEcon(a.runs, a.overs)}</div>
                    <div className="text-right text-gray-600">{a.fiveWs}</div>
                  </summary>
                  <div className="bg-gray-50/40 border-t border-gray-100 px-1 py-1">
                    {a.rows
                      .slice()
                      .sort((x, y) => (getMatchDate(y.match_id) || '').localeCompare(getMatchDate(x.match_id) || ''))
                      .map((row, i) => {
                        const fid = getFixtureId(row.match_id)
                        const content = (
                          <>
                            <div className="text-xs text-gray-400 min-w-[72px]">
                              {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                            </div>
                            <div className="flex-1 text-sm text-gray-700 truncate">vs {getOpponent(row.match_id)}</div>
                            <div className="text-sm font-mono text-gray-700 min-w-[90px] text-right">
                              {formatOvers(row.overs ?? 0)}-{row.maidens ?? 0}-{row.runs ?? 0}-
                              <span className="font-semibold text-gray-900">{row.wickets ?? 0}</span>
                            </div>
                          </>
                        )
                        return fid ? (
                          <Link
                            key={i}
                            href={`/candidates/d/fixtures/${fid}`}
                            className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-white no-underline text-inherit"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                            {content}
                          </div>
                        )
                      })}
                  </div>
                </details>
              )
            })}
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
