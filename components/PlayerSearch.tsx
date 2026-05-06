'use client'

import { useState, useRef, useEffect } from 'react'
import type { Player } from '@/lib/supabase'
import {
  C_GREEN,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from '@/lib/c-theme/tokens'

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
        style={{
          padding: '9px 18px',
          background: C_GREEN,
          color: '#fff',
          fontFamily: mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        + I&apos;m Playing
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              border: `1px solid ${C_RULE}`,
              maxWidth: 380,
              width: '100%',
              overflow: 'hidden',
            }}
          >
            {/* Header band */}
            <div style={{ background: C_GREEN, padding: '16px 24px' }}>
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
                — Squad
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
                Find Your Name
              </div>
              <div style={{ fontFamily: sansTight, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                Search for your name to start setting availability for the season.
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', background: C_CREAM }}>
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Start typing your name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#fff',
                  border: `1px solid ${C_RULE}`,
                  color: C_INK,
                  fontFamily: sansTight,
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 8,
                }}
              />

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {filtered.length === 0 && search.length > 0 && (
                  <div
                    style={{
                      fontFamily: sansTight,
                      fontSize: 13,
                      color: '#aaa',
                      textAlign: 'center',
                      padding: '16px 0',
                    }}
                  >
                    No matching players found
                  </div>
                )}
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onActivate(p)
                      setOpen(false)
                      setSearch('')
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: `1px dashed ${C_RULE}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span
                      style={{
                        fontFamily: sansTight,
                        fontSize: 14,
                        color: C_INK,
                        fontStyle: 'italic',
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: C_GREEN,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      Select →
                    </span>
                  </button>
                ))}
                {search.length === 0 && (
                  <div
                    style={{
                      fontFamily: sansTight,
                      fontSize: 12,
                      color: '#aaa',
                      textAlign: 'center',
                      padding: '12px 0',
                    }}
                  >
                    {filtered.length} players not yet on the grid
                  </div>
                )}
              </div>

              <div style={{ borderTop: `1px solid ${C_RULE}`, marginTop: 12, paddingTop: 12 }}>
                <button
                  onClick={() => { setOpen(false); setSearch('') }}
                  style={{
                    width: '100%',
                    padding: '10px 0',
                    background: '#fff',
                    border: `1px solid ${C_RULE}`,
                    color: '#888',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
