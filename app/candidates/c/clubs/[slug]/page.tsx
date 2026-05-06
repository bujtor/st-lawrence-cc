import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'
import {
  CKicker,
  CCard,
  CFormChip,
  CMonoLabel,
  CDateStack,
  CResultPill,
  CHomeAwayChip,
  CVs,
  CContainer,
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_INK,
  C_RULE,
  display,
  mono,
  sansTight,
} from '../../_components/primitives'

export const dynamic = 'force-dynamic'

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

type TopBat = { batsman_name: string | null; runs: number | null; match_id: number | null }
type TopBowl = { bowler_name: string | null; wickets: number | null; runs: number | null; match_id: number | null }

function resultLetter(r: string | null): 'W' | 'L' | 'T' | 'D' | 'A' | '?' {
  if (r === 'Won') return 'W'
  if (r === 'Lost') return 'L'
  if (r === 'Tied') return 'T'
  if (r === 'Drew') return 'D'
  if (r === 'Abandoned') return 'A'
  return '?'
}

function fmtYear(d: string): string {
  return new Date(d + 'T00:00:00').getFullYear().toString()
}

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: allFixtures } = await supabase
    .from('fixtures')
    .select('id, match_date, opponent, venue, home_away, result_text, competition, play_cricket_match_id, season')
    .order('match_date', { ascending: false })

  const allOpponents = new Set<string>()
  for (const f of allFixtures ?? []) {
    if (f.opponent) allOpponents.add(f.opponent)
  }

  const matchedOpponent = Array.from(allOpponents).find(
    name => clubSlug(name) === slug
  )

  if (!matchedOpponent) notFound()

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

  const winPct = played > 0 ? Math.round((won / played) * 100) : 0
  const firstMeeting = fixtures.length > 0 ? fixtures[fixtures.length - 1].match_date : null
  const lastMeeting = fixtures.length > 0 ? fixtures[0].match_date : null

  const matchIds = fixtures
    .map((f: FixtureRow) => f.play_cricket_match_id)
    .filter((x): x is number => typeof x === 'number')

  let ourTopBatter: TopBat | undefined
  let ourTopBowler: TopBowl | undefined
  let theirTopBatter: TopBat | undefined

  if (matchIds.length > 0) {
    const { data: ourBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_batsman', true)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)
    ourTopBatter = ourBat?.[0] as TopBat | undefined

    const { data: ourBowl } = await supabase
      .from('bowling_entries')
      .select('bowler_name, wickets, runs, overs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_bowler', true)
      .order('wickets', { ascending: false, nullsFirst: false })
      .order('runs', { ascending: true, nullsFirst: false })
      .limit(1)
    ourTopBowler = ourBowl?.[0] as TopBowl | undefined

    const { data: theirBat } = await supabase
      .from('batting_entries')
      .select('batsman_name, runs, match_id')
      .in('match_id', matchIds)
      .eq('is_our_batsman', false)
      .order('runs', { ascending: false, nullsFirst: false })
      .limit(1)
    theirTopBatter = theirBat?.[0] as TopBat | undefined
  }

  const fixtureByMatchId = new Map<number, FixtureRow>()
  for (const f of fixtures) {
    if (f.play_cricket_match_id) fixtureByMatchId.set(f.play_cricket_match_id, f)
  }

  // Last 5 form letters
  const recentForm = fixtures.slice(0, 5).map(f => resultLetter(f.result_text))

  // Group fixtures by season (year) for display
  const bySeason = new Map<number, FixtureRow[]>()
  for (const f of fixtures) {
    const yr = f.season ?? new Date(f.match_date + 'T00:00:00').getFullYear()
    if (!bySeason.has(yr)) bySeason.set(yr, [])
    bySeason.get(yr)!.push(f)
  }
  const seasons = Array.from(bySeason.keys()).sort((a, b) => b - a)

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Dark header band */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <CContainer padding="56px 32px 48px">
          <Link
            href="/candidates/c/clubs"
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,.55)',
              textDecoration: 'none',
              fontWeight: 700,
              display: 'inline-block',
              marginBottom: 20,
            }}
          >
            ← All Opponents
          </Link>
          <CKicker color={C_RED}>Opponents</CKicker>
          <h1
            style={{
              fontFamily: display,
              fontSize: 'clamp(40px, 7vw, 88px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.9,
              letterSpacing: -3,
              color: '#fff',
              margin: '14px 0 0',
            }}
          >
            <span style={{ opacity: 0.55, fontWeight: 300 }}>v.</span> {matchedOpponent}.
          </h1>

          {/* Recent form strip */}
          {recentForm.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24 }}>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.5)',
                }}
              >
                Last {recentForm.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {recentForm.map((letter, i) => (
                  <CFormChip key={i} letter={letter} size={28} />
                ))}
              </div>
            </div>
          )}
        </CContainer>
      </div>

      <CContainer padding="48px 32px 80px">
        {/* Summary stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            gap: 1,
            background: C_RULE,
            border: `1px solid ${C_RULE}`,
            marginBottom: 48,
          }}
          className="stats-grid"
        >
          {[
            { label: 'Played', value: String(played), color: C_INK },
            { label: 'Won', value: String(won), color: C_GREEN_LT },
            { label: 'Lost', value: String(lost), color: C_RED },
            { label: 'Drawn', value: String(drew), color: '#888' },
            { label: 'Win %', value: `${winPct}%`, color: winPct >= 50 ? C_GREEN_LT : winPct === 0 ? C_RED : '#888' },
            {
              label: 'Since',
              value: firstMeeting ? fmtYear(firstMeeting) : '—',
              color: '#555',
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: '#fff',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <CMonoLabel color="#999">{label}</CMonoLabel>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 40,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: -1,
                  color,
                  marginTop: 6,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Notable performances */}
        {(ourTopBatter || ourTopBowler || theirTopBatter) && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ borderTop: `2px solid ${C_INK}`, paddingTop: 20, marginBottom: 20 }}>
              <CKicker color="#888">Notable Performances</CKicker>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 16,
              }}
              className="perf-grid"
            >
              {ourTopBatter && (
                <CCard padding="20px 22px">
                  <CMonoLabel color={C_GREEN_LT} size={9}>Our top score</CMonoLabel>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 18,
                      fontWeight: 500,
                      marginTop: 8,
                      letterSpacing: -0.3,
                    }}
                  >
                    {ourTopBatter.batsman_name ?? 'Unknown'}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 44,
                      fontWeight: 500,
                      lineHeight: 1,
                      color: C_GREEN_LT,
                      letterSpacing: -1.5,
                      marginTop: 4,
                    }}
                  >
                    {ourTopBatter.runs ?? 0}
                  </div>
                  {ourTopBatter.match_id && fixtureByMatchId.has(ourTopBatter.match_id) && (
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#999', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {new Date(fixtureByMatchId.get(ourTopBatter.match_id)!.match_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </CCard>
              )}
              {ourTopBowler && (
                <CCard padding="20px 22px">
                  <CMonoLabel color={C_GREEN_LT} size={9}>Our best bowling</CMonoLabel>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 18,
                      fontWeight: 500,
                      marginTop: 8,
                      letterSpacing: -0.3,
                    }}
                  >
                    {ourTopBowler.bowler_name ?? 'Unknown'}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 44,
                      fontWeight: 500,
                      lineHeight: 1,
                      color: C_GREEN_LT,
                      letterSpacing: -1.5,
                      marginTop: 4,
                    }}
                  >
                    {ourTopBowler.wickets ?? 0}&ndash;{ourTopBowler.runs ?? 0}
                  </div>
                  {ourTopBowler.match_id && fixtureByMatchId.has(ourTopBowler.match_id) && (
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#999', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {new Date(fixtureByMatchId.get(ourTopBowler.match_id)!.match_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </CCard>
              )}
              {theirTopBatter && (
                <CCard padding="20px 22px">
                  <CMonoLabel color="#999" size={9}>Their highest vs us</CMonoLabel>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 18,
                      fontWeight: 500,
                      marginTop: 8,
                      letterSpacing: -0.3,
                      color: '#555',
                    }}
                  >
                    {theirTopBatter.batsman_name ?? 'Unknown'}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 44,
                      fontWeight: 500,
                      lineHeight: 1,
                      color: C_RED,
                      letterSpacing: -1.5,
                      marginTop: 4,
                    }}
                  >
                    {theirTopBatter.runs ?? 0}
                  </div>
                  {theirTopBatter.match_id && fixtureByMatchId.has(theirTopBatter.match_id) && (
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#999', marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {new Date(fixtureByMatchId.get(theirTopBatter.match_id)!.match_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </CCard>
              )}
            </div>
          </section>
        )}

        {/* Match history grouped by season */}
        <section>
          <div style={{ borderTop: `2px solid ${C_INK}`, paddingTop: 20, marginBottom: 8 }}>
            <CKicker color="#888">Past Meetings · {played} match{played !== 1 ? 'es' : ''}</CKicker>
          </div>

          {seasons.map(yr => {
            const seasonFixtures = bySeason.get(yr) ?? []
            return (
              <div key={yr} style={{ marginTop: 32 }}>
                {/* Season year kicker */}
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: '#aaa',
                    borderBottom: `1px solid ${C_RULE}`,
                    paddingBottom: 6,
                    marginBottom: 0,
                  }}
                >
                  {yr} Season
                </div>
                {seasonFixtures.map((f: FixtureRow) => {
                  const hasScorecard = !!f.play_cricket_match_id

                  const rowContent = (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '56px 1fr auto',
                        gap: 20,
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: `1px dashed ${C_RULE}`,
                      }}
                    >
                      {/* Date stack */}
                      <CDateStack dateStr={f.match_date} />

                      {/* Match info */}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontFamily: display,
                            fontSize: 18,
                            fontWeight: 500,
                            letterSpacing: -0.3,
                            lineHeight: 1.2,
                          }}
                        >
                          <CVs /> {f.opponent}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginTop: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          <CHomeAwayChip homeAway={f.home_away} />
                          {f.venue && (
                            <span style={{ fontFamily: mono, fontSize: 10, color: '#999', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                              {f.venue}
                            </span>
                          )}
                          {f.competition && (
                            <span style={{ fontFamily: mono, fontSize: 10, color: '#bbb', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                              {f.competition}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Result + scorecard link */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {f.result_text && <CResultPill result={f.result_text} />}
                        {hasScorecard && (
                          <div
                            style={{
                              fontFamily: mono,
                              fontSize: 10,
                              color: C_RED,
                              letterSpacing: 2,
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              marginTop: 6,
                            }}
                          >
                            Scorecard →
                          </div>
                        )}
                      </div>
                    </div>
                  )

                  return hasScorecard ? (
                    <Link
                      key={f.id}
                      href={`/candidates/c/fixtures/${f.id}`}
                      style={{ textDecoration: 'none', color: C_INK, display: 'block' }}
                      className="match-row-link"
                    >
                      {rowContent}
                    </Link>
                  ) : (
                    <div key={f.id}>{rowContent}</div>
                  )
                })}
              </div>
            )
          })}

          {fixtures.length === 0 && (
            <div style={{ padding: '32px 0', color: '#888', fontSize: 14 }}>
              No completed matches recorded yet.
            </div>
          )}
        </section>
      </CContainer>

      <style>{`
        .match-row-link:hover { background: rgba(13,59,39,.04); }
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .perf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
