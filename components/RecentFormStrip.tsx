'use client'

import Link from 'next/link'
import type { RecentFormEntry } from '@/lib/recent-form'
import { formLetter } from '@/lib/recent-form'

type Variant = 'light' | 'dark' // light = on white bg; dark = on hero/dark bg

const LETTER_CLASSES_LIGHT: Record<string, string> = {
  W: 'bg-emerald-600 text-white hover:bg-emerald-700',
  L: 'bg-rose-600 text-white hover:bg-rose-700',
  T: 'bg-amber-500 text-white hover:bg-amber-600',
  D: 'bg-sky-500 text-white hover:bg-sky-600',
  A: 'bg-gray-400 text-white hover:bg-gray-500',
  C: 'bg-gray-400 text-white hover:bg-gray-500',
  '?': 'bg-gray-300 text-gray-600 hover:bg-gray-400',
}

const LETTER_CLASSES_DARK: Record<string, string> = {
  W: 'bg-emerald-500/80 text-white hover:bg-emerald-500',
  L: 'bg-rose-500/80 text-white hover:bg-rose-500',
  T: 'bg-amber-500/80 text-white hover:bg-amber-500',
  D: 'bg-sky-500/80 text-white hover:bg-sky-500',
  A: 'bg-white/30 text-white hover:bg-white/40',
  C: 'bg-white/30 text-white hover:bg-white/40',
  '?': 'bg-white/20 text-white/70 hover:bg-white/30',
}

export default function RecentFormStrip({
  results,
  variant = 'light',
  label = 'Recent form',
  // most-recent-first from the DB; usually nice to display oldest-left/newest-right
  oldestFirst = true,
  size = 'md',
}: {
  results: RecentFormEntry[]
  variant?: Variant
  /** Empty string hides the label entirely. */
  label?: string
  oldestFirst?: boolean
  size?: 'sm' | 'md'
}) {
  if (results.length === 0) return null

  const ordered = oldestFirst ? [...results].reverse() : results
  const palette = variant === 'dark' ? LETTER_CLASSES_DARK : LETTER_CLASSES_LIGHT
  const labelClass = variant === 'dark' ? 'text-white/50' : 'text-gray-400'
  const chipSize = size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6 text-xs'

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className={`text-[10px] uppercase tracking-widest font-semibold ${labelClass}`}>
          {label}
        </span>
      )}
      <div className="flex gap-1">
        {ordered.map((r) => {
          const letter = formLetter(r.result_text)
          const tip = `${r.result_text ?? '?'} vs ${r.opponent}${r.home_away === 'A' ? ' (away)' : ''} · ${r.match_date}`
          return (
            <Link
              key={r.id}
              href={`/fixtures/${r.id}`}
              title={tip}
              className={`inline-flex items-center justify-center ${chipSize} font-bold rounded no-underline transition-colors ${palette[letter]}`}
              onClick={(e) => e.stopPropagation()}
            >
              {letter}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
