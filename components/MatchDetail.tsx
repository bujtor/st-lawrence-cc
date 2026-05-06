'use client'

import { useState } from 'react'
import type { Player, Fixture } from '@/lib/supabase'
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
} from '@/lib/c-theme/tokens'

const C_AMBER = '#b45309'
const C_AMBER_BG = '#fffbeb'
const C_AMBER_BD = '#fbbf24'
const C_INDIGO = '#4338ca'
const C_INDIGO_BG = '#eef2ff'
const C_INDIGO_BD = '#a5b4fc'

type AvailabilityMap = Record<number, Record<number, string>>
type SelectionMap = Record<number, Record<number, boolean>>

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

function shortName(p: Player) {
  const parts = p.name.split(' ')
  return `${parts[0]} ${(parts[1] || '')[0]}${parts[1] ? '.' : ''}`
}

function PlayerChip({
  p,
  avMap,
  fixtureId,
  isSelected,
  onToggle,
  selectingXI,
}: {
  p: Player
  avMap: AvailabilityMap
  fixtureId: number
  isSelected: boolean
  onToggle?: () => void
  selectingXI?: boolean
}) {
  const isTentative = avMap[p.id]?.[fixtureId] === 'tentative'
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    fontFamily: sansTight,
    fontSize: 12,
    fontStyle: 'italic',
    cursor: onToggle ? 'pointer' : 'default',
    border: '1px solid',
    transition: 'all 0.1s',
  }

  if (selectingXI && onToggle) {
    return (
      <button
        onClick={onToggle}
        style={{
          ...baseStyle,
          background: isSelected ? C_GREEN : '#fff',
          borderColor: isSelected ? C_GREEN : C_RULE,
          color: isSelected ? '#fff' : C_INK,
        }}
      >
        {isSelected && '✓ '}
        {shortName(p)}
        {p.is_ringin && (
          <span
            style={{
              fontFamily: mono,
              fontSize: 9,
              background: isSelected ? C_GREEN_LT : '#e6f4ea',
              color: isSelected ? '#fff' : C_GREEN,
              padding: '1px 4px',
              letterSpacing: 1,
              fontStyle: 'normal',
            }}
          >
            RI
          </span>
        )}
        {isTentative && (
          <span
            style={{
              fontFamily: mono,
              fontSize: 9,
              background: isSelected ? '#5b52e0' : C_AMBER_BG,
              color: isSelected ? '#fff' : C_AMBER,
              padding: '1px 4px',
              letterSpacing: 1,
              fontStyle: 'normal',
            }}
          >
            TBC
          </span>
        )}
      </button>
    )
  }

  return (
    <span style={{ ...baseStyle, cursor: 'default' }}>
      {shortName(p)}
      {p.is_ringin && (
        <span
          style={{
            fontFamily: mono,
            fontSize: 9,
            background: '#e6f4ea',
            color: C_GREEN,
            padding: '1px 4px',
            letterSpacing: 1,
            fontStyle: 'normal',
          }}
        >
          RI
        </span>
      )}
      {isTentative && (
        <span
          style={{
            fontFamily: mono,
            fontSize: 9,
            background: C_AMBER_BG,
            color: C_AMBER,
            padding: '1px 4px',
            letterSpacing: 1,
            fontStyle: 'normal',
          }}
        >
          TBC
        </span>
      )}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: 10,
        letterSpacing: 2,
        color: '#888',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 2,
      }}
    >
      {children}
    </div>
  )
}

