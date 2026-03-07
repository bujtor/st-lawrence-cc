'use client'

import { useState } from 'react'
import type { Fixture } from '@/lib/supabase'
import FixtureDetail from './FixtureDetail'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function isPast(dateStr: string) {
  return new Date(dateStr + 'T23:59:59') < new Date()
}

export default function FixtureList({
  fixtures,
  season,
}: {
  fixtures: Fixture[]
  season: number
}) {
  const [selected, setSelected] = useState<Fixture | null>(null)
  const [filter, setFilter] = useState<'all' | 'home' | 'away'>('all')

  const filtered = fixtures.filter((f) => {
    if (filter === 'home') return f.home_away === 'H'
    if (filter === 'away') return f.home_away === 'A'
    return true
  })

  const upcoming = filtered.filter((f) => !isPast(f.match_date))
  const completed = filtered.filter((f) => isPast(f.match_date))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fixtures & Results</h1>
          <p className="text-sm text-gray-400 mt-0.5">{season} Season &middot; {fixtures.length} matches</p>
        </div>
        <div className="flex gap-1">
          {(['all', 'home', 'away'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-gray-400 hover:text-gray-600 border border-transparent'
              }`}
            >
              {f === 'all' ? 'All' : f === 'home' ? 'Home' : 'Away'}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">Upcoming</div>
          <div className="space-y-2">
            {upcoming.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all text-left group"
              >
                <div className="text-center min-w-[56px]">
                  <div className="text-xs font-bold text-gray-700">{formatDate(f.match_date)}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${f.home_away === 'H' ? 'text-emerald-600' : 'text-sky-600'}`}>
                    {f.home_away === 'H' ? 'HOME' : 'AWAY'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
                    vs {f.opponent}
                  </div>
                  <div className="text-xs text-gray-400 truncate flex items-center gap-1">
                    {f.venue}
                    {f.lat && f.lng && (
                      <svg className="w-3 h-3 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-gray-700">{f.start_time?.slice(0, 5)}</div>
                  {f.meet_time && (
                    <div className="text-[10px] text-gray-400">Meet {f.meet_time.slice(0, 5)}</div>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">Completed</div>
          <div className="space-y-2">
            {completed.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="w-full flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-white transition-all text-left group"
              >
                <div className="text-center min-w-[56px]">
                  <div className="text-xs font-bold text-gray-500">{formatDate(f.match_date)}</div>
                  <div className={`text-[10px] font-bold mt-0.5 ${f.home_away === 'H' ? 'text-emerald-600' : 'text-sky-600'}`}>
                    {f.home_away === 'H' ? 'HOME' : 'AWAY'}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    vs {f.opponent}
                  </div>
                  <div className="text-xs text-gray-400 truncate">{f.venue}</div>
                </div>
                {f.result_text ? (
                  <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 flex-shrink-0">
                    {f.result_text}
                  </div>
                ) : (
                  <div className="text-xs text-gray-300 flex-shrink-0">No result</div>
                )}
                <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No fixtures found</p>
          <p className="text-sm mt-1">Try changing the filter above</p>
        </div>
      )}

      {selected && <FixtureDetail fixture={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
