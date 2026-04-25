import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const alt = 'St Lawrence CC scorecard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)

  let opponent = 'Unknown'
  let matchDate = ''
  let resultText: string | null = null
  let ourScore = ''
  let oppScore = ''
  let venue = ''

  if (!isNaN(fixtureId)) {
    const { data: fixture } = await supabase
      .from('fixtures')
      .select('opponent, match_date, result_text, venue, play_cricket_match_id')
      .eq('id', fixtureId)
      .single()

    if (fixture) {
      opponent = fixture.opponent ?? 'Unknown'
      matchDate = fixture.match_date ? fmtDate(fixture.match_date) : ''
      resultText = fixture.result_text ?? null
      venue = fixture.venue ?? ''

      if (fixture.play_cricket_match_id) {
        const { data: sc } = await supabase
          .from('match_scorecards')
          .select('our_runs, our_wickets, opp_runs, opp_wickets')
          .eq('match_id', fixture.play_cricket_match_id)
          .single()

        if (sc) {
          if (sc.our_runs != null) {
            ourScore = `${sc.our_runs}${sc.our_wickets != null && sc.our_wickets < 10 ? `-${sc.our_wickets}` : ''}`
          }
          if (sc.opp_runs != null) {
            oppScore = `${sc.opp_runs}${sc.opp_wickets != null && sc.opp_wickets < 10 ? `-${sc.opp_wickets}` : ''}`
          }
        }
      }
    }
  }

  const resultColor =
    resultText === 'Won' ? '#059669'
    : resultText === 'Lost' ? '#e11d48'
    : resultText === 'Drew' ? '#6b7280'
    : '#6b7280'

  const resultBg =
    resultText === 'Won' ? '#d1fae5'
    : resultText === 'Lost' ? '#ffe4e6'
    : '#f3f4f6'

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
              St Lawrence Cricket Club
            </span>
            {matchDate && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 4 }}>
                {matchDate}{venue ? ` · ${venue}` : ''}
              </span>
            )}
          </div>
          {resultText && (
            <div style={{
              background: resultBg,
              color: resultColor,
              fontSize: 22,
              fontWeight: 800,
              padding: '10px 28px',
              borderRadius: 12,
              letterSpacing: 1,
            }}>
              {resultText.toUpperCase()}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: 600 }}>
            St Lawrence CC vs
          </div>
          <div style={{ color: 'white', fontSize: 64, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>
            {opponent}
          </div>

          {/* Scores */}
          {(ourScore || oppScore) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 12 }}>
              {ourScore && (
                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  padding: '12px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>St Lawrence</span>
                  <span style={{ color: 'white', fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>{ourScore}</span>
                </div>
              )}
              {ourScore && oppScore && (
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 32, fontWeight: 300 }}>vs</span>
              )}
              {oppScore && (
                <div style={{
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: 12,
                  padding: '12px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {opponent.length > 20 ? 'Opponent' : opponent}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>{oppScore}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>st-lawrence-cc.vercel.app</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>Bitchet Green · Ivy Hatch · Kent · Est. 1877</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
