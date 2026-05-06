import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'
import { formatOvers } from '@/lib/play-cricket'
import { todayLondon } from '@/lib/london-time'
import CScorecardTabs, {
  type InningsView,
  type ScBat,
  type ScBowl,
} from '@/components/c/CScorecardTabs'
import {
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from '@/lib/c-theme/tokens'
import {
  CKicker,
  CContainer,
  CCard,
  CHomeAwayChip,
  CResultPill,
  CDateStack,
  CBigNumber,
  CVs,
  CMonoLabel,
} from '@/components/c/primitives'

export const dynamic = 'force-dynamic'

const OUR_CLUB_ID = '9754'

function fmtFullDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

function fmtShortDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function fullTeamName(
  club: string | null | undefined,
  team: string | null | undefined,
  fallback: string,
) {
  if (club && team) return `${club} - ${team}`
  return team || club || fallback
}

function sumRuns(rows: ScBat[]): number {
  return rows.reduce((s, r) => s + (r.runs ?? 0), 0)
}

function countDismissals(rows: ScBat[]): number {
  return rows.filter((r) => {
    const h = (r.how_out ?? '').toLowerCase()
    return h && h !== 'not out' && h !== 'did not bat'
  }).length
}

function sanitiseMatchNotes(raw: string): string {
  const esc = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/&lt;br\s*\/?&gt;/gi, '<br/>')
    .replace(/&lt;b&gt;/gi, '<b style="font-weight:700">')
    .replace(/&lt;\/b&gt;/gi, '</b>')
}

