'use client'

import { useState } from 'react'
import type { Player, Fixture } from '@/lib/supabase'

type AvailabilityMap = Record<number, Record<number, string>>
type SelectionMap = Record<number, Record<number, boolean>>

function formatMatchDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

function shortName(p: Player) {
  const parts = p.name.split(' ')
  return `${parts[0]} ${(parts[1] || '')[0]}${parts[1] ? '.' : ''}`
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
  const mapsUrl = fixture.lat && fixture.lng
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
      `\uD83C\uDFCF *St Lawrence CC vs ${fixture.opponent}*`,
      `\uD83D\uDCC5 ${formatMatchDate(fixture.match_date)}`,
      `\u23F0 Meet ${meetTime || '--:--'} \u00B7 Start ${startTime || '--:--'}`,
      `\uD83D\uDCCD ${fixture.venue} (${fixture.home_away === 'H' ? 'Home' : 'Away'})`,
    ]
    if (mapsUrl) lines.push(`\uD83D\uDDFA\uFE0F ${mapsUrl}`)

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
          let s = `\u2022 ${p.name}`
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
      lines.push('', `\u26A0\uFE0F Still need ${11 - total} more \u2014 let me know if you can play!`)
    }
    if (quiet.length > 0) {
      lines.push('', `\u2753 Not heard from: ${quiet.map((p) => p.name.split(' ')[0]).join(', ')}`)
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-5 max-w-md w-full max-h-[85vh] overflow-auto border border-gray-200 shadow-2xl"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {formatMatchDate(fixture.match_date)} &middot; {fixture.home_away === 'H' ? 'Home' : 'Away'}
            </div>
            <div className="text-xl font-bold text-gray-900 mt-0.5">vs {fixture.opponent}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition-colors">
            &times;
          </button>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {editingTimes ? (
            <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-500 flex items-center gap-1.5 border border-gray-100">
              {'\u23F0'} Meet{' '}
              <input
                type="time"
                value={meetTime}
                onChange={(e) => setMeetTime(e.target.value)}
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-800 font-bold w-20"
              />
              Start{' '}
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="border border-gray-300 rounded px-1.5 py-0.5 text-xs text-gray-800 font-bold w-20"
              />
              <button onClick={saveTimes} className="text-emerald-600 font-bold hover:text-emerald-800 ml-1">{'\u2713'}</button>
              <button onClick={() => setEditingTimes(false)} className="text-gray-400 font-bold hover:text-gray-600">{'\u2717'}</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingTimes(true)}
              className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-500 flex items-center gap-1.5 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {'\u23F0'} Meet <strong className="text-gray-800">{meetTime || '--:--'}</strong> &middot; Start{' '}
              <strong className="text-gray-800">{startTime || '--:--'}</strong>
              <span className="text-gray-300 text-[10px] ml-1">{'\u270E'}</span>
            </button>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-sky-50 rounded-lg px-3 py-1.5 text-xs text-sky-700 flex items-center gap-1.5 no-underline border border-sky-100 hover:bg-sky-100 transition-colors font-medium"
            >
              {'\uD83D\uDCCD'} {fixture.venue} {'\u2197'}
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
            <div className="text-2xl font-extrabold text-emerald-700 font-mono">{yes.length}</div>
            <div className="text-[10px] text-emerald-600 uppercase tracking-wider font-semibold">Available</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
            <div className="text-2xl font-extrabold text-amber-700 font-mono">{maybe.length}</div>
            <div className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Tentative</div>
          </div>
        </div>

        {total >= 11 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-2 px-3 mb-3 text-sm text-emerald-700 text-center font-semibold">
            {'\u2713'} Got a team{selectedCount > 0 && ` \u00B7 ${selectedCount} selected`}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg py-2 px-3 mb-3 text-sm text-red-600 text-center font-semibold">
            Need {11 - total} more &middot; {quiet.length} no response
          </div>
        )}

        {/* Select XI toggle */}
        {selectable.length > 0 && (
          <button
            onClick={() => setSelectingXI(!selectingXI)}
            className={`w-full py-2 rounded-lg text-xs font-semibold mb-3 border transition-colors ${
              selectingXI
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {selectingXI
              ? `Selecting XI (${selectedCount}/11) \u2014 tap players below`
              : selectedCount > 0
                ? `XI Selected (${selectedCount}) \u2014 tap to edit`
                : 'Select Playing XI'}
          </button>
        )}

        {/* XI selection mode */}
        {selectingXI && (
          <div className="mb-3 border border-indigo-100 rounded-xl p-3 bg-indigo-50/30">
            <div className="text-[10px] text-indigo-500 uppercase tracking-widest font-semibold mb-2">
              Tap to select / deselect
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectable.map((p) => {
                const sel = isSelected(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => onToggleSelection(p.id, fixture.id)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs border font-medium transition-all ${
                      sel
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    {sel && '\u2713 '}{shortName(p)}
                    {p.is_ringin && (
                      <span className={`text-[9px] ml-1 px-1 rounded font-semibold ${sel ? 'bg-indigo-500 text-indigo-200' : 'bg-emerald-100 text-emerald-600'}`}>RI</span>
                    )}
                    {avMap[p.id]?.[fixture.id] === 'tentative' && (
                      <span className={`text-[9px] ml-1 px-1 rounded font-semibold ${sel ? 'bg-indigo-500 text-indigo-200' : 'bg-amber-100 text-amber-600'}`}>TBC</span>
                    )}
                  </button>
                )
              })}
            </div>
            {selectedCount > 11 && (
              <div className="text-xs text-red-500 font-medium mt-2">
                {selectedCount} selected &mdash; that&apos;s more than XI
              </div>
            )}
          </div>
        )}

        {/* Player lists */}
        {!selectingXI && (
          <>
            {selectedCount > 0 && (
              <div className="mb-2.5">
                <div className="text-[10px] text-indigo-500 uppercase tracking-widest font-semibold mb-1">Playing XI</div>
                <div className="flex flex-wrap gap-1">
                  {selectable.filter((p) => isSelected(p.id)).map((p) => (
                    <span key={p.id} className="rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                      {shortName(p)}
                      {p.is_ringin && <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded font-semibold">RI</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const list = selectedCount > 0 ? yes.filter((p) => !isSelected(p.id)) : yes
              return list.length > 0 ? (
                <div className="mb-2.5">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{selectedCount > 0 ? 'Reserves' : 'Available'}</div>
                  <div className="flex flex-wrap gap-1">
                    {list.map((p) => (
                      <span key={p.id} className="rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium text-emerald-700 border-emerald-200 bg-emerald-50">
                        {shortName(p)}
                        {p.is_ringin && <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded font-semibold">RI</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {(() => {
              const list = selectedCount > 0 ? maybe.filter((p) => !isSelected(p.id)) : maybe
              return list.length > 0 ? (
                <div className="mb-2.5">
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Tentative</div>
                  <div className="flex flex-wrap gap-1">
                    {list.map((p) => (
                      <span key={p.id} className="rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium text-amber-700 border-amber-200 bg-amber-50">
                        {shortName(p)}
                        {p.is_ringin && <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded font-semibold">RI</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            {no.length > 0 && (
              <div className="mb-2.5">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Unavailable</div>
                <div className="flex flex-wrap gap-1">
                  {no.map((p) => (
                    <span key={p.id} className="rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium text-red-600 border-red-200 bg-red-50">
                      {shortName(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {quiet.length > 0 && (
              <div className="mb-2.5">
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">No Response</div>
                <div className="flex flex-wrap gap-1">
                  {quiet.map((p) => (
                    <span key={p.id} className="rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium text-gray-400 border-gray-200 bg-gray-50">
                      {shortName(p)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={copyTeamList}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {'\uD83D\uDCCB'} {selectedCount > 0 ? 'Copy XI for WhatsApp' : 'Copy Team List for WhatsApp'}
          </button>
        </div>
        {copied && (
          <div className="mt-3 text-center text-sm text-emerald-600 font-semibold">
            {'\u2713'} Copied! Paste into WhatsApp
          </div>
        )}
      </div>
    </div>
  )
}
