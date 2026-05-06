'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { C_GREEN, C_RED, mono, display } from '../_theme/tokens'

const links = [
  { href: '/candidates/c', label: 'Home' },
  { href: '/candidates/c/fixtures', label: 'Fixtures' },
  { href: '/candidates/c/table', label: 'Table' },
  { href: '/candidates/c/stats', label: 'Stats' },
  { href: '/candidates/c/clubs', label: 'Opponents' },
  { href: '/candidates/c/about', label: 'About' },
]

export default function CNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav
      style={{
        background: C_GREEN,
        color: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        {/* Badge logo (white on dark) + tagline */}
        <Link
          href="/candidates/c"
          style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: '#fff' }}
        >
          <Image
            src="/images/badge.png"
            alt="St Lawrence Cricket Club"
            width={140}
            height={48}
            priority
            style={{ height: 32, width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <span
            style={{
              height: 16,
              width: 1,
              background: 'rgba(255,255,255,.3)',
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2,
              color: 'rgba(255,255,255,.65)',
            }}
          >
            Est. 1877 · CC
          </span>
        </Link>

        {/* Desktop links */}
        <div
          style={{
            display: 'flex',
            gap: 28,
            alignItems: 'center',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.3,
          }}
          className="hidden md:flex"
        >
          {links.map((l) => {
            const isActive =
              l.href === '/candidates/c' ? pathname === l.href : pathname?.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  color: isActive ? '#fff' : 'rgba(255,255,255,.7)',
                  textDecoration: 'none',
                  borderBottom: isActive ? `2px solid ${C_RED}` : '2px solid transparent',
                  paddingBottom: 4,
                  transition: 'color .15s, border-color .15s',
                }}
              >
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/contact"
            style={{
              padding: '8px 14px',
              background: C_RED,
              color: '#fff',
              borderRadius: 2,
              textDecoration: 'none',
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Play for us
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden"
          style={{
            background: 'transparent',
            border: 0,
            color: '#fff',
            padding: 8,
            cursor: 'pointer',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="md:hidden"
          style={{
            background: C_GREEN,
            borderTop: '1px solid rgba(255,255,255,.1)',
            padding: '8px 24px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {links.map((l) => {
            const isActive =
              l.href === '/candidates/c' ? pathname === l.href : pathname?.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: display,
                  fontSize: 18,
                  padding: '10px 4px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,.7)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                }}
              >
                {l.label}
              </Link>
            )
          })}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            style={{
              marginTop: 12,
              padding: '12px 14px',
              background: C_RED,
              color: '#fff',
              borderRadius: 2,
              textDecoration: 'none',
              fontFamily: mono,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            Play for us
          </Link>
        </div>
      )}
    </nav>
  )
}
