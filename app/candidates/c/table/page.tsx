import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  CKicker,
  CPageHeader,
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
} from '../_components/primitives'

export const dynamic = 'force-dynamic'

const ALL_SEASONS = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => 2008 + i)
const RECENT_SEASONS = ALL_SEASONS.slice(-4)
const OLDER_SEASONS = ALL_SEASONS.slice(0, -4).slice().reverse()
const OUR_CLUB_ID = '9754'

type Standing = {
  team_id: string
  team_name: string
  club_id: string | null
  club_name: string | null
  position: number | null
  played: number
  won: number
  lost: number
  tied: number
  drew: number
  abandoned: number
  cancelled: number
  bonus_batting: number
  bonus_bowling: number
  penalty_points: number
  points: number
}

function fmtPts(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export default async function CTablePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const season = parseInt(sp.season ?? String(new Date().getFullYear()), 10)

  const { data: standingsRaw } = await supabase
    .from('league_standings')
    .select('team_id, team_name, club_id, club_name, played, won, lost, tied, drew, abandoned, cancelled, bonus_batting, bonus_bowling, penalty_points, points, position')
    .eq('season', season)
    .order('position', { ascending: true, nullsFirst: false })
    .order('points', { ascending: false })

  const standings: Standing[] = (standingsRaw ?? []) as Standing[]
  const isEmpty = standings.length === 0

  const { data: oneMatch } = await supabase
    .from('match_scorecards')
    .select('competition_name')
    .eq('season', season)
    .not('competition_name', 'is', null)
    .limit(1)
  const divisionName = oneMatch?.[0]?.competition_name ?? 'Kent County Village League'

  const anyPenalties = standings.some((t) => t.penalty_points > 0)
  const anyCancelled = standings.some((t) => t.cancelled > 0)

  const seasonSelector = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {RECENT_SEASONS.map((s) => {
        const active = s === season
        return (
          <Link
            key={s}
            href={`/candidates/c/table?season=${s}`}
            style={{
              padding: '6px 14px',
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 700,
              textDecoration: 'none',
              background: active ? C_GREEN : '#fff',
              color: active ? '#fff' : '#888',
              border: `1px solid ${active ? C_GREEN : C_RULE}`,
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {s}
          </Link>
        )
      })}
      <details style={{ position: 'relative' }}>
        <summary style={{
          padding: '6px 14px',
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 700,
          background: '#fff',
          color: '#888',
          border: `1px solid ${C_RULE}`,
          minHeight: 36,
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          listStyle: 'none',
        }}>
          Older ▾
        </summary>
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 4,
          background: '#fff',
          border: `1px solid ${C_RULE}`,
          boxShadow: '0 4px 16px rgba(0,0,0,.1)',
          padding: 8,
          zIndex: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          minWidth: 200,
        }}>
          {OLDER_SEASONS.map((s) => {
            const active = s === season
            return (
              <Link
                key={s}
                href={`/candidates/c/table?season=${s}`}
                style={{
                  padding: '6px 10px',
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                  color: active ? '#fff' : '#666',
                  background: active ? C_GREEN : 'transparent',
                }}
              >
                {s}
              </Link>
            )
          })}
        </div>
      </details>
    </div>
  )

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      <CContainer>
        <CPageHeader
          kicker="League Table"
          title="The standings."
          subtitle={`${divisionName} · ${season} Season`}
          right={seasonSelector}
        />

        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontFamily: display, fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>
              No standings yet for {season}.
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              The table populates as matches are played and synced.
            </div>
          </div>
        ) : (
          <>
            {/* Table */}
            <div style={{ overflowX: 'auto', border: `1px solid ${C_RULE}`, background: '#fff', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C_RULE}` }}>
                    <th style={{ padding: '10px 14px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'left', width: 32 }}>#</th>
                    <th style={{ padding: '10px 14px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'left' }}>Team</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Played">P</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Won">W</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Lost">L</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Tied">T</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Abandoned">A</th>
                    {anyCancelled && (
                      <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Cancelled">C</th>
                    )}
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Game points: Win 20, Tied 16, Abandoned/Cancelled 8">Game</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Batting bonus">Bat</th>
                    <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Bowling bonus">Bowl</th>
                    {anyPenalties && (
                      <th style={{ padding: '10px 10px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 600, textAlign: 'right' }} title="Penalty points">Pen</th>
                    )}
                    <th style={{ padding: '10px 14px', fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#999', fontWeight: 700, textAlign: 'right' }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, i) => {
                    const pos = t.position ?? (i + 1)
                    const total = standings.length
                    const isPromotion = pos <= 2
                    const isRelegation = pos >= total - 1
                    const isOurs = t.club_id === OUR_CLUB_ID

                    const teamLabel = (t.team_name ?? '').trim()
                    const clubLabel = (t.club_name ?? '').trim()
                    const fullName =
                      !clubLabel || !teamLabel || teamLabel.toLowerCase().includes(clubLabel.toLowerCase())
                        ? (teamLabel || clubLabel || '?')
                        : `${clubLabel} - ${teamLabel}`

                    const gamePts = t.points - t.bonus_batting - t.bonus_bowling + t.penalty_points

                    // Row background + left border. SLCC uses a clearly *green*
                    // tint so it doesn't read as relegation (which is the only
                    // other red-tinted row treatment).
                    let rowBg = 'transparent'
                    let leftBorderColor: string | null = null
                    if (isOurs) {
                      rowBg = 'rgba(13,59,39,.10)'
                      leftBorderColor = C_GREEN
                    } else if (isPromotion) {
                      rowBg = 'rgba(13,59,39,.05)'
                      leftBorderColor = C_GREEN_LT
                    } else if (isRelegation) {
                      rowBg = 'rgba(193,32,39,.06)'
                      leftBorderColor = C_RED
                    }

                    const tdBase: React.CSSProperties = {
                      padding: '11px 10px',
                      textAlign: 'right',
                      fontFamily: mono,
                      fontSize: 13,
                      color: '#666',
                      borderBottom: `1px dashed ${C_RULE}`,
                    }

                    const posColor = isPromotion ? C_GREEN : isRelegation ? C_RED : '#bbb'

                    return (
                      <tr key={t.team_id} style={{ background: rowBg }}>
                        {/* # with zone arrow */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: mono,
                          fontSize: 12,
                          color: posColor,
                          fontWeight: isOurs || isPromotion || isRelegation ? 700 : 400,
                          borderBottom: `1px dashed ${C_RULE}`,
                          borderLeft: leftBorderColor ? `3px solid ${leftBorderColor}` : '3px solid transparent',
                          whiteSpace: 'nowrap',
                        }}>
                          {isPromotion && <span style={{ marginRight: 3 }}>▲</span>}
                          {isRelegation && <span style={{ marginRight: 3 }}>▼</span>}
                          {pos}
                        </td>
                        {/* Team name */}
                        <td style={{
                          padding: '11px 14px',
                          fontFamily: display,
                          fontSize: 15,
                          fontWeight: isOurs ? 600 : 500,
                          color: isOurs ? C_GREEN : C_INK,
                          borderBottom: `1px dashed ${C_RULE}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {fullName}
                        </td>
                        <td style={tdBase}>{t.played}</td>
                        <td style={{ ...tdBase, fontWeight: 600, color: '#444' }}>{t.won}</td>
                        <td style={tdBase}>{t.lost}</td>
                        <td style={tdBase}>{t.tied}</td>
                        <td style={tdBase}>{t.abandoned}</td>
                        {anyCancelled && <td style={tdBase}>{t.cancelled}</td>}
                        <td style={{ ...tdBase, color: '#555' }}>{fmtPts(gamePts)}</td>
                        <td style={tdBase}>{fmtPts(t.bonus_batting)}</td>
                        <td style={tdBase}>{fmtPts(t.bonus_bowling)}</td>
                        {anyPenalties && (
                          <td style={{ ...tdBase, color: C_RED }}>
                            {t.penalty_points > 0 ? `−${fmtPts(t.penalty_points)}` : '—'}
                          </td>
                        )}
                        <td style={{
                          padding: '11px 14px',
                          textAlign: 'right',
                          fontFamily: mono,
                          fontSize: 14,
                          fontWeight: 800,
                          color: isOurs ? C_GREEN : C_INK,
                          borderBottom: `1px dashed ${C_RULE}`,
                        }}>
                          {fmtPts(t.points)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Zone legend */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', marginBottom: 24 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C_GREEN }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(13,59,39,.12)', borderLeft: `3px solid ${C_GREEN_LT}` }} />
                ▲ Top 2 — Promotion
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C_RED }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(193,32,39,.1)', borderLeft: `3px solid ${C_RED}` }} />
                ▼ Bottom 2 — Relegation
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C_GREEN }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'rgba(13,59,39,.10)', borderLeft: `3px solid ${C_GREEN}` }} />
                St Lawrence CC
              </span>
            </div>

            {/* How points work */}
            <CCard padding="24px 28px">
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: '#999', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>
                — How points work
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px 24px', fontFamily: sansTight, fontSize: 13, color: '#555' }}>
                <div>Win <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>20</span></div>
                <div>Lost <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>0</span></div>
                <div>Tied <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>16</span></div>
                <div>Abandoned <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>8</span></div>
                <div>Cancelled <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>8</span></div>
                <div>Opp. conceded <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>20</span></div>
                <div>Team conceded <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>0</span></div>
                <div>+ Batting bonus</div>
                <div>+ Bowling bonus</div>
                <div>− Penalties</div>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: '#999', fontFamily: sansTight }}>
                <span style={{ fontWeight: 700, color: '#666' }}>Game</span> column = Win / Tied / Abandoned / Cancelled points combined.
              </div>
            </CCard>
          </>
        )}
      </CContainer>
    </div>
  )
}
