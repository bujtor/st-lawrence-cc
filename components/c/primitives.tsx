/**
 * Shared C-themed UI primitives. Pure presentational — no data fetching.
 * Matches the home page (candidates/c/page.tsx) so every C subroute reads the same.
 */

import { ReactNode } from 'react'
import {
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from '@/lib/c-theme/tokens'

export { C_GREEN, C_GREEN_LT, C_RED, C_CREAM, C_INK, C_RULE, display, sansTight, mono }

/** "— SECTION" red mono kicker. */
export function CKicker({ children, color = C_RED }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: mono,
        fontSize: 11,
        letterSpacing: 3,
        color,
        textTransform: 'uppercase',
        fontWeight: 700,
      }}
    >
      — {children}
    </div>
  )
}

/** Mono caps label, smaller, neutral grey. Used for column headers, stat labels. */
export function CMonoLabel({
  children,
  size = 10,
  color = '#888',
  spacing = 2,
}: {
  children: ReactNode
  size?: number
  color?: string
  spacing?: number
}) {
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: size,
        letterSpacing: spacing,
        color,
        textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

/** Editorial header: red kicker on top, big italic serif title below. */
export function CEditorialHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <CKicker>{kicker}</CKicker>
      <div
        style={{
          fontFamily: display,
          fontSize: 56,
          fontWeight: 400,
          fontStyle: 'italic',
          lineHeight: 1,
          letterSpacing: -1.5,
          marginTop: 8,
        }}
      >
        {title}
      </div>
    </div>
  )
}

/** Page-level header — same as editorial but with explicit space below. */
export function CPageHeader({
  kicker,
  title,
  subtitle,
  right,
}: {
  kicker: string
  title: string
  subtitle?: ReactNode
  right?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 32,
      }}
    >
      <div>
        <CEditorialHeader kicker={kicker} title={title} />
        {subtitle && (
          <div style={{ fontSize: 14, color: '#666', marginTop: 12, maxWidth: 580 }}>{subtitle}</div>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}

/** White-on-dark stat block (Founded · 1877 etc). */
export function CStat({
  label,
  value,
  color = '#fff',
  labelColor = 'rgba(255,255,255,.55)',
}: {
  label: string
  value: string
  color?: string
  labelColor?: string
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: 2,
          color: labelColor,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 40,
          fontWeight: 500,
          color,
          lineHeight: 1,
          marginTop: 4,
          letterSpacing: -1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

/** Big number block with optional small caption. */
export function CBigNumber({
  label,
  value,
  small,
  color = 'inherit',
  labelColor = 'rgba(255,255,255,.55)',
}: {
  label: string
  value: string
  small?: string
  color?: string
  labelColor?: string
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: 2.5,
          color: labelColor,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 36,
          fontWeight: 500,
          lineHeight: 1,
          marginTop: 4,
          letterSpacing: -0.5,
          color,
        }}
      >
        {value}
      </div>
      {small && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{small}</div>}
    </div>
  )
}

/** W/L/T/D/A/C square chip. */
export function CFormChip({
  letter,
  size = 32,
}: {
  letter: 'W' | 'L' | 'T' | 'D' | 'A' | 'C' | '?'
  size?: number
}) {
  const map: Record<string, string> = {
    W: C_GREEN,
    L: C_RED,
    T: '#caa31b',
    D: '#7a8aa6',
    A: '#888',
    C: '#aaa',
    '?': '#cdc6b3',
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        fontFamily: display,
        fontSize: Math.round(size * 0.55),
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: map[letter] ?? '#aaa',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  )
}

/** HOME / AWAY pill — green for home, red for away. */
export function CHomeAwayChip({ homeAway }: { homeAway: string }) {
  const isHome = homeAway === 'H'
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 10px',
        background: isHome ? C_GREEN : C_RED,
        color: '#fff',
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      {isHome ? 'Home' : 'Away'}
    </span>
  )
}

/** Italic "v." separator used everywhere in front of opponent names. */
export function CVs() {
  return (
    <span style={{ fontStyle: 'italic', color: '#aaa', fontWeight: 400 }}>v.</span>
  )
}

/** Cream/white bordered card — the C signature container. */
export function CCard({
  children,
  padding = '28px 32px',
  style,
  background = '#fff',
}: {
  children: ReactNode
  padding?: string
  style?: React.CSSProperties
  background?: string
}) {
  return (
    <div
      style={{
        background,
        border: `1px solid ${C_RULE}`,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Page wrapper: max-width container, cream bg already on layout body. */
export function CContainer({
  children,
  maxWidth = 1240,
  padding = '64px 32px',
}: {
  children: ReactNode
  maxWidth?: number
  padding?: string
}) {
  return <div style={{ maxWidth, margin: '0 auto', padding }}>{children}</div>
}

/** Date stack used in fixtures lists — Sat / 09 / May. */
export function CDateStack({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr + 'T00:00:00')
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const mo = d.toLocaleDateString('en-GB', { month: 'short' })
  return (
    <div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          color: C_RED,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {wd}
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 34,
          lineHeight: 1,
          fontWeight: 500,
          letterSpacing: -1,
        }}
      >
        {d.getDate()}
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          color: '#888',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {mo}
      </div>
    </div>
  )
}

/** "Result" coloured pill — green Won / red Lost / neutral other. */
export function CResultPill({ result }: { result: string | null }) {
  if (!result) return null
  const r = result.toLowerCase()
  const won = r.startsWith('won') || r.includes('opp.') || r.includes('opp -')
  const lost = r.startsWith('lost') || r.startsWith('st lawrence')
  const color = won ? C_GREEN_LT : lost ? C_RED : '#888'
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 700,
        padding: '5px 10px',
        border: `1.5px solid ${color}`,
        color,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      {result}
    </span>
  )
}
