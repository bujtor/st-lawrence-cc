import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'
import Link from 'next/link'
import {
  CKicker,
  CPageHeader,
  CCard,
  CFormChip,
  CMonoLabel,
  CVs,
  CContainer,
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_INK,
  C_RULE,
  display,
  mono,
  sansTight,
} from '@/components/c/primitives'

export const dynamic = 'force-dynamic'

type ClubRecord = {
  opponent: string
  played: number
  won: number
  lost: number
  drew: number
  tied: number
  abandoned: number
  lastDate: string | null
  form: Array<'W' | 'L' | 'T' | 'D' | 'A' | '?'>
}

function resultLetter(r: string | null): 'W' | 'L' | 'T' | 'D' | 'A' | '?' {
  if (r === 'Won') return 'W'
  if (r === 'Lost') return 'L'
  if (r === 'Tied') return 'T'
  if (r === 'Drew') return 'D'
  if (r === 'Abandoned') return 'A'
  return '?'
}

export default async function ClubsIndexPage() {
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('opponent, result_text, match_date')
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })

  const clubMap = new Map<string, ClubRecord>()

  for (const f of fixtures ?? []) {
    const name = f.opponent ?? ''
    if (!name) continue
    if (!clubMap.has(name)) {
      clubMap.set(name, {
        opponent: name,
        played: 0,
        won: 0,
        lost: 0,
        drew: 0,
        tied: 0,
        abandoned: 0,
        lastDate: null,
        form: [],
      })
    }
    const rec = clubMap.get(name)!
    rec.played++
    const r = f.result_text ?? ''
    if (r === 'Won') rec.won++
    else if (r === 'Lost') rec.lost++
    else if (r === 'Drew') rec.drew++
    else if (r === 'Tied') rec.tied++
    else if (r === 'Abandoned') rec.abandoned++
    if (!rec.lastDate) rec.lastDate = f.match_date
    if (rec.form.length < 5) rec.form.push(resultLetter(f.result_text))
  }

  // Sort by win% desc, then most played
  const clubs = Array.from(clubMap.values()).sort((a, b) => {
    const wA = a.played > 0 ? a.won / a.played : 0
    const wB = b.played > 0 ? b.won / b.played : 0
    return wB - wA || b.played - a.played || a.opponent.localeCompare(b.opponent)
  })

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Dark header band */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <CContainer padding="56px 32px 48px">
          <CKicker color={C_RED}>Opponents · By Record</CKicker>
          <h1
            style={{
              fontFamily: display,
              fontSize: 'clamp(48px, 8vw, 96px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.92,
              letterSpacing: -3,
              color: '#fff',
              margin: '14px 0 0',
            }}
          >
            Head-to-head.
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 15,
              color: 'rgba(255,255,255,.65)',
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            All-time records against every club we&rsquo;ve faced. Sorted by win percentage, most played first on ties.
          </p>
        </CContainer>
      </div>

      <CContainer padding="48px 32px 80px">
        {clubs.length === 0 ? (
          <CCard padding="40px 32px">
            <div style={{ textAlign: 'center', color: '#888', fontSize: 15 }}>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 36,
                  fontStyle: 'italic',
                  marginBottom: 8,
                  color: '#bbb',
                }}
              >
                Nothing yet.
              </div>
              H2H records appear once scorecards are synced from Play-Cricket.
            </div>
          </CCard>
        ) : (
          <>
            {/* Column header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 56px 56px 56px 100px',
                gap: 12,
                padding: '0 16px 10px',
                borderBottom: `2px solid ${C_INK}`,
              }}
              className="clubs-row-hide-mobile"
            >
              <CMonoLabel>Opponent</CMonoLabel>
              <CMonoLabel>P</CMonoLabel>
              <CMonoLabel>W</CMonoLabel>
              <CMonoLabel>L</CMonoLabel>
              <CMonoLabel>W%</CMonoLabel>
              <CMonoLabel>Form (last 5)</CMonoLabel>
            </div>

            {clubs.map((club, i) => {
              const slug = clubSlug(club.opponent)
              const winPct = club.played > 0 ? Math.round((club.won / club.played) * 100) : 0
              const isTop = i === 0

              return (
                <Link
                  key={club.opponent}
                  href={`/clubs/${slug}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 56px 56px 56px 56px 100px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '16px 16px',
                    borderBottom: `1px dashed ${C_RULE}`,
                    textDecoration: 'none',
                    color: C_INK,
                    background: isTop ? 'rgba(13,59,39,.04)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  className="clubs-row"
                >
                  {/* Opponent name */}
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: display,
                        fontSize: 22,
                        fontWeight: 500,
                        letterSpacing: -0.5,
                        lineHeight: 1.1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <CVs /> {club.opponent}
                    </div>
                    {club.lastDate && (
                      <div
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          color: '#999',
                          letterSpacing: 1.5,
                          textTransform: 'uppercase',
                          marginTop: 3,
                        }}
                      >
                        Last: {new Date(club.lastDate + 'T00:00:00').toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>

                  {/* P */}
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#444',
                    }}
                  >
                    {club.played}
                  </div>

                  {/* W */}
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 16,
                      fontWeight: 700,
                      color: C_GREEN_LT,
                    }}
                  >
                    {club.won}
                  </div>

                  {/* L */}
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 16,
                      fontWeight: 700,
                      color: C_RED,
                    }}
                  >
                    {club.lost}
                  </div>

                  {/* W% */}
                  <div
                    style={{
                      fontFamily: mono,
                      fontSize: 14,
                      fontWeight: 700,
                      color: winPct >= 50 ? C_GREEN_LT : winPct === 0 ? C_RED : '#888',
                    }}
                  >
                    {winPct}%
                  </div>

                  {/* Form chips */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {club.form.map((letter, fi) => (
                      <CFormChip key={fi} letter={letter} size={24} />
                    ))}
                  </div>
                </Link>
              )
            })}
          </>
        )}
      </CContainer>

      <style>{`
        @media (max-width: 640px) {
          .clubs-row {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto;
          }
          .clubs-row-hide-mobile { display: none !important; }
        }
        .clubs-row:hover { background: rgba(13,59,39,.06) !important; }
      `}</style>
    </div>
  )
}
