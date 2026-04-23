'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const candidates = [
  { key: 'a', label: 'A', title: 'Saints' },
  { key: 'b', label: 'B', title: 'Scorebook' },
  { key: 'c', label: 'C', title: 'Bitchet Green' },
]

export default function PreviewSwitcher() {
  const pathname = usePathname()
  const active = candidates.find(c => pathname === `/candidates/${c.key}`)

  // Only show on /candidates/a, /candidates/b, /candidates/c
  if (!active) return null

  return (
    <div style={{
      position: 'fixed',
      top: 16,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
      pointerEvents: 'none',
    }}>
      {/* Preview mode note */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        letterSpacing: 1,
        padding: '4px 8px',
        borderRadius: 3,
        pointerEvents: 'none',
        textTransform: 'uppercase',
      }}>
        Desktop preview · Home page only
      </div>

      {/* Switcher pill */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 999,
        border: '1px solid rgba(0,0,0,0.15)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 6px',
        pointerEvents: 'all',
        backdropFilter: 'blur(8px)',
      }}>
        {candidates.map((c) => {
          const isActive = c.key === active.key
          return (
            <Link
              key={c.key}
              href={`/candidates/${c.key}`}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: 0.3,
                background: isActive ? '#1f5a3f' : 'transparent',
                color: isActive ? '#fff' : '#555',
                transition: 'all 0.15s',
              }}
              title={c.title}
            >
              {c.label}
            </Link>
          )
        })}
        <div style={{ width: 1, height: 18, background: '#e0e0e0', margin: '0 4px' }} />
        <Link
          href="/"
          style={{
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 500,
            textDecoration: 'none',
            color: '#888',
          }}
          title="Back to live site"
        >
          Exit
        </Link>
      </div>
    </div>
  )
}