export default function MatchDetail({
  fixture,
  avMap,
  selMap,
  players,
  onClose,
  onPromote,
  onToggleSelection,
  onUpdateFixture,
}: {
  fixture: Fixture
  avMap: AvailabilityMap
  selMap: SelectionMap
  players: Player[]
  onClose: () => void
  onPromote: (playerId: number, demote?: boolean) => void
  onToggleSelection: (playerId: number, fixtureId: number) => void
  onUpdateFixture?: (fixtureId: number, updates: Partial<Fixture>) => void
}) {
  const [copied, setCopied] = useState(false)
  const [selectingXI, setSelectingXI] = useState(false)
  const [editingTimes, setEditingTimes] = useState(false)
  const [meetTime, setMeetTime] = useState(fixture.meet_time?.slice(0, 5) || '')
  const [startTime, setStartTime] = useState(fixture.start_time?.slice(0, 5) || '')

  const saveTimes = async () => {
    setEditingTimes(false)
    const updates: Partial<Fixture> = {
      meet_time: meetTime || null,
      start_time: startTime || null,
    }
    onUpdateFixture?.(fixture.id, updates)
    try {
      await fetch('/api/fixtures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fixture.id, meet_time: meetTime || null, start_time: startTime || null }),
      })
    } catch (err) {
      console.error('Failed to save times:', err)
    }
  }

  const yes = players.filter((p) => avMap[p.id]?.[fixture.id] === 'available')
  const maybe = players.filter((p) => avMap[p.id]?.[fixture.id] === 'tentative')
  const no = players.filter((p) => avMap[p.id]?.[fixture.id] === 'unavailable')
  const quiet = players.filter(
    (p) => !avMap[p.id]?.[fixture.id] || avMap[p.id]?.[fixture.id] === 'none'
  )
  const total = yes.length + maybe.length
  const mapsUrl =
    fixture.lat && fixture.lng
      ? `https://www.google.com/maps?q=${fixture.lat},${fixture.lng}`
      : null

  const isSelected = (pid: number) => selMap[pid]?.[fixture.id] || false
  const selectable = [...yes, ...maybe]
  const selectedCount = selectable.filter((p) => isSelected(p.id)).length

  const copyTeamList = () => {
    const xi = selectable.filter((p) => isSelected(p.id))
    const reserves = selectable.filter((p) => !isSelected(p.id))
    const hasXI = xi.length > 0

    const lines = [
      `🏏 *St Lawrence CC vs ${fixture.opponent}*`,
      `📅 ${formatMatchDate(fixture.match_date)}`,
      `⏰ Meet ${meetTime || '--:--'} · Start ${startTime || '--:--'}`,
      `📍 ${fixture.venue} (${fixture.home_away === 'H' ? 'Home' : 'Away'})`,
    ]
    if (mapsUrl) lines.push(`🗺️ ${mapsUrl}`)

    if (hasXI) {
      lines.push('', `*Playing XI (${xi.length}):*`)
      xi.forEach((p, i) => {
        let s = `${i + 1}. ${p.name}`
        if (p.is_ringin) s += ' _(ring-in)_'
        if (avMap[p.id]?.[fixture.id] === 'tentative') s += ' _(tbc)_'
        lines.push(s)
      })
      if (reserves.length > 0) {
        lines.push('', `*Reserves:*`)
        reserves.forEach((p) => {
          let s = `• ${p.name}`
          if (p.is_ringin) s += ' _(ring-in)_'
          if (avMap[p.id]?.[fixture.id] === 'tentative') s += ' _(tbc)_'
          lines.push(s)
        })
      }
    } else {
      lines.push('', `*Squad (${selectable.length}):*`)
      selectable.forEach((p, i) => {
        let s = `${i + 1}. ${p.name}`
        if (p.is_ringin) s += ' _(ring-in)_'
        if (avMap[p.id]?.[fixture.id] === 'tentative') s += ' _(tbc)_'
        lines.push(s)
      })
    }

    if (total < 11) {
      lines.push('', `⚠️ Still need ${11 - total} more — let me know if you can play!`)
    }
    if (quiet.length > 0) {
      lines.push('', `❓ Not heard from: ${quiet.map((p) => p.name.split(' ')[0]).join(', ')}`)
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const isHome = fixture.home_away === 'H'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: `1px solid ${C_RULE}`,
          maxWidth: 460,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: C_GREEN,
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 3,
                color: C_RED,
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              — {formatMatchDate(fixture.match_date)} &middot;{' '}
              <span
                style={{
                  background: isHome ? 'rgba(255,255,255,0.15)' : C_RED,
                  padding: '1px 6px',
                  letterSpacing: 2,
                }}
              >
                {isHome ? 'Home' : 'Away'}
              </span>
            </div>
            <div
              style={{
                fontFamily: display,
                fontSize: 22,
                fontStyle: 'italic',
                fontWeight: 400,
                color: '#fff',
                lineHeight: 1.1,
              }}
            >
              <span style={{ fontStyle: 'normal', opacity: 0.6, fontSize: 16 }}>v. </span>
              {fixture.opponent}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 24,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0 0 0 12px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', background: C_CREAM, flexGrow: 1 }}>

          {/* Time row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {editingTimes ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#fff',
                  border: `1px solid ${C_RULE}`,
                  padding: '8px 12px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontFamily: mono, fontSize: 10, color: '#888', letterSpacing: 1 }}>MEET</span>
                <input
                  type="time"
                  value={meetTime}
                  onChange={(e) => setMeetTime(e.target.value)}
                  style={{
                    border: `1px solid ${C_RULE}`,
                    padding: '3px 6px',
                    fontFamily: mono,
                    fontSize: 12,
                    color: C_INK,
                    outline: 'none',
                    width: 80,
                  }}
                />
                <span style={{ fontFamily: mono, fontSize: 10, color: '#888', letterSpacing: 1 }}>START</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{
                    border: `1px solid ${C_RULE}`,
                    padding: '3px 6px',
                    fontFamily: mono,
                    fontSize: 12,
                    color: C_INK,
                    outline: 'none',
                    width: 80,
                  }}
                />
                <button
                  onClick={saveTimes}
                  style={{
                    background: C_GREEN,
                    border: 'none',
                    color: '#fff',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    letterSpacing: 1,
                  }}
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => setEditingTimes(false)}
                  style={{
                    background: 'none',
                    border: `1px solid ${C_RULE}`,
                    color: '#888',
                    fontFamily: mono,
                    fontSize: 11,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  ✗
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingTimes(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#fff',
                  border: `1px solid ${C_RULE}`,
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontFamily: sansTight,
                  fontSize: 13,
                  color: '#666',
                  transition: 'border-color 0.1s',
                }}
              >
                ⏰ Meet{' '}
                <strong style={{ color: C_INK, fontFamily: mono, fontSize: 12 }}>
                  {meetTime || '--:--'}
                </strong>{' '}
                · Start{' '}
                <strong style={{ color: C_INK, fontFamily: mono, fontSize: 12 }}>
                  {startTime || '--:--'}
                </strong>
                <span style={{ color: '#bbb', fontSize: 11, marginLeft: 4 }}>✎</span>
              </button>
            )}

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#fff',
                  border: `1px solid ${C_RULE}`,
                  padding: '7px 12px',
                  fontFamily: sansTight,
                  fontSize: 13,
                  color: C_GREEN,
                  textDecoration: 'none',
                  transition: 'border-color 0.1s',
                }}
              >
                📍 {fixture.venue} ↗
              </a>
            )}
          </div>

          {/* Counts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                borderLeft: `3px solid ${C_GREEN}`,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: display,
                  fontSize: 28,
                  fontWeight: 500,
                  color: C_GREEN,
                  lineHeight: 1,
                }}
              >
                {yes.length}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C_GREEN, textTransform: 'uppercase', marginTop: 4 }}>
                Available
              </div>
            </div>
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                borderLeft: `3px solid ${C_AMBER_BD}`,
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  fontFamily: display,
                  fontSize: 28,
                  fontWeight: 500,
                  color: C_AMBER,
                  lineHeight: 1,
                }}
              >
                {maybe.length}
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 2, color: C_AMBER, textTransform: 'uppercase', marginTop: 4 }}>
                Tentative
              </div>
            </div>
          </div>

          {/* Status banner */}
          {total >= 11 ? (
            <div
              style={{
                background: '#f0fdf4',
                border: `1px solid ${C_GREEN}`,
                borderLeft: `3px solid ${C_GREEN}`,
                padding: '8px 14px',
                marginBottom: 14,
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: C_GREEN,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              ✓ Got a team{selectedCount > 0 && ` · ${selectedCount} selected`}
            </div>
          ) : (
            <div
              style={{
                background: '#fff5f5',
                border: `1px solid ${C_RED}`,
                borderLeft: `3px solid ${C_RED}`,
                padding: '8px 14px',
                marginBottom: 14,
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: C_RED,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              Need {11 - total} more · {quiet.length} no response
            </div>
          )}

          {/* Select XI toggle */}
          {selectable.length > 0 && (
            <button
              onClick={() => setSelectingXI(!selectingXI)}
              style={{
                width: '100%',
                padding: '10px 0',
                background: selectingXI ? C_GREEN : '#fff',
                border: `1px solid ${selectingXI ? C_GREEN : C_RULE}`,
                color: selectingXI ? '#fff' : '#666',
                fontFamily: mono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                marginBottom: 14,
                transition: 'all 0.15s',
              }}
            >
              {selectingXI
                ? `Selecting XI (${selectedCount}/11) — tap players below`
                : selectedCount > 0
                  ? `XI Selected (${selectedCount}) — tap to edit`
                  : 'Select Playing XI'}
            </button>
          )}

          {/* XI selection mode */}
          {selectingXI && (
            <div
              style={{
                marginBottom: 14,
                border: `1px solid ${C_RULE}`,
                padding: '12px',
                background: '#fff',
              }}
            >
              <SectionLabel>Tap to select / deselect</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectable.map((p) => (
                  <PlayerChip
                    key={p.id}
                    p={p}
                    avMap={avMap}
                    fixtureId={fixture.id}
                    isSelected={isSelected(p.id)}
                    onToggle={() => onToggleSelection(p.id, fixture.id)}
                    selectingXI
                  />
                ))}
              </div>
              {selectedCount > 11 && (
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 11,
                    color: C_RED,
                    marginTop: 8,
                    letterSpacing: 1,
                  }}
                >
                  {selectedCount} selected — that&apos;s more than XI
                </div>
              )}
            </div>
          )}

          {/* Player lists */}
          {!selectingXI && (
            <>
              {selectedCount > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>Playing XI</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {selectable.filter((p) => isSelected(p.id)).map((p) => (
                      <PlayerChip key={p.id} p={p} avMap={avMap} fixtureId={fixture.id} isSelected />
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const list = selectedCount > 0 ? yes.filter((p) => !isSelected(p.id)) : yes
                return list.length > 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    <SectionLabel>{selectedCount > 0 ? 'Reserves' : 'Available'}</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {list.map((p) => (
                        <PlayerChip key={p.id} p={p} avMap={avMap} fixtureId={fixture.id} isSelected={false} />
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {(() => {
                const list = selectedCount > 0 ? maybe.filter((p) => !isSelected(p.id)) : maybe
                return list.length > 0 ? (
                  <div style={{ marginBottom: 12 }}>
                    <SectionLabel>Tentative</SectionLabel>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {list.map((p) => (
                        <PlayerChip key={p.id} p={p} avMap={avMap} fixtureId={fixture.id} isSelected={false} />
                      ))}
                    </div>
                  </div>
                ) : null
              })()}

              {no.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>Unavailable</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {no.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          fontFamily: sansTight,
                          fontSize: 12,
                          fontStyle: 'italic',
                          border: `1px solid ${C_RULE}`,
                          color: C_RED,
                          background: '#fff5f5',
                        }}
                      >
                        {shortName(p)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {quiet.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <SectionLabel>No Response</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {quiet.map((p) => (
                      <span
                        key={p.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 10px',
                          fontFamily: sansTight,
                          fontSize: 12,
                          fontStyle: 'italic',
                          border: `1px solid ${C_RULE}`,
                          color: '#aaa',
                          background: C_CREAM,
                        }}
                      >
                        {shortName(p)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Copy button */}
          <div style={{ borderTop: `1px solid ${C_RULE}`, marginTop: 8, paddingTop: 16 }}>
            <button
              onClick={copyTeamList}
              style={{
                width: '100%',
                padding: '12px 22px',
                background: C_GREEN,
                border: 'none',
                color: '#fff',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.15s',
              }}
            >
              📋 {selectedCount > 0 ? 'Copy XI for WhatsApp' : 'Copy Team List for WhatsApp'}
            </button>
            {copied && (
              <div
                style={{
                  marginTop: 10,
                  textAlign: 'center',
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  color: C_GREEN,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                ✓ Copied! Paste into WhatsApp
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
