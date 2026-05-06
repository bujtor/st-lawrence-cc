'use client'

import { useRef, useEffect } from 'react'
import {
  C_GREEN,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  mono,
  sansTight,
} from '@/lib/c-theme/tokens'

const C_AMBER = '#b45309'
const C_AMBER_BG = '#fffbeb'
const C_AMBER_BD = '#fbbf24'

const STATUS_CONFIG: Record<string, { bg: string; bd: string; tx: string; sy: string; label: string }> = {
  available:   { bg: '#f0fdf4', bd: C_GREEN,     tx: C_GREEN,  sy: '✓', label: 'Available'   },
  tentative:   { bg: C_AMBER_BG, bd: C_AMBER_BD, tx: C_AMBER,  sy: '?', label: 'Tentative'   },
  unavailable: { bg: '#fff5f5',  bd: C_RED,      tx: C_RED,    sy: '✗', label: 'Unavailable' },
  none:        { bg: C_CREAM,    bd: C_RULE,      tx: '#aaa',   sy: '○', label: 'Clear'       },
}

const OPTIONS = ['available', 'tentative', 'unavailable', 'none'] as const

export default function StatusPicker({
  pos,
  onPick,
  onClose,
}: {
  pos: { x: number; y: number }
  onPick: (status: string) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        zIndex: 50,
        background: '#fff',
        border: `1px solid ${C_RULE}`,
        padding: '6px',
        minWidth: 160,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        left: Math.min(pos.x, typeof window !== 'undefined' ? window.innerWidth - 178 : pos.x),
        top: Math.min(pos.y, typeof window !== 'undefined' ? window.innerHeight - 220 : pos.y),
      }}
    >
      {OPTIONS.map((k) => {
        const s = STATUS_CONFIG[k]
        return (
          <button
            key={k}
            onClick={() => onPick(k)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: sansTight,
              fontSize: 13,
              color: C_INK,
              textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C_CREAM)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span
              style={{
                width: 22,
                height: 22,
                border: `1.5px solid ${s.bd}`,
                background: s.bg,
                color: s.tx,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {s.sy}
            </span>
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
