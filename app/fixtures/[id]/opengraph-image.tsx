import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const alt = 'St Lawrence CC fixture'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Design-C theme tokens
const C_GREEN   = '#0d3b27'
const C_RED     = '#c12027'
const C_CREAM   = '#f3efe6'
const C_RULE    = '#e5e0d2'

function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

/** Fetch a woff2 font from Google Fonts CSS2 API and return the binary. */
async function loadGoogleFont(family: string, weight: number, italic: boolean): Promise<ArrayBuffer> {
  const style = italic ? 'ital,wght@1,' : 'wght@'
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${style}${weight}&display=swap`
  const css = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
  }).then(r => r.text())
  // Extract first woff2 src URL
  const match = css.match(/src: url\(([^)]+\.woff2)\)/)
  if (!match) throw new Error(`Could not find woff2 URL for ${family} ${weight} ${italic ? 'italic' : 'normal'}`)
  return fetch(match[1]).then(r => r.arrayBuffer())
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)

  let opponent    = 'Unknown'
  let matchDate   = ''
  let resultText: string | null = null
  let homeAway    = ''
  let competition = ''
  let ourScore    = ''
  let oppScore    = ''

  if (!isNaN(fixtureId)) {
    const { data: fixture } = await supabase
      .from('fixtures')
      .select('opponent, match_date, result_text, home_away, competition, play_cricket_match_id')
      .eq('id', fixtureId)
      .single()

    if (fixture) {
      opponent    = fixture.opponent    ?? 'Unknown'
      matchDate   = fixture.match_date  ? fmtDate(fixture.match_date) : ''
      resultText  = fixture.result_text ?? null
      homeAway    = fixture.home_away   === 'H' ? 'Home' : fixture.home_away === 'A' ? 'Away' : ''
      competition = fixture.competition ?? ''

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

  // Load Fraunces (italic 300 + italic 700) and JetBrains Mono (normal 400)
  const [frauncesLightData, frauncesBoldData, monoData] = await Promise.all([
    loadGoogleFont('Fraunces', 300, true),
    loadGoogleFont('Fraunces', 700, true),
    loadGoogleFont('JetBrains Mono', 400, false),
  ])

  // Build meta strip
  const metaParts: string[] = []
  if (matchDate) metaParts.push(matchDate)
  if (homeAway)  metaParts.push(homeAway)
  if (resultText) metaParts.push(resultText)
  if (competition) metaParts.push(competition)
  const metaStrip = metaParts.join('  ·  ')

  // Kicker label
  const kicker = resultText ? 'MATCH REPORT' : 'FIXTURE'

  // Result pill colour
  const resultPillColor =
    resultText === 'Won'  ? '#16a34a'
    : resultText === 'Lost' ? C_RED
    : resultText === 'Drew' ? '#78716c'
    : null

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: C_GREEN,
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 64px 48px 64px',
          position: 'relative',
        }}
      >
        {/* Left-edge red accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 6,
            height: 630,
            background: C_RED,
          }}
        />

        {/* TOP: Kicker row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          {/* Red dash */}
          <div style={{ width: 28, height: 3, background: C_RED, borderRadius: 2 }} />
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 16,
              fontWeight: 400,
              color: C_RED,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            {kicker}
          </span>
        </div>

        {/* MIDDLE: Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* "v." prefix */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'nowrap' }}>
            <span
              style={{
                fontFamily: 'Fraunces',
                fontSize: 88,
                fontStyle: 'italic',
                fontWeight: 300,
                color: `${C_CREAM}99`,  // cream at ~60% opacity for "v."
                lineHeight: 1.0,
                letterSpacing: -1,
              }}
            >
              v.
            </span>
            <span
              style={{
                fontFamily: 'Fraunces',
                fontSize: opponent.length > 22 ? 64 : 88,
                fontStyle: 'italic',
                fontWeight: 700,
                color: C_CREAM,
                lineHeight: 1.0,
                letterSpacing: -1,
              }}
            >
              {opponent}
            </span>
          </div>

          {/* Hairline rule under headline */}
          <div
            style={{
              width: '100%',
              height: 1,
              background: C_RULE,
              opacity: 0.25,
              marginTop: 24,
              marginBottom: 22,
            }}
          />

          {/* Meta strip */}
          {metaStrip && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontSize: 20,
                  fontWeight: 400,
                  color: `${C_CREAM}b3`,  // cream at ~70%
                  letterSpacing: 0.5,
                }}
              >
                {metaStrip}
              </span>
              {resultText && resultPillColor && (
                <div
                  style={{
                    background: resultPillColor,
                    borderRadius: 4,
                    padding: '4px 14px',
                    marginLeft: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                    }}
                  >
                    {resultText.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Score boxes (if available) */}
          {(ourScore || oppScore) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 24 }}>
              {ourScore && (
                <div
                  style={{
                    border: `1px solid ${C_RULE}55`,
                    borderRadius: 4,
                    padding: '10px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(243,239,230,0.07)',
                  }}
                >
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: `${C_CREAM}66`, letterSpacing: 3, textTransform: 'uppercase' }}>ST LAWRENCE</span>
                  <span style={{ fontFamily: 'Fraunces', fontSize: 42, fontWeight: 700, fontStyle: 'italic', color: C_CREAM, lineHeight: 1.1 }}>{ourScore}</span>
                </div>
              )}
              {ourScore && oppScore && (
                <span style={{ fontFamily: 'Fraunces', fontSize: 28, fontStyle: 'italic', fontWeight: 300, color: `${C_CREAM}44` }}>vs</span>
              )}
              {oppScore && (
                <div
                  style={{
                    border: `1px solid ${C_RULE}40`,
                    borderRadius: 4,
                    padding: '10px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'rgba(243,239,230,0.04)',
                  }}
                >
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: `${C_CREAM}55`, letterSpacing: 3, textTransform: 'uppercase' }}>
                    {opponent.length > 18 ? 'OPPONENT' : opponent.toUpperCase().slice(0, 18)}
                  </span>
                  <span style={{ fontFamily: 'Fraunces', fontSize: 42, fontWeight: 700, fontStyle: 'italic', color: `${C_CREAM}cc`, lineHeight: 1.1 }}>{oppScore}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM: wordmark left, URL right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <span
            style={{
              fontFamily: 'Fraunces',
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 300,
              color: `${C_CREAM}cc`,
              letterSpacing: 0.3,
            }}
          >
            St Lawrence Cricket Club
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono',
              fontSize: 14,
              fontWeight: 400,
              color: `${C_CREAM}66`,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            STLAWRENCECC.CO.UK
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Fraunces',       data: frauncesLightData, style: 'italic', weight: 300 },
        { name: 'Fraunces',       data: frauncesBoldData,  style: 'italic', weight: 700 },
        { name: 'JetBrains Mono', data: monoData,          style: 'normal', weight: 400 },
      ],
    }
  )
}
