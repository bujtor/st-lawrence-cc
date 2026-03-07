'use client'

import { useRef, useEffect } from 'react'

const STATUS_STYLES: Record<string, { bg: string; bd: string; tx: string; sy: string }> = {
  none: { bg: 'bg-gray-50', bd: 'border-gray-200', tx: 'text-gray-300', sy: '' },
  available: { bg: 'bg-emerald-50', bd: 'border-emerald-400', tx: 'text-emerald-700', sy: '\u2713' },
  unavailable: { bg: 'bg-red-50', bd: 'border-red-400', tx: 'text-red-600', sy: '\u2717' },
  tentative: { bg: 'bg-amber-50', bd: 'border-amber-400', tx: 'text-amber-700', sy: '?' },
}

const OPTIONS: [string, string][] = [
  ['available', 'Available'],
  ['tentative', 'Tentative'],
  ['unavailable', 'Unavailable'],
  ['none', 'Clear'],
]

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
      className="fixed z-50 bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl min-w-[152px] flex flex-col gap-0.5"
      style={{
        left: Math.min(pos.x, typeof window !== 'undefined' ? window.innerWidth - 170 : pos.x),
        top: Math.min(pos.y, typeof window !== 'undefined' ? window.innerHeight - 210 : pos.y),
      }}
    >
      {OPTIONS.map(([k, l]) => {
        const s = STATUS_STYLES[k]
        return (
          <button
            key={k}
            onClick={() => onPick(k)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 text-sm text-left transition-colors"
          >
            <span
              className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold border-2 ${s.bg} ${s.bd} ${s.tx}`}
            >
              {s.sy || '\u25CB'}
            </span>
            {l}
          </button>
        )
      })}
    </div>
  )
}