export default async function CFixtureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)
  if (isNaN(fixtureId)) notFound()

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', fixtureId)
    .single()
  if (!fixture) notFound()

  const pcMatchId = fixture.play_cricket_match_id
  const { data: scorecard } = pcMatchId
    ? await supabase
        .from('match_scorecards')
        .select('*')
        .eq('match_id', pcMatchId)
        .single()
    : { data: null }

  const { data: battingRaw } = pcMatchId
    ? await supabase
        .from('batting_entries')
        .select(
          'team_batting_id, innings_number, position, batsman_name, batsman_id, how_out, fielder_name, bowler_name, runs, fours, sixes, balls',
        )
        .eq('match_id', pcMatchId)
        .order('team_batting_id', { ascending: true })
        .order('innings_number', { ascending: true })
        .order('position', { ascending: true, nullsFirst: false })
    : { data: [] }

  const { data: bowlingRaw } = pcMatchId
    ? await supabase
        .from('bowling_entries')
        .select(
          'team_bowling_id, innings_number, bowler_name, bowler_id, overs, maidens, runs, wickets',
        )
        .eq('match_id', pcMatchId)
        .order('team_bowling_id', { ascending: true })
        .order('innings_number', { ascending: true })
    : { data: [] }

  // Group batting by team_batting_id
  const batByTeam = new Map<string, ScBat[]>()
  for (const b of battingRaw ?? []) {
    const key = b.team_batting_id ?? ''
    if (!key) continue
    const arr = batByTeam.get(key) ?? []
    arr.push({
      position: b.position,
      batsman_name: b.batsman_name,
      batsman_id: b.batsman_id,
      how_out: b.how_out,
      fielder_name: b.fielder_name,
      bowler_name: b.bowler_name,
      runs: b.runs,
      fours: b.fours,
      sixes: b.sixes,
      balls: b.balls,
    })
    batByTeam.set(key, arr)
  }

  // Group bowling by team_bowling_id
  const bowlByTeam = new Map<string, ScBowl[]>()
  for (const b of bowlingRaw ?? []) {
    const key = b.team_bowling_id ?? ''
    if (!key) continue
    const arr = bowlByTeam.get(key) ?? []
    arr.push({
      bowler_name: b.bowler_name,
      bowler_id: b.bowler_id,
      overs: b.overs,
      maidens: b.maidens,
      runs: b.runs,
      wickets: b.wickets,
    })
    bowlByTeam.set(key, arr)
  }

  // Build team list
  type TeamMeta = { id: string; clubName: string; teamName: string; fullName: string }
  const teams: TeamMeta[] = []
  if (scorecard?.home_team_id) {
    teams.push({
      id: scorecard.home_team_id,
      clubName: scorecard.home_club_name ?? 'Home',
      teamName: scorecard.home_team_name ?? '',
      fullName: fullTeamName(scorecard.home_club_name, scorecard.home_team_name, 'Home'),
    })
  }
  if (scorecard?.away_team_id) {
    teams.push({
      id: scorecard.away_team_id,
      clubName: scorecard.away_club_name ?? 'Away',
      teamName: scorecard.away_team_name ?? '',
      fullName: fullTeamName(scorecard.away_club_name, scorecard.away_team_name, 'Away'),
    })
  }

  const battedFirstId = scorecard?.batted_first_team_id ?? null
  const orderedTeams = [...teams].sort((a, b) => {
    if (battedFirstId && a.id === battedFirstId) return -1
    if (battedFirstId && b.id === battedFirstId) return 1
    return 0
  })

  const teamMeta: Record<string, { captainId: string | null; keeperId: string | null }> = {}
  if (scorecard?.home_team_id) {
    teamMeta[scorecard.home_team_id] = {
      captainId: scorecard.home_captain_id ?? null,
      keeperId: scorecard.home_wicket_keeper_id ?? null,
    }
  }
  if (scorecard?.away_team_id) {
    teamMeta[scorecard.away_team_id] = {
      captainId: scorecard.away_captain_id ?? null,
      keeperId: scorecard.away_wicket_keeper_id ?? null,
    }
  }

  const extrasByTeam = (scorecard?.extras ?? {}) as Record<string, NonNullable<InningsView['extras']>>
  const fowByTeam = (scorecard?.fow ?? {}) as Record<string, InningsView['fow']>

  const views: InningsView[] = orderedTeams.map((battingTeam) => {
    const other = teams.find((t) => t.id !== battingTeam.id)
    const batRows = batByTeam.get(battingTeam.id) ?? []
    const bowlRows = other ? bowlByTeam.get(other.id) ?? [] : []

    const isOurs = scorecard?.our_team_id === battingTeam.id
    const totalRuns = isOurs
      ? scorecard?.our_runs ?? sumRuns(batRows)
      : scorecard?.opp_runs ?? sumRuns(batRows)
    const totalWickets = isOurs
      ? scorecard?.our_wickets ?? countDismissals(batRows)
      : scorecard?.opp_wickets ?? countDismissals(batRows)
    const totalOvers = isOurs
      ? scorecard?.our_overs ?? null
      : scorecard?.opp_overs ?? null

    return {
      key: battingTeam.id,
      battingTeam: battingTeam.fullName,
      bowlingTeam: other?.fullName ?? 'Bowling',
      shortTab: `${battingTeam.clubName} batting`,
      totalRuns,
      totalWickets,
      totalOvers,
      batting: batRows,
      bowling: bowlRows,
      battingCaptainId: teamMeta[battingTeam.id]?.captainId ?? null,
      battingKeeperId: teamMeta[battingTeam.id]?.keeperId ?? null,
      bowlingCaptainId: other ? teamMeta[other.id]?.captainId ?? null : null,
      bowlingKeeperId: other ? teamMeta[other.id]?.keeperId ?? null : null,
      extras: extrasByTeam[battingTeam.id] ?? null,
      fow: fowByTeam[battingTeam.id] ?? [],
    }
  })

  const ourBatIdx = views.findIndex((v) => v.key === scorecard?.our_team_id)
  const defaultIdx = ourBatIdx >= 0 ? ourBatIdx : 0

  const isPast = fixture.match_date < todayLondon()
  const hasScorecard = scorecard && views.length > 0

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Hero header — dark green band */}
      <div style={{ background: C_GREEN, color: '#fff', padding: '40px 32px 36px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          {/* Back link */}
          <Link
            href={`/fixtures?season=${fixture.season}`}
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            ← {fixture.season} Fixtures
          </Link>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
              marginTop: 20,
            }}
          >
            <div style={{ flex: '1 1 340px', minWidth: 0 }}>
              {/* Date kicker */}
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: C_RED,
                  fontWeight: 700,
                  marginBottom: 10,
                }}
              >
                — {fmtFullDate(fixture.match_date)}
              </div>

              {/* Big opponent headline */}
              <h1
                style={{
                  fontFamily: display,
                  fontSize: 'clamp(32px, 6vw, 72px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  lineHeight: 0.92,
                  letterSpacing: -2,
                  color: '#fff',
                  margin: 0,
                }}
              >
                <span style={{ fontStyle: 'normal', opacity: 0.55, fontWeight: 300 }}>v.</span>{' '}
                {fixture.opponent}
              </h1>

              {/* Chips row */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 20,
                }}
              >
                <CHomeAwayChip homeAway={fixture.home_away} />
                {fixture.competition && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: 'rgba(255,255,255,.55)',
                      fontWeight: 600,
                    }}
                  >
                    {fixture.competition}
                  </span>
                )}
                <Link
                  href={`/clubs/${clubSlug(fixture.opponent)}`}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.5)',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  All results vs {fixture.opponent} →
                </Link>
              </div>
            </div>

            {/* Result pill (past) or date stack (upcoming) */}
            <div style={{ flexShrink: 0 }}>
              {fixture.result_text ? (
                <div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 'clamp(40px, 7vw, 80px)',
                      fontWeight: 500,
                      fontStyle: 'italic',
                      lineHeight: 1,
                      letterSpacing: -2,
                      color:
                        fixture.result_text === 'Won'
                          ? '#7ee8aa'
                          : fixture.result_text === 'Lost'
                          ? '#f89ea2'
                          : 'rgba(255,255,255,.7)',
                    }}
                  >
                    {fixture.result_text}.
                  </div>
                </div>
              ) : (
                <div style={{ color: '#fff' }}>
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: C_RED,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    Date
                  </div>
                  <CDateStack dateStr={fixture.match_date} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 32px' }}>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>
          {/* Main column */}
          <div>
            {/* PAST WITH SCORECARD */}
            {isPast && hasScorecard && (
              <>
                {/* Score summary block */}
                <div
                  style={{
                    background: '#fff',
                    border: `1px solid ${C_RULE}`,
                    padding: '20px 24px',
                    marginBottom: 32,
                  }}
                >
                  {/* Score rows */}
                  {views.map((v) => {
                    const isOurs = v.key === scorecard?.our_team_id
                    return (
                      <div
                        key={v.key}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          borderBottom: `1px dashed ${C_RULE}`,
                        }}
                      >
                        <div
                          style={{
                            fontFamily: display,
                            fontSize: isOurs ? 18 : 16,
                            fontWeight: isOurs ? 600 : 400,
                            color: isOurs ? C_INK : '#666',
                          }}
                        >
                          {v.battingTeam}
                        </div>
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: isOurs ? 20 : 17,
                            fontWeight: 700,
                            color: isOurs ? C_INK : '#888',
                          }}
                        >
                          {v.totalRuns}
                          <span style={{ color: '#bbb' }}>/{v.totalWickets}</span>
                          {v.totalOvers != null && v.totalOvers > 0 && (
                            <span
                              style={{
                                fontFamily: mono,
                                fontSize: 12,
                                color: '#aaa',
                                fontWeight: 400,
                                marginLeft: 6,
                              }}
                            >
                              ({formatOvers(v.totalOvers)} ov)
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Toss / format notes */}
                  <div style={{ paddingTop: 14, fontSize: 13, color: '#888', lineHeight: 1.7 }}>
                    {scorecard.toss_won_by_team_id && (
                      <div>
                        <span style={{ color: '#555', fontWeight: 600 }}>
                          {teams.find((t) => t.id === scorecard.toss_won_by_team_id)?.fullName ?? 'Unknown'}
                        </span>{' '}
                        won the toss.
                      </div>
                    )}
                    {scorecard.batted_first_team_id && (
                      <div>
                        <span style={{ color: '#555', fontWeight: 600 }}>
                          {teams.find((t) => t.id === scorecard.batted_first_team_id)?.fullName ?? 'Unknown'}
                        </span>{' '}
                        batted first.
                      </div>
                    )}
                    {scorecard.no_of_overs && (
                      <div>{scorecard.no_of_overs} overs per side.</div>
                    )}
                  </div>

                  {/* Match notes */}
                  {scorecard.match_notes && (
                    <details style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C_RULE}` }}>
                      <summary
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          letterSpacing: 2,
                          textTransform: 'uppercase',
                          color: C_RED,
                          fontWeight: 700,
                          cursor: 'pointer',
                          listStyle: 'none',
                        }}
                      >
                        Match flow &amp; milestones ▸
                      </summary>
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 12,
                          color: '#666',
                          lineHeight: 1.7,
                          fontFamily: mono,
                          whiteSpace: 'pre-line',
                        }}
                        dangerouslySetInnerHTML={{
                          __html: sanitiseMatchNotes(scorecard.match_notes),
                        }}
                      />
                    </details>
                  )}
                </div>

                {/* Innings tabs */}
                <CScorecardTabs views={views} defaultIndex={defaultIdx} />
              </>
            )}

            {/* PAST WITHOUT SCORECARD */}
            {isPast && !hasScorecard && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '64px 32px',
                  border: `1px dashed ${C_RULE}`,
                  color: '#aaa',
                }}
              >
                <div style={{ fontFamily: display, fontSize: 28, fontStyle: 'italic' }}>
                  Scorecard not yet available.
                </div>
                <div style={{ fontSize: 14, marginTop: 8 }}>
                  Scorecards sync within a day or two of the match.
                </div>
                {pcMatchId && (
                  <a
                    href={`https://stlawrence.play-cricket.com/website/results/${pcMatchId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: 20,
                      fontFamily: mono,
                      fontSize: 11,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: C_RED,
                      textDecoration: 'none',
                      fontWeight: 700,
                    }}
                  >
                    View on Play-Cricket →
                  </a>
                )}
              </div>
            )}

            {/* UPCOMING */}
            {!isPast && (
              <div>
                {/* Meet / start times */}
                {(fixture.start_time || fixture.meet_time) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 32,
                      background: C_GREEN,
                      padding: '24px 28px',
                      marginBottom: 24,
                      flexWrap: 'wrap',
                    }}
                  >
                    {fixture.start_time && (
                      <CBigNumber
                        label="Start"
                        value={fixture.start_time.slice(0, 5)}
                        color="#fff"
                        labelColor="rgba(255,255,255,.5)"
                      />
                    )}
                    {fixture.meet_time && (
                      <CBigNumber
                        label="Meet"
                        value={fixture.meet_time.slice(0, 5)}
                        color="#fff"
                        labelColor="rgba(255,255,255,.5)"
                      />
                    )}
                    <CBigNumber
                      label="Venue"
                      value={fixture.home_away === 'H' ? 'Home' : 'Away'}
                      small={fixture.home_away === 'H' ? 'Bitchet Green' : fixture.venue}
                      color="#fff"
                      labelColor="rgba(255,255,255,.5)"
                    />
                  </div>
                )}

                {/* Ground + map */}
                {fixture.venue && (
                  <div
                    style={{
                      background: '#fff',
                      border: `1px solid ${C_RULE}`,
                      marginBottom: 24,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ padding: '18px 22px' }}>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          letterSpacing: 2.5,
                          textTransform: 'uppercase',
                          color: '#aaa',
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        Ground
                      </div>
                      <div style={{ fontFamily: display, fontSize: 20, fontWeight: 500 }}>
                        {fixture.venue}
                      </div>
                    </div>
                    {fixture.lat && fixture.lng && (
                      <iframe
                        title="Ground map"
                        width="100%"
                        height="260"
                        style={{ border: 0, display: 'block' }}
                        loading="lazy"
                        src={`https://maps.google.com/maps?q=${fixture.lat},${fixture.lng}&z=14&output=embed`}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* H2H card for upcoming */}
            {!isPast && (
              <div
                style={{
                  background: '#fff',
                  border: `1px solid ${C_RULE}`,
                  padding: '20px 22px',
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: 2.5,
                    textTransform: 'uppercase',
                    color: '#aaa',
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  Head to Head
                </div>
                <div style={{ fontFamily: display, fontSize: 20, fontWeight: 500, marginBottom: 6 }}>
                  <CVs /> {fixture.opponent}
                </div>
                <Link
                  href={`/clubs/${clubSlug(fixture.opponent)}`}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: C_RED,
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  View all previous meetings →
                </Link>
              </div>
            )}

            {/* Match info card */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                padding: '20px 22px',
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: '#aaa',
                  fontWeight: 600,
                  marginBottom: 14,
                  borderBottom: `1px solid ${C_RULE}`,
                  paddingBottom: 10,
                }}
              >
                Match Info
              </div>
              {[
                { label: 'Date', value: fmtShortDate(fixture.match_date) },
                { label: 'Season', value: String(fixture.season) },
                fixture.competition ? { label: 'Competition', value: fixture.competition } : null,
                { label: 'Venue', value: fixture.venue },
                {
                  label: 'Home/Away',
                  value: fixture.home_away === 'H' ? 'Home' : 'Away',
                },
              ]
                .filter(Boolean)
                .map((item) =>
                  item ? (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: 12,
                        padding: '8px 0',
                        borderBottom: `1px dashed ${C_RULE}`,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          color: '#aaa',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          color: C_INK,
                          fontWeight: 500,
                          textAlign: 'right',
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ) : null,
                )}
            </div>

            {/* Play-Cricket link */}
            {pcMatchId && (
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <a
                  href={`https://stlawrence.play-cricket.com/website/results/${pcMatchId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: '#aaa',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  View on Play-Cricket →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .detail-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .detail-grid { padding: 24px 16px !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  )
}
