import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Fixture } from '@/lib/supabase'
import { aggregateBatting, aggregateBowling, type BatRow, type BowlRow } from '@/lib/aggregations'
import { fetchRecentForm, formLetter } from '@/lib/recent-form'
import { todayLondon } from '@/lib/london-time'
import {
  CKicker,
  CEditorialHeader,
  CStat,
  CBigNumber,
  CFormChip,
  CHomeAwayChip,
  CVs,
  CCard,
} from './_components/primitives'
import {
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from './_theme/tokens'

export const dynamic = 'force-dynamic'

const sponsors = [
  { name: 'Barber Jack', file: 'barber-jack.png' },
  { name: 'JML', file: 'jml.jpeg' },
  { name: 'Regal Point', file: 'regal-point.jpg' },
  { name: 'Gulliver', file: 'gulliver.png' },
  { name: 'Savills', file: 'savills.png' },
  { name: 'Harding Motors', file: null as string | null },
]

function fmtDayNum(d: string) {
  return new Date(d + 'T00:00:00').getDate()
}
function fmtWeekday(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
}
function fmtMonth(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })
}
function fmtFull(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
function fmtShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default async function CandidateCHome() {
  const today = todayLondon()
  const currentYear = new Date().getFullYear()

  // Fixtures: next, upcoming, last result
  const { data: nextFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(1)

  const { data: lastResults } = await supabase
    .from('fixtures')
    .select('*')
    .lt('match_date', today)
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1)

  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(5)

  const next = nextFixtures?.[0] ?? null
  const last = lastResults?.[0] ?? null
  const upcoming: Fixture[] = upcomingFixtures ?? []

  // Recent form across all seasons (overall WLWLW chip strip)
  const recent = await fetchRecentForm(5)
  const recentLetters = recent.map((r) => formLetter(r.result_text))

  // Win/Loss for this season — used in the hero stat
  const { data: thisSeasonScorecards } = await supabase
    .from('match_scorecards')
    .select('result_text')
    .eq('season', currentYear)
  const sw = (thisSeasonScorecards ?? []).filter((s) => s.result_text === 'Won').length
  const sl = (thisSeasonScorecards ?? []).filter((s) => s.result_text === 'Lost').length
  const seasonsCount = currentYear - 1877 + 1

  // Top batters / bowlers — same query as /stats page, current season only
  const { data: battingRaw } = await supabase
    .from('batting_entries')
    .select('batsman_name, batsman_id, runs, balls, how_out, match_id')
    .eq('is_our_batsman', true)
    .eq('season', currentYear)
    .limit(20000)
  const batterMap = aggregateBatting((battingRaw ?? []) as BatRow[])
  const topBatters = Array.from(batterMap.values())
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5)

  const { data: bowlingRaw } = await supabase
    .from('bowling_entries')
    .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
    .eq('is_our_bowler', true)
    .eq('season', currentYear)
    .limit(20000)
  const bowlerMap = aggregateBowling((bowlingRaw ?? []) as BowlRow[])
  const topBowlers = Array.from(bowlerMap.values())
    .filter((b) => b.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 5)

  // League table (current season)
  const { data: standings } = await supabase
    .from('league_standings')
    .select('team_name, club_name, club_id, played, won, points, position')
    .eq('season', currentYear)
    .order('position', { ascending: true, nullsFirst: false })
    .order('points', { ascending: false })

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Full-bleed hero */}
      <div style={{ position: 'relative', height: 720, overflow: 'hidden' }}>
        <Image
          src="/images/gallery/hero-batting-cottage.jpg"
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover"
          priority
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, rgba(13,59,39,.85) 0%, rgba(13,59,39,.35) 45%, rgba(13,59,39,.15) 70%, rgba(13,59,39,.75) 100%)',
          }}
        />

        {/* Top metadata strip */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 32,
            right: 32,
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: 2.5,
            color: 'rgba(255,255,255,.6)',
            textTransform: 'uppercase',
          }}
        >
          <span>Bitchet Green · N 51.274 · E 0.230</span>
          <span>Season {currentYear}</span>
        </div>

        {/* Massive headline */}
        <div
          style={{
            position: 'absolute',
            left: 32,
            right: 32,
            bottom: 40,
            maxWidth: 1240,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 2, background: C_RED }} />
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.9)',
                fontWeight: 600,
              }}
            >
              Village Cricket, Since the year of the bicycle
            </div>
          </div>
          <h1
            style={{
              fontFamily: display,
              fontSize: 'clamp(60px, 12vw, 180px)',
              lineHeight: 0.82,
              fontWeight: 300,
              color: '#fff',
              margin: 0,
              letterSpacing: -6,
            }}
          >
            St Lawrence
            <br />
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#fff' }}>Cricket Club.</span>
          </h1>
          <div
            style={{
              marginTop: 26,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 40,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                maxWidth: 520,
                color: 'rgba(255,255,255,.85)',
                fontSize: 18,
                lineHeight: 1.5,
                fontWeight: 300,
              }}
            >
              Eighteen Saturdays a year on a ground surrounded by orchards, oak and one particularly nosy
              labrador. We are <b style={{ fontWeight: 600 }}>the Saints</b>, of the Kent County Village
              League.
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <CStat label="Founded" value="1877" />
              <CStat label="Seasons" value={String(seasonsCount)} />
              <CStat label={`W-L ${currentYear}`} value={`${sw}–${sl}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor strip — dark band */}
      <div style={{ background: C_INK, color: 'rgba(255,255,255,.55)' }}>
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '18px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            Backed by our sponsors ———
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              flexWrap: 'wrap',
            }}
          >
            {sponsors.map((s) =>
              s.file ? (
                <Image
                  key={s.name}
                  src={`/images/sponsors/${s.file}`}
                  alt={s.name}
                  width={100}
                  height={28}
                  style={{
                    height: 24,
                    width: 'auto',
                    objectFit: 'contain',
                    filter: 'brightness(0) invert(1)',
                    opacity: 0.55,
                  }}
                />
              ) : (
                <span
                  key={s.name}
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,.6)',
                  }}
                >
                  {s.name}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Scoreboard row — next match + last result */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 32px 40px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(0, 2fr)', gap: 32 }}
          className="grid-stack-on-mobile"
        >
          {/* Next match (or "no fixtures" fallback) */}
          {next ? (
            <Link
              href={`/candidates/c/fixtures/${next.id}`}
              style={{
                background: C_GREEN,
                color: '#fff',
                padding: '36px 40px',
                position: 'relative',
                overflow: 'hidden',
                textDecoration: 'none',
              }}
            >
              <CKicker color={C_RED}>Next up · {fmtFull(next.match_date)}</CKicker>
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 'clamp(40px, 6vw, 78px)',
                    lineHeight: 0.92,
                    letterSpacing: -2.5,
                    fontWeight: 500,
                    color: '#fff',
                  }}
                >
                  <span style={{ fontStyle: 'italic', fontWeight: 400, opacity: 0.6 }}>v.</span>{' '}
                  {next.opponent}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 40,
                    marginTop: 26,
                    borderTop: '1px solid rgba(255,255,255,.15)',
                    paddingTop: 22,
                    flexWrap: 'wrap',
                  }}
                >
                  <CBigNumber label="Start" value={next.start_time?.slice(0, 5) ?? '—'} />
                  <CBigNumber label="Meet" value={next.meet_time?.slice(0, 5) ?? '—'} />
                  <CBigNumber
                    label="Venue"
                    value={next.home_away === 'H' ? 'Home' : 'Away'}
                    small={next.home_away === 'H' ? 'Bitchet Green' : next.venue}
                  />
                </div>
              </div>
            </Link>
          ) : (
            <div
              style={{
                background: C_GREEN,
                color: '#fff',
                padding: '36px 40px',
              }}
            >
              <CKicker color={C_RED}>No fixtures scheduled</CKicker>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 60,
                  lineHeight: 0.92,
                  fontWeight: 500,
                  color: '#fff',
                  marginTop: 14,
                }}
              >
                See you in April.
              </div>
            </div>
          )}

          {/* Last match */}
          {last ? (
            <Link
              href={`/candidates/c/fixtures/${last.id}`}
              style={{
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                padding: '28px 32px',
                position: 'relative',
                textDecoration: 'none',
                color: C_INK,
              }}
            >
              <CKicker color={'#888'}>Last result · {fmtShort(last.match_date)}</CKicker>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 40,
                  lineHeight: 1.02,
                  letterSpacing: -1,
                  fontWeight: 500,
                  marginTop: 10,
                }}
              >
                <CVs /> {last.opponent}
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontStyle: 'italic',
                  fontSize: 30,
                  lineHeight: 1,
                  color: last.result_text === 'Won' ? C_GREEN_LT : C_RED,
                  marginTop: 16,
                  letterSpacing: -0.5,
                }}
              >
                {last.result_text}.
              </div>
              <div
                style={{
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: '1px dashed #d6d0be',
                  fontSize: 13,
                  color: '#555',
                  lineHeight: 1.5,
                }}
              >
                {last.venue} · {last.home_away === 'H' ? 'Home' : 'Away'}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: C_RED,
                  fontWeight: 700,
                }}
              >
                Read the scorecard →
              </span>
            </Link>
          ) : (
            <CCard padding="28px 32px">
              <CKicker color={'#888'}>No completed matches</CKicker>
              <div style={{ fontSize: 14, color: '#666', marginTop: 12 }}>
                Results land here once we&rsquo;ve played some.
              </div>
            </CCard>
          )}
        </div>

        {/* Recent form strip */}
        {recentLetters.length > 0 && (
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
            <CKicker color={'#888'}>Recent form · last {recentLetters.length}</CKicker>
            <div style={{ display: 'flex', gap: 8 }}>
              {recent.map((r, i) => (
                <Link
                  key={r.id}
                  href={`/candidates/c/fixtures/${r.id}`}
                  title={`${r.result_text ?? '?'} vs ${r.opponent} · ${r.match_date}`}
                  style={{ textDecoration: 'none' }}
                >
                  <CFormChip letter={recentLetters[i]} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editorial spread: fixtures + table */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 32px' }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 48 }}
          className="grid-stack-on-mobile"
        >
          {/* Fixtures */}
          <div>
            <CEditorialHeader kicker="The Season Ahead" title="Saturdays of consequence." />
            <div style={{ borderTop: `2px solid ${C_INK}`, marginTop: 26 }}>
              {upcoming.length === 0 && (
                <div style={{ padding: '24px 0', fontSize: 14, color: '#666' }}>
                  No fixtures on the books — check back nearer the season.
                </div>
              )}
              {upcoming.map((f) => (
                <Link
                  key={f.id}
                  href={`/candidates/c/fixtures/${f.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr auto',
                    gap: 20,
                    alignItems: 'center',
                    padding: '18px 0',
                    borderBottom: `1px solid ${C_RULE}`,
                    textDecoration: 'none',
                    color: C_INK,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: C_RED,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {fmtWeekday(f.match_date)}
                    </div>
                    <div
                      style={{
                        fontFamily: display,
                        fontSize: 34,
                        lineHeight: 1,
                        fontWeight: 500,
                        letterSpacing: -1,
                      }}
                    >
                      {fmtDayNum(f.match_date)}
                    </div>
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: '#888',
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      {fmtMonth(f.match_date)}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: display,
                        fontSize: 24,
                        letterSpacing: -0.5,
                        fontWeight: 500,
                        lineHeight: 1.1,
                      }}
                    >
                      <CVs /> {f.opponent}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {f.venue} · meet {f.meet_time?.slice(0, 5) ?? '—'} · start{' '}
                      {f.start_time?.slice(0, 5) ?? '—'}
                    </div>
                  </div>
                  <CHomeAwayChip homeAway={f.home_away} />
                </Link>
              ))}
            </div>
            <Link
              href="/candidates/c/fixtures"
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
              All {upcoming.length > 0 ? '' : ''}fixtures →
            </Link>
          </div>

          {/* Table sidebar */}
          <div>
            <CEditorialHeader kicker="Division" title="The standings." />
            <div
              style={{
                marginTop: 26,
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr 28px 28px 46px',
                  gap: 6,
                  fontFamily: mono,
                  fontSize: 10,
                  color: '#999',
                  letterSpacing: 1.5,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${C_RULE}`,
                  textTransform: 'uppercase',
                }}
              >
                <div>Pos</div>
                <div></div>
                <div style={{ textAlign: 'right' }}>P</div>
                <div style={{ textAlign: 'right' }}>W</div>
                <div style={{ textAlign: 'right' }}>Pts</div>
              </div>
              {(standings ?? []).slice(0, 8).map((r, i) => {
                const teamLabel = (r.team_name ?? '').trim()
                const clubLabel = (r.club_name ?? '').trim()
                const fullName =
                  !clubLabel ||
                  !teamLabel ||
                  teamLabel.toLowerCase().includes(clubLabel.toLowerCase())
                    ? teamLabel || clubLabel || '?'
                    : `${clubLabel} - ${teamLabel}`
                const isOurs = r.club_id === '9754'
                const pos = r.position ?? i + 1
                return (
                  <div
                    key={`${r.team_name ?? ''}-${i}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 1fr 28px 28px 46px',
                      gap: 6,
                      padding: '8px 0',
                      alignItems: 'center',
                      borderBottom: `1px dashed ${C_RULE}`,
                      background: isOurs ? 'rgba(193,32,39,.06)' : 'transparent',
                      marginLeft: isOurs ? -8 : 0,
                      marginRight: isOurs ? -8 : 0,
                      paddingLeft: isOurs ? 8 : 0,
                      paddingRight: isOurs ? 8 : 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        color: isOurs ? C_RED : '#888',
                        fontWeight: isOurs ? 700 : 400,
                      }}
                    >
                      {String(pos).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontFamily: display,
                        fontSize: 14,
                        fontWeight: isOurs ? 600 : 500,
                        color: isOurs ? C_GREEN : C_INK,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {fullName}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#666' }}>
                      {r.played}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#666' }}>
                      {r.won}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', fontWeight: 700 }}>
                      {r.points}
                    </div>
                  </div>
                )
              })}
              {(standings ?? []).length === 0 && (
                <div style={{ padding: '20px 0', fontSize: 13, color: '#888' }}>
                  No standings yet for {currentYear}.
                </div>
              )}
            </div>
            <Link
              href="/candidates/c/table"
              style={{
                display: 'inline-block',
                marginTop: 16,
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: C_RED,
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Full table →
            </Link>
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '100px 32px', textAlign: 'center' }}>
          <CKicker color={C_RED}>Motto</CKicker>
          <div
            style={{
              fontFamily: display,
              fontSize: 'clamp(40px, 7vw, 84px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1.02,
              letterSpacing: -2,
              marginTop: 24,
            }}
          >
            &ldquo;Play fair. Stay late. Chase the ice&nbsp;cream van.&rdquo;
          </div>
        </div>
      </div>

      {/* Top performers — real data */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px' }}>
        <CEditorialHeader kicker={`Form Guide · ${currentYear}`} title="Leading the charts." />
        <div
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 32, marginTop: 32 }}
          className="grid-stack-on-mobile"
        >
          <CCard padding="28px 32px">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: `2px solid ${C_GREEN}`,
                paddingBottom: 10,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5 }}>
                Batting
              </div>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: '#888',
                  textTransform: 'uppercase',
                }}
              >
                Top 5 · {currentYear}
              </span>
            </div>
            {topBatters.length === 0 && (
              <div style={{ padding: '20px 0', fontSize: 13, color: '#888' }}>
                No batting data yet.
              </div>
            )}
            {topBatters.map((b, i) => (
              <Link
                key={b.id}
                href={`/candidates/c/stats/${encodeURIComponent(String(b.id ?? ''))}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom:
                    i === topBatters.length - 1 ? 'none' : `1px dashed ${C_RULE}`,
                  textDecoration: 'none',
                  color: C_INK,
                }}
              >
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 28,
                    fontWeight: 500,
                    color: i === 0 ? C_GREEN : '#ccc',
                    lineHeight: 1,
                  }}
                >
                  0{i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: display, fontSize: 18, fontWeight: 500, letterSpacing: -0.3 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                    {b.inns} inn · HS {b.hs}
                  </div>
                </div>
                <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C_GREEN }}>
                  {b.runs} runs
                </div>
              </Link>
            ))}
          </CCard>

          <CCard padding="28px 32px">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                borderBottom: `2px solid ${C_RED}`,
                paddingBottom: 10,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5 }}>
                Bowling
              </div>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  color: '#888',
                  textTransform: 'uppercase',
                }}
              >
                Top 5 · {currentYear}
              </span>
            </div>
            {topBowlers.length === 0 && (
              <div style={{ padding: '20px 0', fontSize: 13, color: '#888' }}>
                No bowling data yet.
              </div>
            )}
            {topBowlers.map((b, i) => (
              <Link
                key={b.id}
                href={`/candidates/c/stats/${encodeURIComponent(String(b.id ?? ''))}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr auto',
                  gap: 14,
                  alignItems: 'center',
                  padding: '14px 0',
                  borderBottom:
                    i === topBowlers.length - 1 ? 'none' : `1px dashed ${C_RULE}`,
                  textDecoration: 'none',
                  color: C_INK,
                }}
              >
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 28,
                    fontWeight: 500,
                    color: i === 0 ? C_RED : '#ccc',
                    lineHeight: 1,
                  }}
                >
                  0{i + 1}
                </div>
                <div>
                  <div style={{ fontFamily: display, fontSize: 18, fontWeight: 500, letterSpacing: -0.3 }}>
                    {b.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
                    {b.matches.size} mat · best {b.bestWkts}/{b.bestRuns}
                  </div>
                </div>
                <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: C_RED }}>
                  {b.wickets} wkts
                </div>
              </Link>
            ))}
          </CCard>
        </div>
      </div>

      {/* Saints Want You */}
      <div id="join" style={{ position: 'relative', overflow: 'hidden', color: '#fff', background: C_INK }}>
        <Image
          src="/images/gallery/team-pavilion.jpg"
          alt="St Lawrence CC team"
          fill
          className="object-cover"
          style={{ opacity: 0.35 }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(17,17,17,.6) 0%, rgba(13,59,39,.85) 100%)',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1240,
            margin: '0 auto',
            padding: '120px 32px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 4,
              color: C_RED,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            ★ Recruiting ★
          </div>
          <h2
            style={{
              fontFamily: display,
              fontSize: 'clamp(64px, 14vw, 200px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.9,
              letterSpacing: -6,
              margin: '20px 0 10px',
            }}
          >
            The Saints
            <br />
            <span style={{ fontStyle: 'normal', fontWeight: 600, color: C_RED }}>want you.</span>
          </h2>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.5,
              maxWidth: 620,
              margin: '28px auto 0',
              color: 'rgba(255,255,255,.8)',
            }}
          >
            Experienced cricketer, rusty club player, or someone whose last innings was Under-13s Colts —
            you are welcome here. Bring whites if you&rsquo;ve got &rsquo;em, borrow ours if you haven&rsquo;t.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
            <a
              href="mailto:pmsmith31@icloud.com"
              style={{
                padding: '16px 28px',
                background: C_RED,
                color: '#fff',
                textDecoration: 'none',
                fontFamily: mono,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Email the captain
            </a>
            <a
              href="tel:07783596582"
              style={{
                padding: '16px 28px',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,.4)',
                textDecoration: 'none',
                fontFamily: mono,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              07783 596 582
            </a>
          </div>
        </div>
      </div>

      {/* Photo strip */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px' }}>
        <CEditorialHeader kicker="Gallery" title="From the boundary." />
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 24 }}
          className="grid-photos-on-mobile"
        >
          {[
            '/images/gallery/batting-shot.jpg',
            '/images/gallery/bowling-action.jpg',
            '/images/gallery/roller.jpg',
            '/images/gallery/pavilion-social.jpg',
          ].map((p, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
              <Image src={p} alt="Gallery" fill className="object-cover" style={{ filter: 'saturate(1.05)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tiny scoped style for mobile stacking — using clamps everywhere else */}
      <style>{`
        @media (max-width: 720px) {
          .grid-stack-on-mobile { grid-template-columns: 1fr !important; }
          .grid-photos-on-mobile { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}

