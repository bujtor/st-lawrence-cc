'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatOvers } from '@/lib/play-cricket'
import {
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_RULE,
  C_INK,
  display,
  sansTight,
  mono,
} from '../_theme/tokens'

export type ScBat = {
  position: number | null
  batsman_name: string | null
  batsman_id: number | null
  how_out: string | null
  fielder_name: string | null
  bowler_name: string | null
  runs: number | null
  fours: number | null
  sixes: number | null
  balls: number | null
}

export type ScBowl = {
  bowler_name: string | null
  bowler_id: number | null
  overs: number | null
  maidens: number | null
  runs: number | null
  wickets: number | null
}

export type ScExtras = {
  byes: number
  leg_byes: number
  wides: number
  no_balls: number
  penalty: number
  total: number
} | null

export type ScFowEntry = {
  runs: number
  wickets: number
  batsman_out_id: string | null
  batsman_out_name: string | null
  batsman_in_id: string | null
  batsman_in_name: string | null
  batsman_in_runs: number | null
}

export type InningsView = {
  key: string
  battingTeam: string
  bowlingTeam: string
  shortTab: string
  totalRuns: number
  totalWickets: number
  totalOvers: number | null
  batting: ScBat[]
  bowling: ScBowl[]
  battingCaptainId: string | null
  battingKeeperId: string | null
  bowlingCaptainId: string | null
  bowlingKeeperId: string | null
  extras: ScExtras
  fow: ScFowEntry[]
}

function fmtHowOut(b: ScBat): string {
  const h = (b.how_out ?? '').toLowerCase()
  if (!h || h === 'not out') return 'not out'
  if (h === 'did not bat') return 'did not bat'
  if (h.startsWith('ct')) return b.fielder_name ? `ct ${b.fielder_name}` : 'ct'
  if (h.startsWith('st')) return b.fielder_name ? `st ${b.fielder_name}` : 'st'
  if (h.startsWith('run out')) return b.fielder_name ? `run out (${b.fielder_name})` : 'run out'
  if (h === 'b' || h === 'bowled') return 'b'
  if (h === 'lbw') return 'lbw'
  return b.how_out ?? ''
}

function formatExtrasBreakdown(e: NonNullable<ScExtras>): string {
  const parts: string[] = []
  if (e.byes > 0) parts.push(`b ${e.byes}`)
  if (e.leg_byes > 0) parts.push(`lb ${e.leg_byes}`)
  if (e.wides > 0) parts.push(`w ${e.wides}`)
  if (e.no_balls > 0) parts.push(`nb ${e.no_balls}`)
  if (e.penalty > 0) parts.push(`p ${e.penalty}`)
  return parts.join(', ')
}

function formatPlayerName(
  name: string | null,
  id: string,
  captainId: string | null,
  keeperId: string | null,
): string | null {
  if (!name) return null
  const isCap = id && id === captainId
  const isKp = id && id === keeperId
  if (isCap && isKp) return `${name} (c) †`
  if (isCap) return `${name} (c)`
  if (isKp) return `${name} †`
  return name
}

const TH: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: '#999',
  fontWeight: 600,
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: `1px solid ${C_RULE}`,
  background: '#faf8f4',
}

const TD: React.CSSProperties = {
  padding: '10px 10px',
  fontSize: 13,
  color: C_INK,
  borderBottom: `1px solid ${C_RULE}`,
  fontFamily: sansTight,
  verticalAlign: 'middle',
}

