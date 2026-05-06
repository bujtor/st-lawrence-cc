'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { C_INK, display, mono } from '@/lib/c-theme/tokens'

export default function CFooter() {
  const pathname = usePathname()

  if (pathname === '/availability' || pathname?.startsWith('/candidates')) return null

  return (
    <footer
      style={{
        background: C_INK,
        color: 'rgba(255,255,255,.55)',
        padding: '48px 32px 24px',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 40,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ minWidth: 260 }}>
          <Image
            src="/images/badge.png"
            alt="St Lawrence Cricket Club"
            width={120}
            height={40}
            style={{ height: 36, width: 'auto', filter: 'brightness(0) invert(1)', opacity: 0.85 }}
          />
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2,
              marginTop: 12,
              color: 'rgba(255,255,255,.55)',
            }}
          >
            EST. MDCCCLXXVII · BITCHET GREEN
          </div>
          <div style={{ fontSize: 13, marginTop: 20, lineHeight: 1.6, maxWidth: 320 }}>
            Bitchet Green, Sevenoaks, Kent TN15 0NB.
            <br />
            A Kent County Village League side.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 56, fontSize: 13, flexWrap: 'wrap' }}>
          {(
            [
              [
                'The Club',
                [
                  ['Fixtures', '/fixtures'],
                  ['Table', '/table'],
                  ['Stats', '/stats'],
                  ['Opponents', '/clubs'],
                  ['About', '/about'],
                  ['Contact', '/contact'],
                ],
              ],
              [
                'Connect',
                [
                  ['Play-Cricket', 'https://stlawrence.play-cricket.com'],
                  ['Club Shop', 'https://www.serioussport.co.uk/teamstores/st-lawrence-cc'],
                ],
              ],
            ] as [string, [string, string][]][]
          ).map(([head, items]) => (
            <div key={head}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 2.5,
                  color: 'rgba(255,255,255,.4)',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                {head}
              </div>
              {items.map(([label, href]) => {
                const external = href.startsWith('http')
                const Cmp = external
                  ? (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    )
                  : Link
                return (
                  <div key={label} style={{ padding: '4px 0' }}>
                    <Cmp
                      href={href}
                      style={{
                        color: 'rgba(255,255,255,.75)',
                        textDecoration: 'none',
                      }}
                    >
                      {label}
                    </Cmp>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          maxWidth: 1240,
          margin: '48px auto 0',
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,.1)',
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: 1.5,
          color: 'rgba(255,255,255,.3)',
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        &copy; {new Date().getFullYear()} St Lawrence CC · Bitchet Green
      </div>
    </footer>
  )
}
