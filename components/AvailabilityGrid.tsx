'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { Player, Fixture, Availability } from '@/lib/supabase'
import MatchDetail from './MatchDetail'
import AddRinginModal from './AddRinginModal'
import StatusPicker from './StatusPicker'
import PlayerSearch from './PlayerSearch'
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

type AvailabilityMap = Record<number, Record<number, string>>
type SelectionMap = Record<number, Record<number, boolean>>

const C_AMBER = '#b45309'
const C_AMBER_BD = '#fbbf24'

// C-theme status colours (inline style based)
const STATUS_C: Record<string, { bg: string; bd: string; tx: string; sy: string }> = {
  none:        { bg: C_CREAM,    bd: C_RULE,      tx: '#ccc',     sy: '·'  },
  available:   { bg: '#f0fdf4',  bd: C_GREEN,     tx: C_GREEN,    sy: '✓'  },
  unavailable: { bg: '#fff5f5',  bd: C_RED,       tx: C_RED,      sy: '✗'  },
  tentative:   { bg: '#fffbeb',  bd: C_AMBER_BD,  tx: C_AMBER,    sy: '?'  },
}

// Role display using C mono style
const ROLE_BG: Record<string, string> = {
  BAT:  C_GREEN,
  BOWL: C_RED,
  AR:   '#6d28d9',
  WK:   '#0f766e',
}

const ROLES = ['BAT', 'BOWL', 'AR', 'WK'] as const

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return { month: months[d.getMonth()].toUpperCase(), day: d.getDate().toString() }
}