export default function CScorecardTabs({
  views,
  defaultIndex = 0,
}: {
  views: InningsView[]
  defaultIndex?: number
}) {
  const [active, setActive] = useState(
    Math.min(Math.max(defaultIndex, 0), Math.max(views.length - 1, 0))
  )
  if (views.length === 0) return null
  const view = views[active]

  const actualBatters = view.batting.filter((b) => (b.how_out ?? '').toLowerCase() !== 'did not bat')
  const dnbNames = view.batting
    .filter((b) => (b.how_out ?? '').toLowerCase() === 'did not bat')
    .map((b) =>
      formatPlayerName(b.batsman_name, String(b.batsman_id ?? ''), view.battingCaptainId, view.battingKeeperId)
    )
    .filter((n): n is string => !!n)

  const runsSum = actualBatters.reduce((s, b) => s + (b.runs ?? 0), 0)
  const extrasTotal = view.extras?.total ?? Math.max(0, view.totalRuns - runsSum)
  const extrasBreakdown = view.extras ? formatExtrasBreakdown(view.extras) : null
  const rr =
    view.totalOvers && view.totalOvers > 0
      ? (view.totalRuns / view.totalOvers).toFixed(2)
      : null

  return (
    <div style={{ fontFamily: sansTight }}>
      {/* Tab switcher */}
      {views.length > 1 && (
        <div
          role="tablist"
          aria-label="Innings"
          style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${C_RULE}`, paddingBottom: 0 }}
        >
          {views.map((v, idx) => (
            <button
              key={v.key}
              role="tab"
              aria-selected={idx === active}
              onClick={() => setActive(idx)}
              style={{
                padding: '10px 18px',
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 700,
                background: idx === active ? C_GREEN : 'transparent',
                color: idx === active ? '#fff' : '#888',
                border: 'none',
                cursor: 'pointer',
                borderBottom: idx === active ? `2px solid ${C_GREEN}` : '2px solid transparent',
                marginBottom: -1,
                transition: 'all 0.15s',
              }}
            >
              {v.shortTab}
            </button>
          ))}
        </div>
      )}

      {/* Innings heading — team name + total */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          borderBottom: `2px solid ${C_INK}`,
          paddingBottom: 10,
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, letterSpacing: -0.5 }}>
          {view.battingTeam}
        </div>
        <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>
          {view.totalRuns}
          <span style={{ color: '#999' }}>/{view.totalWickets}</span>
          {view.totalOvers != null && view.totalOvers > 0 && (
            <span
              style={{
                fontFamily: mono,
                fontSize: 13,
                color: '#888',
                fontWeight: 400,
                marginLeft: 8,
              }}
            >
              ({formatOvers(view.totalOvers)} ov)
            </span>
          )}
        </div>
      </div>

      {/* Batting table */}
      {actualBatters.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 12, border: `1px solid ${C_RULE}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: '30%' }}>Batsman</th>
                <th style={{ ...TH }} className="sc-hide-xs">How out</th>
                <th style={{ ...TH }} className="sc-hide-sm">Bowler</th>
                <th style={{ ...TH, textAlign: 'right' }}>R</th>
                <th style={{ ...TH, textAlign: 'right' }} className="sc-hide-xs">B</th>
                <th style={{ ...TH, textAlign: 'right' }} className="sc-hide-xs">4s</th>
                <th style={{ ...TH, textAlign: 'right' }} className="sc-hide-xs">6s</th>
              </tr>
            </thead>
            <tbody>
              {actualBatters.map((b, i) => {
                const ho = (b.how_out ?? '').toLowerCase()
                const isNotOut = !ho || ho === 'not out'
                const bid = String(b.batsman_id ?? '')
                const isCap = bid && bid === view.battingCaptainId
                const isKp = bid && bid === view.battingKeeperId
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf9f3' }}>
                    <td style={TD}>
                      {b.batsman_id ? (
                        <Link
                          href={`/candidates/c/stats/${b.batsman_id}`}
                          style={{ color: C_GREEN, fontWeight: 600, textDecoration: 'none' }}
                        >
                          {b.batsman_name ?? '?'}
                        </Link>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{b.batsman_name ?? '?'}</span>
                      )}
                      {(isCap || isKp) && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontFamily: mono,
                            fontSize: 10,
                            color: C_RED,
                            fontWeight: 700,
                          }}
                        >
                          {isCap && isKp ? '(c) †' : isCap ? '(c)' : '†'}
                        </span>
                      )}
                    </td>
                    <td style={{ ...TD, color: '#666' }} className="sc-hide-xs">{fmtHowOut(b)}</td>
                    <td style={{ ...TD, color: '#666' }} className="sc-hide-sm">{b.bowler_name ?? '—'}</td>
                    <td
                      style={{
                        ...TD,
                        textAlign: 'right',
                        fontFamily: mono,
                        fontWeight: 700,
                        color: isNotOut ? C_GREEN_LT : C_INK,
                      }}
                    >
                      {b.runs ?? 0}
                      {isNotOut && (
                        <span style={{ fontSize: 10, color: C_GREEN_LT, marginLeft: 2 }}>*</span>
                      )}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#888' }} className="sc-hide-xs">
                      {b.balls || '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#888' }} className="sc-hide-xs">
                      {b.fours || '—'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#888' }} className="sc-hide-xs">
                      {b.sixes || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              {extrasTotal > 0 && (
                <tr style={{ background: '#faf8f4' }}>
                  <td
                    colSpan={3}
                    style={{ ...TD, fontStyle: 'italic', color: '#666', borderTop: `1px solid ${C_RULE}` }}
                  >
                    Extras
                    {extrasBreakdown && (
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 11,
                          color: '#999',
                          marginLeft: 8,
                          fontStyle: 'normal',
                        }}
                      >
                        ({extrasBreakdown})
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      ...TD,
                      textAlign: 'right',
                      fontFamily: mono,
                      fontWeight: 700,
                      borderTop: `1px solid ${C_RULE}`,
                    }}
                  >
                    {extrasTotal}
                  </td>
                  <td colSpan={3} style={{ ...TD, borderTop: `1px solid ${C_RULE}` }} className="sc-hide-xs" />
                </tr>
              )}
              <tr style={{ background: '#f3efe6', borderTop: `2px solid ${C_INK}` }}>
                <td
                  colSpan={3}
                  style={{
                    ...TD,
                    fontWeight: 700,
                    fontFamily: display,
                    fontSize: 15,
                    borderTop: `2px solid ${C_INK}`,
                  }}
                >
                  Total
                  {view.totalOvers != null && view.totalOvers > 0 && (
                    <span
                      style={{
                        fontFamily: mono,
                        fontWeight: 400,
                        fontSize: 11,
                        color: '#888',
                        marginLeft: 8,
                      }}
                    >
                      ({formatOvers(view.totalOvers)} ov{rr ? `, RR ${rr}` : ''})
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...TD,
                    textAlign: 'right',
                    fontFamily: mono,
                    fontWeight: 700,
                    fontSize: 16,
                    borderTop: `2px solid ${C_INK}`,
                  }}
                >
                  {view.totalRuns}/{view.totalWickets}
                </td>
                <td colSpan={3} style={{ ...TD, borderTop: `2px solid ${C_INK}` }} className="sc-hide-xs" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Fall of wickets */}
      {view.fow.length > 0 && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12, lineHeight: 1.7 }}>
          <span
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#888',
              fontWeight: 600,
              marginRight: 8,
            }}
          >
            Fall of wickets:
          </span>
          {view.fow
            .slice()
            .sort((a, b) => a.wickets - b.wickets)
            .map((f, idx) => (
              <span key={idx} style={{ marginRight: 12 }}>
                <span style={{ fontFamily: mono, fontWeight: 700, color: C_INK }}>
                  {f.wickets}-{f.runs}
                </span>
                {f.batsman_out_name && (
                  <span style={{ color: '#888' }}> ({f.batsman_out_name})</span>
                )}
              </span>
            ))}
        </div>
      )}

      {/* Did not bat */}
      {dnbNames.length > 0 && (
        <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          <span style={{ fontWeight: 600, color: '#666' }}>Did not bat:</span> {dnbNames.join(', ')}.
        </div>
      )}

      {/* Bowling section */}
      {view.bowling.length > 0 && (
        <>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: '#888',
              fontWeight: 600,
              marginTop: 32,
              marginBottom: 10,
            }}
          >
            {view.bowlingTeam}{' '}
            <span style={{ fontWeight: 400, textTransform: 'lowercase', letterSpacing: 0, fontSize: 12 }}>
              bowling
            </span>
          </div>
          <div style={{ overflowX: 'auto', border: `1px solid ${C_RULE}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: '40%' }}>Bowler</th>
                  <th style={{ ...TH, textAlign: 'right' }}>O</th>
                  <th style={{ ...TH, textAlign: 'right' }}>M</th>
                  <th style={{ ...TH, textAlign: 'right' }}>R</th>
                  <th style={{ ...TH, textAlign: 'right' }}>W</th>
                  <th style={{ ...TH, textAlign: 'right' }} className="sc-hide-xs">Econ</th>
                </tr>
              </thead>
              <tbody>
                {view.bowling.map((b, i) => {
                  const oversDec = b.overs ?? 0
                  const econ = oversDec > 0 ? ((b.runs ?? 0) / oversDec).toFixed(2) : '—'
                  const bid = String(b.bowler_id ?? '')
                  const isCap = bid && bid === view.bowlingCaptainId
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf9f3' }}>
                      <td style={TD}>
                        {b.bowler_id ? (
                          <Link
                            href={`/candidates/c/stats/${b.bowler_id}`}
                            style={{ color: C_GREEN, fontWeight: 600, textDecoration: 'none' }}
                          >
                            {b.bowler_name ?? '?'}
                          </Link>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{b.bowler_name ?? '?'}</span>
                        )}
                        {isCap && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontFamily: mono,
                              fontSize: 10,
                              color: C_RED,
                              fontWeight: 700,
                            }}
                          >
                            (c)
                          </span>
                        )}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#666' }}>
                        {formatOvers(b.overs)}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#666' }}>
                        {b.maidens ?? 0}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#666' }}>
                        {b.runs ?? 0}
                      </td>
                      <td
                        style={{
                          ...TD,
                          textAlign: 'right',
                          fontFamily: mono,
                          fontWeight: 700,
                          color: (b.wickets ?? 0) >= 3 ? C_RED : C_INK,
                        }}
                      >
                        {b.wickets ?? 0}
                      </td>
                      <td
                        style={{ ...TD, textAlign: 'right', fontFamily: mono, color: '#888' }}
                        className="sc-hide-xs"
                      >
                        {econ}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 560px) { .sc-hide-xs { display: none !important; } }
        @media (max-width: 720px) { .sc-hide-sm { display: none !important; } }
      `}</style>
    </div>
  )
}
