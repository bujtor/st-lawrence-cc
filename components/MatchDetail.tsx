'use client'

import { useState } from 'react'
import type { Player, Fixture } from '@/lib/supabase'

type AvailabilityMap = Record<number, Record<number, string>>

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

export default function MatchDetail({
  fixture,
  avMap,
  players,
  onClose,
  onPromote,
}: {
  fixture: Fixture
  avMap: AvailabilityMap
  players: Player[]
  onClose: () => void
  onPromote: (playerId: number, demote?: boolean) => void
}) {
  const [copied, setCopied] = useState(false)

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

  const copyTeamList = () => {
    const squad = [...yes, ...maybe]
    const lines = [
      `\uD83C\uDFCF *St Lawrence CC vs ${fixture.opponent}*`,
      `\uD83D\uDCC5 ${formatMatchDate(fixture.match_date)}`,
      `\u23F0 Meet ${formatTime(fixture.meet_time)} \u00B7 Start ${formatTime(fixture.start_time)}`,
      `\uD83D\uDCCD ${fixture.venue} (${fixture.home_away === 'H' ? 'Home' : 'Away'})`,
    ]
    if (mapsUrl) lines.push(`\uD83D\uDDFA\uFE0F ${mapsUrl}`)
    lines.push('', `*Squad (${squad.length}):*`)
    squad.forEach((p, i) => {
      let s = `${i + 1}. ${p.name}`
      if (p.is_ringin) s += ' _(ring-in)_'
      if (avMap[p.id]?.[fixture.id] === 'tentative') s += ' _(tbc)_'
      lines.push(s)
    })
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

  const sections = [
    { title: 'Available', list: yes, c: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
    { title: 'Tentative', list: maybe, c: 'text-amber-700 border-amber-200 bg-amber-50' },
    { title: 'Unavailable', list: no, c: 'text-red-600 border-red-200 bg-red-50' },
    { title: 'No Response', list: quiet, c: 'text-gray-400 border-gray-200 bg-gray-50' },
  ]

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
          <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-xs text-gray-500 flex items-center gap-1.5 border border-gray-100">
            {'\u23F0'} Meet <strong className="text-gray-800">{formatTime(fixture.meet_time)}</strong> &middot; Start{' '}
            <strong className="text-gray-800">{formatTime(fixture.start_time)}</strong>
          </div>
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
            {'\u2713'} Got a team
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg py-2 px-3 mb-3 text-sm text-red-600 text-center font-semibold">
            Need {11 - total} more &middot; {quiet.length} no response
          </div>
        )}

        {sections.map(({ title, list, c }) =>
          list.length > 0 ? (
            <div key={title} className="mb-2.5">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{title}</div>
              <div className="flex flex-wrap gap-1">
                {list.map((p) => (
                  <span
                    key={p.id}
                    className={`rounded-md px-2 py-0.5 text-xs border inline-flex items-center gap-1 font-medium ${c}`}
                  >
                    {p.name.split(' ')[0]} {(p.name.split(' ')[1] || '')[0]}
                    {p.name.split(' ')[1] ? '.' : ''}
                    {p.is_ringin && (
                      <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 rounded font-semibold">RI</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ) : null
        )}

        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={copyTeamList}
            className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-sm"
          >
            {'\uD83D\uDCCB'} Copy Team List for WhatsApp
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
