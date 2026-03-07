'use client'

import { useState, useRef, useEffect } from 'react'
import type { Player } from '@/lib/supabase'

export default function PlayerSearch({
  allPlayers,
  activePlayers,
  onActivate,
}: {
  allPlayers: Player[]
  activePlayers: Player[]
  onActivate: (player: Player) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const activeIds = new Set(activePlayers.map((p) => p.id))
  const filtered = allPlayers
    .filter((p) => !activeIds.has(p.id))
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
      >
        + I&apos;m Playing
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-5" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl">
            <div className="text-xs text-emerald-700 uppercase tracking-widest font-semibold mb-1">
              Find Your Name
            </div>
            <div className="text-sm text-gray-500 mb-4">
              Search for your name to start setting availability for the season.
            </div>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Start typing your name..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 mb-3 transition-all"
            />
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 && search.length > 0 && (
                <div className="text-sm text-gray-400 text-center py-4">No matching players found</div>
              )}
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onActivate(p)
                    setOpen(false)
                    setSearch('')
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-emerald-50 text-left transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">{p.name}</span>
                  <span className="text-xs text-gray-300 group-hover:text-emerald-500 font-medium">Select &rarr;</span>
                </button>
              ))}
              {search.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-3">
                  {filtered.length} players not yet on the grid
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => { setOpen(false); setSearch('') }}
                className="w-full py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
