import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatOvers } from '@/lib/play-cricket'
import {
  CKicker,
  CCard,
  CContainer,
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_INK,
  C_RULE,
  display,
  mono,
  sansTight,
} from '@/components/c/primitives'

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

export default async function CPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const memberId = parseInt(id, 10)
  if (isNaN(memberId)) notFound()

  const { data: playerRows } = await supabase
    .from('players')
    .select('name, play_cricket_member_id')
    .eq('play_cricket_member_id', memberId)
    .limit(1)

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

  const player = playerRows?.[0]
    ?? (battingAll?.[0] ? { name: battingAll[0].batsman_name ?? '?', play_cricket_member_id: memberId } : null)
    ?? (bowlingAll?.[0] ? { name: bowlingAll[0].bowler_name ?? '?', play_cricket_member_id: memberId } : null)
  if (!player) notFound()

  // Scorecards
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

  function getFixtureId(matchId: number): number | null {
    return scorecardMap.get(matchId)?.fixture_id ?? null
  }

  // Batting aggregations by season
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
    agg.rows.push({ match_id: row.match_id, runs: row.runs, balls: row.balls, how_out: row.how_out, bowler_name: row.bowler_name })
    const ho = (row.how_out ?? '').toLowerCase()
    if (!ho || ho === 'did not bat') continue
    agg.inns++; careerInns++
    const r = row.runs ?? 0
    agg.runs += r; careerRuns += r
    if (r > agg.hs) agg.hs = r
    if (r > careerHS) careerHS = r
    if (r >= 100) { agg.hundreds++; career100s++ }
    else if (r >= 50) { agg.fifties++; career50s++ }
    if (ho === 'not out') { agg.notOut++; careerNO++ }
  }

  // Bowling aggregations by season
  type BowlRowLocal = { match_id: number; overs: number | null; maidens: number | null; runs: number | null; wickets: number | null }
  type SeasonBowl = {
    overs: number; runs: number; wickets: number; bestWkts: number; bestRuns: number; fiveWs: number
    rows: BowlRowLocal[]
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
    const r = row.runs ?? 0
    agg.wickets += w
    if (w > agg.bestWkts || (w === agg.bestWkts && r < agg.bestRuns)) { agg.bestWkts = w; agg.bestRuns = r }
    if (w >= 5) agg.fiveWs++
    careerOvers += row.overs ?? 0
    careerBowlRuns += r
    careerWkts += w
    if (w > careerBestWkts || (w === careerBestWkts && r < careerBestRuns)) { careerBestWkts = w; careerBestRuns = r }
    agg.rows.push({ match_id: row.match_id, overs: row.overs, maidens: row.maidens, runs: row.runs, wickets: row.wickets })
  }

  // Fielding
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

  const batSeasons = Array.from(batBySeason.keys()).sort((a, b) => b - a)
  const bowlSeasons = Array.from(bowlBySeason.keys()).sort((a, b) => b - a)

  // Stat cell helper
  const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ borderRight: `1px solid rgba(255,255,255,.12)`, paddingRight: 24, paddingLeft: 4 }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 40, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  const thStyle: React.CSSProperties = {
    padding: '8px 14px',
    fontFamily: mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#999',
    fontWeight: 600,
    textAlign: 'right',
    borderBottom: `1px solid ${C_RULE}`,
  }
  const thLeftStyle: React.CSSProperties = { ...thStyle, textAlign: 'left' }

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Dark green header */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 32px 56px' }}>
          <Link
            href="/stats"
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.55)',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            ← Statistics
          </Link>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>
              — Player
            </div>
            <h1 style={{
              fontFamily: display,
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.92,
              letterSpacing: -3,
              margin: '12px 0 0',
            }}>
              {player.name}.
            </h1>
          </div>

          {/* Career stat strip */}
          <div style={{ marginTop: 40, display: 'flex', gap: 32, flexWrap: 'wrap', paddingTop: 32, borderTop: '1px solid rgba(255,255,255,.15)' }}>
            <StatTile label="Matches" value={String(careerMatches)} />
            <StatTile label="Runs" value={String(careerRuns)} sub={`HS ${careerHS} · Avg ${fmtAvg(careerRuns, careerInns, careerNO)}`} />
            <StatTile label="50s / 100s" value={`${career50s}/${career100s}`} />
            <StatTile label="Wickets" value={String(careerWkts)} sub={`Best ${careerBestWkts}/${careerBestRuns === 999 ? 0 : careerBestRuns} · Avg ${fmtBowlAvg(careerBowlRuns, careerWkts)}`} />
            <StatTile label="Econ" value={fmtEcon(careerBowlRuns, careerOvers)} />
            <div style={{ paddingLeft: 4 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Catches</div>
              <div style={{ fontFamily: display, fontSize: 40, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{catches}</div>
              <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 4 }}>RO {runOuts} · St {stumpings}</div>
            </div>
          </div>
        </div>
      </div>

      <CContainer>
        {/* Batting by Season */}
        {batSeasons.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— Batting</div>
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, marginTop: 4 }}>
                Season by season.
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: '#aaa', textTransform: 'uppercase', fontWeight: 400, fontStyle: 'normal', marginLeft: 12 }}>
                  click to expand innings
                </span>
              </div>
            </div>
            <CCard padding="0">
              {/* Table header */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C_RULE}` }}>
                      <th style={thLeftStyle}>Season</th>
                      <th style={thStyle}>Inn</th>
                      <th style={thStyle}>NO</th>
                      <th style={thStyle}>Runs</th>
                      <th style={thStyle}>HS</th>
                      <th style={thStyle}>Avg</th>
                      <th style={thStyle}>50/100</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batSeasons.map((s) => {
                      const a = batBySeason.get(s)!
                      const tdStyle: React.CSSProperties = {
                        padding: '11px 14px',
                        textAlign: 'right',
                        fontFamily: mono,
                        fontSize: 13,
                        color: '#666',
                        borderBottom: `1px dashed ${C_RULE}`,
                      }
                      return (
                        <tr key={`bat-${s}`} style={{ cursor: 'pointer' }}>
                            <td style={{ ...tdStyle, textAlign: 'left' }}>
                              <details>
                                <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontFamily: mono, fontSize: 11, color: '#bbb', display: 'inline-block', width: 10 }}>▸</span>
                                  <span style={{ fontFamily: display, fontSize: 15, fontWeight: 500 }}>{s}</span>
                                </summary>
                                {/* Expanded innings */}
                                <div style={{ paddingTop: 8, paddingBottom: 4 }}>
                                  {a.rows
                                    .slice()
                                    .sort((x, y) => (getMatchDate(y.match_id) || '').localeCompare(getMatchDate(x.match_id) || ''))
                                    .map((row, i) => {
                                      const fid = getFixtureId(row.match_id)
                                      const isNotOut = !row.how_out || (row.how_out ?? '').toLowerCase() === 'not out'
                                      const content = (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px' }}>
                                          <div style={{ fontFamily: mono, fontSize: 11, color: '#bbb', minWidth: 76 }}>
                                            {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                                          </div>
                                          <div style={{ flex: 1, fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            vs {getOpponent(row.match_id)}
                                          </div>
                                          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C_GREEN, minWidth: 32, textAlign: 'right' }}>
                                            {row.runs ?? '−'}
                                            {isNotOut && row.runs != null && <span style={{ fontSize: 10, color: C_GREEN_LT }}>*</span>}
                                          </div>
                                          <div style={{ fontFamily: mono, fontSize: 11, color: '#999', maxWidth: 140, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {isNotOut ? <span style={{ color: C_GREEN_LT }}>not out</span> : <>b {row.bowler_name ?? '−'}</>}
                                          </div>
                                        </div>
                                      )
                                      return fid ? (
                                        <Link
                                          key={i}
                                          href={`/fixtures/${fid}`}
                                          style={{ display: 'block', textDecoration: 'none', color: 'inherit', borderRadius: 2 }}
                                        >
                                          {content}
                                        </Link>
                                      ) : (
                                        <div key={i}>{content}</div>
                                      )
                                    })}
                                </div>
                              </details>
                            </td>
                            <td style={tdStyle}>{a.inns}</td>
                            <td style={tdStyle}>{a.notOut}</td>
                            <td style={{ ...tdStyle, fontFamily: mono, fontWeight: 700, color: C_GREEN }}>{a.runs}</td>
                            <td style={tdStyle}>{a.hs}</td>
                            <td style={tdStyle}>{fmtAvg(a.runs, a.inns, a.notOut)}</td>
                            <td style={tdStyle}>{a.fifties}/{a.hundreds}</td>
                          </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CCard>
          </section>
        )}

        {/* Bowling by Season */}
        {bowlSeasons.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— Bowling</div>
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, marginTop: 4 }}>
                Season by season.
                <span style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, color: '#aaa', textTransform: 'uppercase', fontWeight: 400, fontStyle: 'normal', marginLeft: 12 }}>
                  click to expand spells
                </span>
              </div>
            </div>
            <CCard padding="0">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C_RULE}` }}>
                      <th style={thLeftStyle}>Season</th>
                      <th style={thStyle}>O</th>
                      <th style={thStyle}>R</th>
                      <th style={thStyle}>W</th>
                      <th style={thStyle}>Best</th>
                      <th style={thStyle}>Avg</th>
                      <th style={thStyle}>Econ</th>
                      <th style={thStyle}>5W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bowlSeasons.map((s) => {
                      const a = bowlBySeason.get(s)!
                      const tdStyle: React.CSSProperties = {
                        padding: '11px 14px',
                        textAlign: 'right',
                        fontFamily: mono,
                        fontSize: 13,
                        color: '#666',
                        borderBottom: `1px dashed ${C_RULE}`,
                      }
                      return (
                        <tr key={s}>
                          <td style={{ ...tdStyle, textAlign: 'left' }}>
                            <details>
                              <summary style={{ listStyle: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontFamily: mono, fontSize: 11, color: '#bbb', display: 'inline-block', width: 10 }}>▸</span>
                                <span style={{ fontFamily: display, fontSize: 15, fontWeight: 500 }}>{s}</span>
                              </summary>
                              <div style={{ paddingTop: 8, paddingBottom: 4 }}>
                                {a.rows
                                  .slice()
                                  .sort((x, y) => (getMatchDate(y.match_id) || '').localeCompare(getMatchDate(x.match_id) || ''))
                                  .map((row, i) => {
                                    const fid = getFixtureId(row.match_id)
                                    const content = (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 4px' }}>
                                        <div style={{ fontFamily: mono, fontSize: 11, color: '#bbb', minWidth: 76 }}>
                                          {getMatchDate(row.match_id) ? fmtDate(getMatchDate(row.match_id)) : '−'}
                                        </div>
                                        <div style={{ flex: 1, fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          vs {getOpponent(row.match_id)}
                                        </div>
                                        <div style={{ fontFamily: mono, fontSize: 13, color: '#555' }}>
                                          {formatOvers(row.overs ?? 0)}-{row.maidens ?? 0}-{row.runs ?? 0}-
                                          <span style={{ fontWeight: 700, color: C_RED }}>{row.wickets ?? 0}</span>
                                        </div>
                                      </div>
                                    )
                                    return fid ? (
                                      <Link
                                        key={i}
                                        href={`/fixtures/${fid}`}
                                        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                                      >
                                        {content}
                                      </Link>
                                    ) : (
                                      <div key={i}>{content}</div>
                                    )
                                  })}
                              </div>
                            </details>
                          </td>
                          <td style={tdStyle}>{formatOvers(a.overs)}</td>
                          <td style={tdStyle}>{a.runs}</td>
                          <td style={{ ...tdStyle, fontWeight: 700, color: C_RED }}>{a.wickets}</td>
                          <td style={tdStyle}>{a.bestWkts}/{a.bestRuns === 999 ? 0 : a.bestRuns}</td>
                          <td style={tdStyle}>{fmtBowlAvg(a.runs, a.wickets)}</td>
                          <td style={tdStyle}>{fmtEcon(a.runs, a.overs)}</td>
                          <td style={tdStyle}>{a.fiveWs}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CCard>
          </section>
        )}

        {careerMatches === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontFamily: display, fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>
              No scorecard data found for {player.name}.
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              Data populates as matches are synced from Play-Cricket.
            </div>
          </div>
        )}
      </CContainer>
    </div>
  )
}
