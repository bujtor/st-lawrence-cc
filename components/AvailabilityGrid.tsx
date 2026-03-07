'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import type { Player, Fixture, Availability } from '@/lib/supabase'
import MatchDetail from './MatchDetail'
import AddRinginModal from './AddRinginModal'
import StatusPicker from './StatusPicker'
import PlayerSearch from './PlayerSearch'

type AvailabilityMap = Record<number, Record<number, string>>

const STATUS_STYLES: Record<string, { bg: string; bd: string; tx: string; sy: string }> = {
  none: { bg: 'bg-gray-50', bd: 'border-gray-200', tx: 'text-gray-300', sy: '' },
  available: { bg: 'bg-emerald-50', bd: 'border-emerald-400', tx: 'text-emerald-700', sy: '\u2713' },
  unavailable: { bg: 'bg-red-50', bd: 'border-red-400', tx: 'text-red-600', sy: '\u2717' },
  tentative: { bg: 'bg-amber-50', bd: 'border-amber-400', tx: 'text-amber-700', sy: '?' },
}

const ROLE_COLOURS: Record<string, string> = {
  BAT: 'text-sky-700 border-sky-200 bg-sky-50',
  BOWL: 'text-rose-700 border-rose-200 bg-rose-50',
  AR: 'text-violet-700 border-violet-200 bg-violet-50',
  WK: 'text-teal-700 border-teal-200 bg-teal-50',
}

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
}: {
  player: Player
  fixtures: Fixture[]
  avMap: Record<number, string>
  hoveredPlayer: number | null
  setHoveredPlayer: (id: number | null) => void
  onCellClick: (playerId: number, fixtureId: number, e: React.MouseEvent) => void
}) {
  const isHovered = hoveredPlayer === player.id

  return (
    <tr
      onMouseEnter={() => setHoveredPlayer(player.id)}
      onMouseLeave={() => setHoveredPlayer(null)}
      className={`transition-colors ${isHovered ? 'bg-emerald-50/50' : ''}`}
    >
      <td
        className={`sticky left-0 z-10 px-2.5 py-1.5 whitespace-nowrap border-b border-gray-100 transition-colors ${
          isHovered ? 'bg-emerald-50/50' : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-5 rounded flex items-center justify-center text-[9px] font-bold font-mono border ${
              player.is_ringin ? 'border-dashed' : ''
            } ${ROLE_COLOURS[player.role]}`}
          >
            {player.role}
          </div>
          <div className={`text-[13px] font-medium ${player.is_ringin ? 'text-gray-500' : 'text-gray-800'}`}>
            {player.name.split(' ')[0]}{' '}
            <span className="text-gray-400 font-normal">{player.name.split(' ').slice(1).join(' ')}</span>
          </div>
          {player.is_ringin && (
            <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1 rounded font-semibold leading-tight">
              RI
            </span>
          )}
        </div>
      </td>
      {fixtures.map((fx) => {
        const st = avMap[fx.id] || 'none'
        const s = STATUS_STYLES[st]
        return (
          <td
            key={fx.id}
            onClick={(e) => onCellClick(player.id, fx.id, e)}
            className="p-px text-center cursor-pointer border-b border-gray-100"
          >
            <div
              className={`w-full h-7 rounded border flex items-center justify-center text-xs font-bold ${
                player.is_ringin ? 'border-dashed' : ''
              } ${s.bg} ${s.bd} ${s.tx} transition-transform`}
              style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}
            >
              {s.sy || '\u00B7'}
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

  const [fixtures] = useState<Fixture[]>(initialFixtures)
  const [avMap, setAvMap] = useState<AvailabilityMap>(buildAvMap(initialAvailability))
  const [activatedPlayerIds, setActivatedPlayerIds] = useState<Set<number>>(() => {
    // Players who have any availability record are automatically active
    const ids = new Set<number>()
    initialAvailability.forEach((a) => ids.add(a.player_id))
    return ids
  })
  const [picker, setPicker] = useState<{ pid: number; fid: number; x: number; y: number } | null>(null)
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null)
  const [showAddRingin, setShowAddRingin] = useState(false)
  const [hoveredPlayer, setHoveredPlayer] = useState<number | null>(null)
  const [newRingins, setNewRingins] = useState<Player[]>([])

  // Active players = those in the squad who have set availability + any new ring-ins
  const activePlayers = [
    ...allPlayers.filter((p) => activatedPlayerIds.has(p.id)),
    ...newRingins,
  ]

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
    <div className="bg-white min-h-screen text-gray-800 font-sans">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 max-w-[1500px] mx-auto border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Image src="/images/badge.png" alt="St Lawrence CC" width={100} height={36} className="h-8 w-auto" />
          <div className="flex-1">
            <h1 className="text-base font-bold tracking-tight text-gray-900 m-0">
              St Lawrence CC
            </h1>
            <div className="text-[11px] text-gray-400 font-medium">2026 &middot; 1st XI Availability</div>
          </div>
          <PlayerSearch
            allPlayers={allPlayers}
            activePlayers={activePlayers}
            onActivate={onActivatePlayer}
          />
          <button
            onClick={() => setShowAddRingin(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
          >
            + Ring-In
          </button>
        </div>
        <div className="flex gap-4 flex-wrap items-center text-[11px] text-gray-400 font-medium pb-1">
          {[
            ['available', 'Available', 'bg-emerald-50 border-emerald-400'],
            ['tentative', 'Tentative', 'bg-amber-50 border-amber-400'],
            ['unavailable', 'Unavailable', 'bg-red-50 border-red-400'],
            ['none', 'No response', 'bg-gray-50 border-gray-200'],
          ].map(([k, l, c]) => (
            <div key={k} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border ${c}`} />
              {l}
            </div>
          ))}
          <div className="ml-auto text-gray-300 text-[10px]">
            Tap cell = status &middot; Tap column header = match detail
          </div>
        </div>
      </div>

      {/* Empty state */}
      {activePlayers.length === 0 && (
        <div className="max-w-[1500px] mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-4">{'\uD83C\uDFCF'}</div>
          <h2 className="text-lg font-bold text-gray-700 mb-2">No players on the grid yet</h2>
          <p className="text-sm text-gray-400 mb-4">
            Click &ldquo;+ I&apos;m Playing&rdquo; to find your name and start setting availability.
          </p>
        </div>
      )}

      {/* Grid */}
      {activePlayers.length > 0 && (
        <div
          className="overflow-x-auto overflow-y-auto mx-auto max-w-[1500px] px-4 pb-4"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          <table className="border-separate" style={{ borderSpacing: 1, width: 'max-content', minWidth: '100%' }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-20 bg-white px-2.5 py-1.5 text-left text-[10px] text-gray-400 font-semibold uppercase tracking-widest border-b-2 border-gray-200"
                  style={{ minWidth: 150 }}
                >
                  Player
                </th>
                {fixtures.map((f) => {
                  const { month, day } = formatDate(f.match_date)
                  const a = cnt(f.id, 'available')
                  const t = cnt(f.id, 'tentative')
                  const tot = a + t
                  return (
                    <th
                      key={f.id}
                      onClick={() => setSelectedFixture(f)}
                      className="sticky top-0 z-10 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors border-b-2 border-gray-200 px-0.5 py-1.5"
                      style={{ minWidth: 54, maxWidth: 54 }}
                    >
                      <div className="text-[9px] font-bold text-gray-400 leading-none">{month}</div>
                      <div className="text-[13px] font-extrabold text-gray-700 leading-tight">{day}</div>
                      <div className="text-[8px] text-gray-400 mt-px truncate">
                        {f.opponent.length > 9 ? f.opponent.substring(0, 8) + '\u2026' : f.opponent}
                      </div>
                      <div className={`text-[9px] font-bold ${f.home_away === 'H' ? 'text-emerald-600' : 'text-sky-600'}`}>
                        {f.home_away}
                      </div>
                      <div
                        className={`mt-0.5 text-[10px] font-extrabold font-mono rounded px-1 ${
                          tot < 11 ? 'text-red-500 bg-red-50' : 'text-emerald-700 bg-emerald-50'
                        }`}
                      >
                        {a}
                        {t > 0 && <span className="text-amber-600 text-[9px]">+{t}</span>}
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
                />
              ))}

              {ringins.length > 0 && (
                <tr>
                  <td colSpan={fixtures.length + 1} className="px-2.5 pt-2.5 pb-1">
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600/60 font-semibold uppercase tracking-widest">
                      <div className="h-px flex-1 bg-emerald-200/50" />
                      Ring-ins
                      <div className="h-px flex-1 bg-emerald-200/50" />
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
                />
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sticky left-0 z-10 bg-white px-2.5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t-2 border-gray-200">
                  Total
                </td>
                {fixtures.map((f) => {
                  const a = cnt(f.id, 'available')
                  const t = cnt(f.id, 'tentative')
                  const tot = a + t
                  const ok = tot >= 11
                  const mid = tot >= 9 && tot < 11
                  return (
                    <td key={f.id} className="text-center px-0.5 py-1.5 border-t-2 border-gray-200">
                      <div
                        className={`rounded-md py-1 border ${
                          ok
                            ? 'bg-emerald-50 border-emerald-200'
                            : mid
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div
                          className={`text-sm font-extrabold font-mono ${
                            ok ? 'text-emerald-700' : mid ? 'text-amber-700' : 'text-red-600'
                          }`}
                        >
                          {a}
                        </div>
                        <div className={`text-[8px] font-semibold ${ok ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {ok ? '\u2713 XI' : `need ${11 - tot}`}
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
      {picker && <StatusPicker pos={{ x: picker.x, y: picker.y }} onPick={onPick} onClose={() => setPicker(null)} />}
      {selectedFixture && (
        <MatchDetail
          fixture={selectedFixture}
          avMap={avMap}
          players={activePlayers}
          onClose={() => setSelectedFixture(null)}
          onPromote={promotePlayer}
        />
      )}
      {showAddRingin && <AddRinginModal onAdd={addRingin} onClose={() => setShowAddRingin(false)} />}
    </div>
  )
}
