'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Fixture } from '@/lib/supabase'
import type { RecentFormEntry } from '@/lib/recent-form'
import { formLetter } from '@/lib/recent-form'
import {
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from '../../_theme/tokens'
import {
  CKicker,
  CContainer,
  CDateStack,
  CFormChip,
  CHomeAwayChip,
  CResultPill,
  CVs,
  CMonoLabel,
} from '../../_components/primitives'

const ALL_SEASONS = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => 2008 + i)
const RECENT_SEASONS = ALL_SEASONS.slice(-4)
const OLDER_SEASONS = ALL_SEASONS.slice(0, -4).slice().reverse()

export default function CFixturesList({
  fixtures,
  season,
  scorecardIds = [],
  recentForm = [],
  formByOpponent = {},
  todayDate,
}: {
  fixtures: Fixture[]
  season: number
  scorecardIds?: number[]
  recentForm?: RecentFormEntry[]
  formByOpponent?: Record<string, RecentFormEntry[]>
  /** YYYY-MM-DD computed on the server in Europe/London — passed in so SSR + hydration agree. */
  todayDate: string
}) {
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all')
  const scorecardSet = new Set(scorecardIds)

  // Treat any fixture dated today-or-later as "upcoming" so we don't surprise users
  // by demoting today's match to the results section before play starts.
  const isPast = (d: string) => d < todayDate

  const filtered = fixtures.filter((f) => {
    if (filter === 'home') return f.home_away === 'H'
    if (filter === 'away') return f.home_away === 'A'
    return true
  })

  const upcoming = filtered.filter((f) => !isPast(f.match_date))
  const completed = filtered.filter((f) => isPast(f.match_date))

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Page header band */}
      <div style={{ background: C_GREEN, color: '#fff', padding: '48px 32px 40px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
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
            — Fixtures &amp; Results
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: display,
                  fontSize: 'clamp(42px, 8vw, 80px)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  lineHeight: 0.9,
                  letterSpacing: -2.5,
                  color: '#fff',
                  margin: 0,
                }}
              >
                {season} Season.
              </h1>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: 'rgba(255,255,255,.5)',
                  letterSpacing: 1.5,
                  marginTop: 12,
                  textTransform: 'uppercase',
                }}
              >
                {fixtures.length} matches
              </div>
            </div>

            {/* Season selector pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {RECENT_SEASONS.map((s) => (
                <Link
                  key={s}
                  href={`/candidates/c/fixtures?season=${s}`}
                  style={{
                    padding: '8px 16px',
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 2,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    background: s === season ? C_RED : 'rgba(255,255,255,.12)',
                    color: s === season ? '#fff' : 'rgba(255,255,255,.7)',
                    transition: 'all 0.15s',
                  }}
                >
                  {s}
                </Link>
              ))}
              <details style={{ position: 'relative' }}>
                <summary
                  style={{
                    padding: '8px 16px',
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 2,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    background: 'rgba(255,255,255,.12)',
                    color: 'rgba(255,255,255,.7)',
                    cursor: 'pointer',
                    listStyle: 'none',
                  }}
                >
                  Older ▾
                </summary>
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    background: '#fff',
                    border: `1px solid ${C_RULE}`,
                    padding: 8,
                    zIndex: 10,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 4,
                    minWidth: 200,
                  }}
                >
                  {OLDER_SEASONS.map((s) => (
                    <Link
                      key={s}
                      href={`/candidates/c/fixtures?season=${s}`}
                      style={{
                        padding: '6px 8px',
                        fontFamily: mono,
                        fontSize: 11,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        textAlign: 'center',
                        color: s === season ? '#fff' : C_INK,
                        background: s === season ? C_GREEN : 'transparent',
                        fontWeight: s === season ? 700 : 400,
                      }}
                    >
                      {s}
                    </Link>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Recent form strip */}
          {recentForm.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginTop: 28,
                paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,.15)',
              }}
            >
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.5)',
                  fontWeight: 600,
                }}
              >
                Overall · last {recentForm.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {recentForm
                  .slice()
                  .reverse()
                  .map((r) => (
                    <Link
                      key={r.id}
                      href={`/candidates/c/fixtures/${r.id}`}
                      title={`${r.result_text ?? '?'} vs ${r.opponent} · ${r.match_date}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <CFormChip letter={formLetter(r.result_text)} size={28} />
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div
        style={{
          background: '#fff',
          borderBottom: `1px solid ${C_RULE}`,
          padding: '0 32px',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            gap: 0,
          }}
        >
          {(['all', 'home', 'away'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '14px 20px',
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontWeight: 700,
                background: 'none',
                border: 'none',
                borderBottom: filter === f ? `2px solid ${C_GREEN}` : '2px solid transparent',
                color: filter === f ? C_GREEN : '#aaa',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {f === 'all' ? 'All' : f === 'home' ? 'Home' : 'Away'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '48px 32px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#aaa' }}>
            <div style={{ fontFamily: display, fontSize: 36, fontStyle: 'italic' }}>No fixtures found.</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>Try changing the filter above.</div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 16,
                marginBottom: 20,
                borderBottom: `2px solid ${C_INK}`,
                paddingBottom: 10,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5 }}>
                Upcoming
              </div>
              <CMonoLabel size={10} color="#aaa" spacing={2}>
                {upcoming.length} match{upcoming.length !== 1 ? 'es' : ''}
              </CMonoLabel>
            </div>
            <div>
              {upcoming.map((f, idx) => {
                const h2hForm = formByOpponent[f.opponent] ?? []
                return (
                  <Link
                    key={f.id}
                    href={`/candidates/c/fixtures/${f.id}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr auto',
                      gap: 24,
                      alignItems: 'center',
                      padding: '20px 24px',
                      background: '#fff',
                      borderBottom: `1px dashed ${C_RULE}`,
                      textDecoration: 'none',
                      color: C_INK,
                      transition: 'background 0.12s',
                    }}
                    className="c-fixture-row"
                  >
                    <CDateStack dateStr={f.match_date} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: display,
                          fontSize: 'clamp(18px, 3vw, 26px)',
                          fontWeight: 500,
                          letterSpacing: -0.5,
                          lineHeight: 1.1,
                        }}
                      >
                        <CVs /> {f.opponent}
                      </div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                        {f.venue}
                        {f.competition && (
                          <span style={{ color: '#bbb', marginLeft: 8 }}>{f.competition}</span>
                        )}
                      </div>
                      {/* Per-opponent form */}
                      {h2hForm.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 10,
                              letterSpacing: 1.5,
                              textTransform: 'uppercase',
                              color: '#bbb',
                              fontWeight: 600,
                            }}
                          >
                            vs them
                          </span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {h2hForm
                              .slice()
                              .reverse()
                              .map((r) => (
                                <CFormChip key={r.id} letter={formLetter(r.result_text)} size={22} />
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      <CHomeAwayChip homeAway={f.home_away} />
                      {f.start_time && (
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: 13,
                            fontWeight: 700,
                            color: C_INK,
                            letterSpacing: 1,
                          }}
                        >
                          {f.start_time.slice(0, 5)}
                        </div>
                      )}
                      {f.meet_time && (
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            color: '#aaa',
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                          }}
                        >
                          Meet {f.meet_time.slice(0, 5)}
                        </div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 16,
                marginBottom: 20,
                borderBottom: `2px solid ${C_INK}`,
                paddingBottom: 10,
              }}
            >
              <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5 }}>
                Results
              </div>
              <CMonoLabel size={10} color="#aaa" spacing={2}>
                {completed.length} match{completed.length !== 1 ? 'es' : ''}
              </CMonoLabel>
            </div>
            <div>
              {completed.map((f) => {
                const hasScorecard = scorecardSet.has(f.play_cricket_match_id ?? -1)
                const href = hasScorecard
                  ? `/candidates/c/fixtures/${f.id}`
                  : undefined

                const row = (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '72px 1fr auto',
                      gap: 24,
                      alignItems: 'center',
                      padding: '16px 24px',
                      borderBottom: `1px dashed ${C_RULE}`,
                      background: '#fff',
                    }}
                  >
                    <CDateStack dateStr={f.match_date} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: display,
                          fontSize: 'clamp(16px, 2.5vw, 22px)',
                          fontWeight: 500,
                          letterSpacing: -0.3,
                          lineHeight: 1.1,
                          color: C_INK,
                        }}
                      >
                        <CVs /> {f.opponent}
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 3 }}>
                        {f.venue}
                        {f.competition && (
                          <span style={{ marginLeft: 8 }}>{f.competition}</span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 8,
                        flexShrink: 0,
                      }}
                    >
                      {f.result_text ? (
                        <CResultPill result={f.result_text} />
                      ) : (
                        <CMonoLabel size={10} color="#ccc">No result</CMonoLabel>
                      )}
                      <CHomeAwayChip homeAway={f.home_away} />
                      {hasScorecard && (
                        <span
                          style={{
                            fontFamily: mono,
                            fontSize: 10,
                            letterSpacing: 1.5,
                            textTransform: 'uppercase',
                            color: C_RED,
                            fontWeight: 700,
                          }}
                        >
                          Scorecard →
                        </span>
                      )}
                    </div>
                  </div>
                )

                return href ? (
                  <Link
                    key={f.id}
                    href={href}
                    style={{ textDecoration: 'none', display: 'block' }}
                    className="c-fixture-row"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={f.id}>{row}</div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .c-fixture-row:hover { background: #fdf9f2 !important; }
        .c-fixture-row:hover > div { background: #fdf9f2 !important; }
        @media (max-width: 640px) {
          .c-fixture-row { grid-template-columns: 56px 1fr auto !important; gap: 12px !important; }
        }
      `}</style>
    </div>
  )
}