function PlayerRow({
  player,
  fixtures,
  avMap,
  hoveredPlayer,
  setHoveredPlayer,
  onCellClick,
  onRoleChange,
}: {
  player: Player
  fixtures: Fixture[]
  avMap: Record<number, string>
  hoveredPlayer: number | null
  setHoveredPlayer: (id: number | null) => void
  onCellClick: (playerId: number, fixtureId: number, e: React.MouseEvent) => void
  onRoleChange: (playerId: number, role: string) => void
}) {
  const isHovered = hoveredPlayer === player.id

  const cycleRole = () => {
    const idx = ROLES.indexOf(player.role as typeof ROLES[number])
    const next = ROLES[(idx + 1) % ROLES.length]
    onRoleChange(player.id, next)
  }

  const rowBg = isHovered ? '#f5f2eb' : 'transparent'

  return (
    <tr
      onMouseEnter={() => setHoveredPlayer(player.id)}
      onMouseLeave={() => setHoveredPlayer(null)}
      style={{ background: rowBg, transition: 'background 0.1s' }}
    >
      {/* Sticky name cell */}
      <td
        style={{
          position: 'sticky',
          left: 0,
          zIndex: 10,
          padding: '5px 10px 5px 8px',
          whiteSpace: 'nowrap',
          borderBottom: `1px dashed ${C_RULE}`,
          background: isHovered ? '#f5f2eb' : '#fff',
          transition: 'background 0.1s',
          minWidth: 160,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Role badge */}
          <button
            onClick={cycleRole}
            title="Click to change role"
            style={{
              width: 28,
              height: 18,
              background: player.is_ringin ? 'transparent' : ROLE_BG[player.role] || C_GREEN,
              border: player.is_ringin
                ? `1.5px dashed ${ROLE_BG[player.role] || C_GREEN}`
                : 'none',
              color: player.is_ringin ? (ROLE_BG[player.role] || C_GREEN) : '#fff',
              fontFamily: mono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'opacity 0.1s',
            }}
          >
            {player.role}
          </button>

          {/* Player name */}
          <div
            style={{
              fontFamily: display,
              fontSize: 15,
              fontStyle: 'italic',
              fontWeight: 400,
              color: player.is_ringin ? '#999' : C_INK,
              lineHeight: 1.2,
            }}
          >
            {player.name.split(' ')[0]}{' '}
            <span style={{ color: '#aaa', fontStyle: 'normal', fontSize: 13 }}>
              {player.name.split(' ').slice(1).join(' ')}
            </span>
          </div>

          {player.is_ringin && (
            <span
              style={{
                fontFamily: mono,
                fontSize: 8,
                color: C_GREEN,
                border: `1px solid ${C_GREEN}`,
                padding: '1px 4px',
                letterSpacing: 1,
                textTransform: 'uppercase',
                lineHeight: 1.3,
                flexShrink: 0,
              }}
            >
              RI
            </span>
          )}
        </div>
      </td>

      {/* Status cells */}
      {fixtures.map((fx) => {
        const st = avMap[fx.id] || 'none'
        const s = STATUS_C[st]
        return (
          <td
            key={fx.id}
            onClick={(e) => onCellClick(player.id, fx.id, e)}
            style={{
              padding: 2,
              textAlign: 'center',
              cursor: 'pointer',
              borderBottom: `1px dashed ${C_RULE}`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: 26,
                border: `1px solid ${s.bd}`,
                borderStyle: player.is_ringin ? 'dashed' : 'solid',
                background: s.bg,
                color: s.tx,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.1s',
              }}
            >
              {s.sy}
            </div>
          </td>
        )
      })}
    </tr>
  )
}

export default function AvailabilityGrid({
  allPlayers,
  initialFixtures,
  initialAvailability,
}: {
  allPlayers: Player[]
  initialFixtures: Fixture[]
  initialAvailability: Availability[]
}) {
  const buildAvMap = (avList: Availability[]): AvailabilityMap => {
    const map: AvailabilityMap = {}
    avList.forEach((a) => {
      if (!map[a.player_id]) map[a.player_id] = {}
      map[a.player_id][a.fixture_id] = a.status
    })
    return map
  }

  const buildSelMap = (avList: Availability[]): SelectionMap => {
    const map: SelectionMap = {}
    avList.forEach((a) => {
      if (a.selected) {
        if (!map[a.player_id]) map[a.player_id] = {}
        map[a.player_id][a.fixture_id] = true
      }
    })
    return map
  }

  const [fixtures, setFixtures] = useState<Fixture[]>(initialFixtures)
  const [avMap, setAvMap] = useState<AvailabilityMap>(buildAvMap(initialAvailability))
  const [selMap, setSelMap] = useState<SelectionMap>(buildSelMap(initialAvailability))
  const [activatedPlayerIds, setActivatedPlayerIds] = useState<Set<number>>(() => {
    const ids = new Set<number>()
    initialAvailability.forEach((a) => ids.add(a.player_id))
    return ids
  })
  const [picker, setPicker] = useState<{ pid: number; fid: number; x: number; y: number } | null>(null)
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null)
  const [showAddRingin, setShowAddRingin] = useState(false)
  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null)
  const [newRingins, setNewRingins] = useState<Player[]>([])
  const [roleOverrides, setRoleOverrides] = useState<Record<number, string>>({})

  const activePlayers = [
    ...allPlayers.filter((p) => activatedPlayerIds.has(p.id)),
    ...newRingins,
  ].map((p) => (roleOverrides[p.id] ? { ...p, role: roleOverrides[p.id] as Player['role'] } : p))

  const onCellClick = (playerId: number, fixtureId: number, e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPicker({
      pid: playerId,
      fid: fixtureId,
      x: r.left + r.width / 2 - 75,
      y: r.bottom + 4,
    })
  }

  const onPick = async (status: string) => {
    if (!picker) return
    setAvMap((prev) => ({
      ...prev,
      [picker.pid]: { ...prev[picker.pid], [picker.fid]: status },
    }))
    setPicker(null)
    try {
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: picker.pid,
          fixture_id: picker.fid,
          status,
        }),
      })
    } catch (err) {
      console.error('Failed to save availability:', err)
    }
  }

  const toggleSelection = useCallback(async (playerId: number, fixtureId: number) => {
    const current = selMap[playerId]?.[fixtureId] || false
    const newVal = !current
    setSelMap((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [fixtureId]: newVal },
    }))
    try {
      await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: playerId,
          fixture_id: fixtureId,
          status: avMap[playerId]?.[fixtureId] || 'available',
          selected: newVal,
        }),
      })
    } catch (err) {
      console.error('Failed to save selection:', err)
    }
  }, [selMap, avMap])

  const onActivatePlayer = (player: Player) => {
    setActivatedPlayerIds((prev) => new Set([...prev, player.id]))
  }

  const addRingin = useCallback(async (name: string, role: string) => {
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, is_ringin: true }),
      })
      const newPlayer = await res.json()
      if (newPlayer.id) {
        setNewRingins((prev) => [...prev, newPlayer])
      }
    } catch (err) {
      console.error('Failed to add ring-in:', err)
    }
  }, [])

  const changeRole = useCallback(async (playerId: number, role: string) => {
    setRoleOverrides((prev) => ({ ...prev, [playerId]: role }))
    try {
      await fetch('/api/players', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, role }),
      })
    } catch (err) {
      console.error('Failed to change role:', err)
    }
  }, [])

  const updateFixture = useCallback((fixtureId: number, updates: Partial<Fixture>) => {
    setFixtures((prev) =>
      prev.map((f) => (f.id === fixtureId ? { ...f, ...updates } : f))
    )
    setSelectedFixture((prev) => (prev && prev.id === fixtureId ? { ...prev, ...updates } : prev))
  }, [])

  const promotePlayer = useCallback(async (playerId: number, demote = false) => {
    try {
      await fetch('/api/players', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: playerId, is_ringin: demote }),
      })
    } catch (err) {
      console.error('Failed to update player:', err)
    }
  }, [])

  const cnt = (fid: number, status: string) =>
    activePlayers.filter((p) => (avMap[p.id]?.[fid] || 'none') === status).length

  const members = activePlayers.filter((p) => !p.is_ringin)
  const ringins = activePlayers.filter((p) => p.is_ringin)

  return (
    <div style={{ background: C_CREAM, minHeight: '100vh', fontFamily: sansTight, color: C_INK }}>

      {/* Page header band */}
      <div style={{ background: C_GREEN }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {/* Badge */}
            <Image
              src="/images/badge.png"
              alt="St Lawrence CC"
              width={100}
              height={36}
              style={{ height: 32, width: 'auto', filter: 'invert(1)' }}
            />

            {/* Title block */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 3,
                  color: C_RED,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                — Availability
              </div>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 22,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: '#fff',
                  lineHeight: 1.1,
                  letterSpacing: -0.3,
                }}
              >
                Pick the XI.
              </div>
              <div
                style={{
                  fontFamily: sansTight,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 2,
                }}
              >
                2026 · 1st XI Availability
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <PlayerSearch
                allPlayers={allPlayers}
                activePlayers={activePlayers}
                onActivate={onActivatePlayer}
              />
              <button
                onClick={() => setShowAddRingin(true)}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: `1px solid rgba(255,255,255,0.35)`,
                  color: '#fff',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s',
                }}
              >
                + Ring-In
              </button>
            </div>
          </div>

          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              alignItems: 'center',
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {([
              ['available', 'Available', C_GREEN, '#f0fdf4'],
              ['tentative', 'Tentative', C_AMBER_BD, '#fffbeb'],
              ['unavailable', 'Unavailable', C_RED, '#fff5f5'],
              ['none', 'No response', C_RULE, C_CREAM],
            ] as [string, string, string, string][]).map(([k, l, bd, bg]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    border: `1.5px solid ${bd}`,
                    background: bg,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.55)',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {l}
                </span>
              </div>
            ))}
            <div
              style={{
                marginLeft: 'auto',
                fontFamily: mono,
                fontSize: 9,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: 1,
              }}
            >
              Tap cell = status · Tap column header = match detail
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {activePlayers.length === 0 && (
        <div style={{ maxWidth: 1500, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏏</div>
          <div
            style={{
              fontFamily: display,
              fontSize: 26,
              fontStyle: 'italic',
              color: C_INK,
              marginBottom: 8,
            }}
          >
            No players on the grid yet
          </div>
          <p style={{ fontFamily: sansTight, fontSize: 14, color: '#888', marginBottom: 16 }}>
            Click &ldquo;+ I&apos;m Playing&rdquo; to find your name and start setting availability.
          </p>
        </div>
      )}

      {/* Grid */}
      {activePlayers.length > 0 && (
        <div
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxWidth: 1500,
            margin: '0 auto',
            padding: '0 16px 32px',
            maxHeight: 'calc(100vh - 170px)',
          }}
        >
          <table
            style={{
              borderCollapse: 'separate',
              borderSpacing: 1,
              width: 'max-content',
              minWidth: '100%',
            }}
          >
            <thead>
              <tr>
                {/* Player column header */}
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 20,
                    background: '#fff',
                    padding: '10px 10px',
                    textAlign: 'left',
                    borderBottom: `2px solid ${C_RULE}`,
                    minWidth: 160,
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: 2,
                    color: '#aaa',
                    textTransform: 'uppercase',
                  }}
                >
                  Player
                </th>

                {/* Fixture column headers */}
                {fixtures.map((f) => {
                  const { month, day } = formatDate(f.match_date)
                  const a = cnt(f.id, 'available')
                  const t = cnt(f.id, 'tentative')
                  const tot = a + t
                  const isHome = f.home_away === 'H'
                  return (
                    <th
                      key={f.id}
                      onClick={() => setSelectedFixture(f)}
                      style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        background: '#fff',
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderBottom: `2px solid ${C_RULE}`,
                        padding: '6px 2px',
                        minWidth: 54,
                        maxWidth: 54,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C_CREAM)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                    >
                      <div style={{ fontFamily: mono, fontSize: 9, color: C_RED, fontWeight: 700, letterSpacing: 1 }}>
                        {month}
                      </div>
                      <div
                        style={{
                          fontFamily: display,
                          fontSize: 18,
                          fontWeight: 500,
                          color: C_INK,
                          lineHeight: 1,
                        }}
                      >
                        {day}
                      </div>
                      <div
                        style={{
                          fontFamily: sansTight,
                          fontSize: 8,
                          color: '#999',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 50,
                        }}
                      >
                        {f.opponent.length > 9 ? f.opponent.substring(0, 8) + '…' : f.opponent}
                      </div>
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 8,
                          fontWeight: 700,
                          color: isHome ? C_GREEN : C_RED,
                          letterSpacing: 0.5,
                        }}
                      >
                        {f.home_away}
                      </div>
                      {(f.meet_time || f.start_time) && (
                        <div style={{ fontFamily: mono, fontSize: 7, color: '#bbb', lineHeight: 1.3, marginTop: 1 }}>
                          {f.meet_time ? f.meet_time.slice(0, 5) : ''}
                          {f.meet_time && f.start_time ? '/' : ''}
                          {f.start_time ? f.start_time.slice(0, 5) : ''}
                        </div>
                      )}
                      {/* Count badge */}
                      <div
                        style={{
                          marginTop: 3,
                          fontFamily: mono,
                          fontSize: 10,
                          fontWeight: 700,
                          color: tot < 11 ? C_RED : C_GREEN,
                          background: tot < 11 ? '#fff5f5' : '#f0fdf4',
                          padding: '1px 4px',
                          display: 'inline-block',
                        }}
                      >
                        {a}
                        {t > 0 && (
                          <span style={{ color: C_AMBER, fontSize: 9 }}>+{t}</span>
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {members.map((pl) => (
                <PlayerRow
                  key={pl.id}
                  player={pl}
                  fixtures={fixtures}
                  avMap={avMap[pl.id] || {}}
                  hoveredPlayer={hoveredPlayer}
                  setHoveredPlayer={setHoveredPlayer}
                  onCellClick={onCellClick}
                  onRoleChange={changeRole}
                />
              ))}

              {/* Ring-ins divider */}
              {ringins.length > 0 && (
                <tr>
                  <td
                    colSpan={fixtures.length + 1}
                    style={{ padding: '10px 8px 4px' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontFamily: mono,
                        fontSize: 9,
                        color: C_GREEN,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        opacity: 0.7,
                      }}
                    >
                      <div style={{ height: 1, flex: 1, background: C_RULE }} />
                      Ring-ins
                      <div style={{ height: 1, flex: 1, background: C_RULE }} />
                    </div>
                  </td>
                </tr>
              )}

              {ringins.map((pl) => (
                <PlayerRow
                  key={pl.id}
                  player={pl}
                  fixtures={fixtures}
                  avMap={avMap[pl.id] || {}}
                  hoveredPlayer={hoveredPlayer}
                  setHoveredPlayer={setHoveredPlayer}
                  onCellClick={onCellClick}
                  onRoleChange={changeRole}
                />
              ))}
            </tbody>

            {/* Footer totals */}
            <tfoot>
              <tr>
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 10,
                    background: '#fff',
                    padding: '8px 10px',
                    borderTop: `2px solid ${C_RULE}`,
                    fontFamily: mono,
                    fontSize: 9,
                    letterSpacing: 2,
                    color: '#aaa',
                    textTransform: 'uppercase',
                  }}
                >
                  Total
                </td>
                {fixtures.map((f) => {
                  const a = cnt(f.id, 'available')
                  const t = cnt(f.id, 'tentative')
                  const tot = a + t
                  const ok = tot >= 11
                  const mid = tot >= 9 && tot < 11
                  const borderCol = ok ? C_GREEN : mid ? C_AMBER_BD : C_RED
                  const textCol = ok ? C_GREEN : mid ? C_AMBER : C_RED
                  const bgCol = ok ? '#f0fdf4' : mid ? '#fffbeb' : '#fff5f5'
                  return (
                    <td
                      key={f.id}
                      style={{
                        textAlign: 'center',
                        padding: '4px 2px',
                        borderTop: `2px solid ${C_RULE}`,
                      }}
                    >
                      <div
                        style={{
                          border: `1px solid ${borderCol}`,
                          background: bgCol,
                          padding: '4px 0',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: display,
                            fontSize: 18,
                            fontWeight: 500,
                            color: textCol,
                            lineHeight: 1,
                          }}
                        >
                          {a}
                        </div>
                        <div
                          style={{
                            fontFamily: mono,
                            fontSize: 8,
                            fontWeight: 700,
                            color: textCol,
                            letterSpacing: 0.5,
                            opacity: 0.8,
                          }}
                        >
                          {ok ? '✓ XI' : `need ${11 - tot}`}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modals */}
      {picker && (
        <StatusPicker pos={{ x: picker.x, y: picker.y }} onPick={onPick} onClose={() => setPicker(null)} />
      )}
      {selectedFixture && (
        <MatchDetail
          fixture={selectedFixture}
          avMap={avMap}
          selMap={selMap}
          players={activePlayers}
          onClose={() => setSelectedFixture(null)}
          onPromote={promotePlayer}
          onToggleSelection={toggleSelection}
          onUpdateFixture={updateFixture}
        />
      )}
      {showAddRingin && (
        <AddRinginModal onAdd={addRingin} onClose={() => setShowAddRingin(false)} />
      )}
    </div>
  )
}
