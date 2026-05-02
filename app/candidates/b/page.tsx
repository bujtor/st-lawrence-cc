import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { topBatters, topBowlers, table, tweets } from '../_data/stubs'
import type { Fixture } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const B_PAPER = '#f5eedb'
const B_INK = '#1c1a14'
const B_RED = '#a6192e'
const B_GREEN = '#2d5a3f'
const B_RULE = '#c8bd9a'

const serif = 'var(--font-source-serif), "Libre Caslon Text", Georgia, serif'
const mono = 'var(--font-plex-mono), ui-monospace, monospace'
const fraktur = 'var(--font-unifrakturcook), "UnifrakturMaguntia", serif'
const sans = 'var(--font-geist-sans), Inter, system-ui, sans-serif'

const sponsors = [
  { name: 'Barber Jack',    file: 'barber-jack.png' },
  { name: 'JML',            file: 'jml.jpeg' },
  { name: 'Regal Point',    file: 'regal-point.jpg' },
  { name: 'Gulliver',       file: 'gulliver.png' },
  { name: 'Savills',        file: 'savills.png' },
]

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDateNum(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function ScorebookTable({
  title,
  headers,
  rows,
}: {
  title: string
  headers: string[]
  rows: (string | number)[][]
}) {
  return (
    <div>
      <div style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, marginBottom: 10, borderBottom: `2px solid ${B_INK}`, paddingBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span>{title}</span>
        <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6a6248', textTransform: 'uppercase' }}>Top five</span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: mono, fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${B_INK}` }}>
            {headers.map((h, i) => (
              <th key={h} style={{ padding: '6px 4px', textAlign: i === 0 ? 'left' : 'right', fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 12, color: '#6a6248', letterSpacing: 0.5 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px dashed ${B_RULE}` }}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: '7px 4px', textAlign: j === 0 ? 'left' : 'right', fontFamily: j === 0 ? serif : mono, fontSize: j === 0 ? 14 : 13, fontWeight: j === 0 ? 500 : 400, color: j === 0 ? B_INK : '#2a2820' }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontFamily: fraktur, fontSize: 28, color: B_INK, marginBottom: 8, textAlign: 'center' }}>{title}</div>
      <div style={{ borderTop: `2px solid ${B_INK}`, borderBottom: `2px solid ${B_INK}`, padding: '6px 0' }}>
        {children}
      </div>
    </div>
  )
}

export default async function CandidateBPage() {
  const today = new Date().toISOString().split('T')[0]

  const { data: nextFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(1)

  const { data: lastResults } = await supabase
    .from('fixtures')
    .select('*')
    .lt('match_date', today)
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1)

  const { data: upcomingFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(5)

  const next = nextFixtures?.[0] ?? null
  const last = lastResults?.[0] ?? null
  const upcoming: Fixture[] = upcomingFixtures ?? []

  return (
    <div style={{
      fontFamily: serif, color: B_INK, background: B_PAPER,
      backgroundImage: 'radial-gradient(rgba(0,0,0,.02) 1px, transparent 1px)', backgroundSize: '3px 3px',
    }}>
      {/* Preview mode banner */}
      <div style={{ background: '#fffbe6', borderBottom: '1px solid #f0e6b0', padding: '8px 32px', fontSize: 12, color: '#7a6a20', textAlign: 'center', fontFamily: sans }}>
        Preview mode — only the home page is fully designed in this direction.
        Navigation links below are dead.{' '}
        <Link href="/candidates" style={{ color: B_GREEN, fontWeight: 600, textDecoration: 'none' }}>Back to candidates</Link>
      </div>

      {/* Masthead */}
      <div style={{ borderBottom: `4px double ${B_INK}`, background: B_PAPER }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 32px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontFamily: mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#6a6248' }}>
          <div>Vol. CXLIX · No. 5</div>
          <div>Saturday, 23 May · Bitchet Green</div>
          <div>One penny (or the price of a tea)</div>
        </div>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 32px 18px', textAlign: 'center' }}>
          <div style={{ fontFamily: fraktur, fontSize: 96, lineHeight: 1, fontWeight: 400, color: B_INK, letterSpacing: 2 }}>
            St Lawrence Cricket Club
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 10, fontFamily: serif, fontSize: 13, fontStyle: 'italic', color: '#5a5340' }}>
            <span>— Founded at Bitchet Green in the year 1877 —</span>
          </div>
        </div>
        {/* Nav rule */}
        <div style={{ borderTop: `1px solid ${B_INK}`, borderBottom: `1px solid ${B_INK}`, background: B_PAPER }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '10px 32px', display: 'flex', justifyContent: 'center', gap: 36, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', fontFamily: serif }}>
            {['Home', 'Fixtures', 'Table', 'Stats', 'Sponsors', 'About'].map((l, i) => (
              <a key={l} href="#" style={{ color: B_INK, textDecoration: i === 0 ? 'underline' : 'none', textUnderlineOffset: 4, fontWeight: i === 0 ? 600 : 400 }}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Front page grid */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 32px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
          {/* Hero */}
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: B_RED, marginBottom: 6 }}>
              ★ This Saturday&rsquo;s match ★
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 68, lineHeight: 0.98, margin: 0, letterSpacing: -1.2, fontWeight: 700 }}>
              Saints to host Sevenoaks Vine, <em style={{ color: B_RED }}>teas confirmed</em>.
            </h1>
            <div style={{ fontFamily: serif, fontSize: 17, fontStyle: 'italic', color: '#5a5340', marginTop: 10, lineHeight: 1.5 }}>
              Our correspondent reports nine players confirmed, two &ldquo;maybes&rdquo;, and a forecast of 19°C with a light breeze from the south-west.
            </div>
            <figure style={{ margin: '20px 0 0' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', border: `1px solid ${B_INK}`, filter: 'contrast(1.05) sepia(.08)' }}>
                <Image src="/images/gallery/hero-big-hit.jpg" alt="Cricket action" fill className="object-cover" />
              </div>
              <figcaption style={{ fontFamily: mono, fontSize: 11, letterSpacing: 0.5, color: '#6a6248', marginTop: 8 }}>
                Fig. 1 — Captain A. Bujtor, pulling a long-hop to cow corner for four. Kent, July 2025. Photo: the wicket-keeper&rsquo;s wife.
              </figcaption>
            </figure>
          </div>

          {/* Sidebar */}
          <aside>
            {/* Next match */}
            <div style={{ border: `1.5px solid ${B_INK}`, padding: 18, background: '#fffcf3' }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: B_RED, textAlign: 'center', borderBottom: `1px dashed ${B_RULE}`, paddingBottom: 8 }}>
                Next Fixture
              </div>
              {next && (
                <>
                  <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, marginTop: 12, lineHeight: 1.05, textAlign: 'center' }}>
                    St Lawrence<br />
                    <span style={{ fontSize: 14, fontStyle: 'italic', color: '#6a6248', fontWeight: 400, display: 'inline-block', margin: '6px 0' }}>v.</span><br />
                    {next.opponent}
                  </div>
                  <div style={{ borderTop: `1px solid ${B_RULE}`, borderBottom: `1px solid ${B_RULE}`, marginTop: 14, padding: '10px 0', textAlign: 'center' }}>
                    <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#6a6248' }}>
                      {formatDateLong(next.match_date)}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                      {next.home_away === 'H' ? 'Bitchet Green (Home)' : `${next.venue} (Away)`}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, fontFamily: mono, fontSize: 11 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#6a6248', textTransform: 'uppercase', letterSpacing: 1 }}>Meet</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{next.meet_time?.slice(0, 5) ?? '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: '#6a6248', textTransform: 'uppercase', letterSpacing: 1 }}>Start</div>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{next.start_time?.slice(0, 5) ?? '—'}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Last match */}
            {last && (
              <div style={{ marginTop: 20, border: `1px solid ${B_INK}`, padding: '14px 16px', background: B_PAPER }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6a6248' }}>
                  Last week: {formatDateShort(last.match_date)}
                </div>
                <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                  v. {last.opponent} <span style={{ fontSize: 12, fontStyle: 'italic', color: '#6a6248', fontWeight: 400 }}>({last.home_away === 'H' ? 'H' : 'A'})</span>
                </div>
                <div style={{ fontSize: 15, fontStyle: 'italic', marginTop: 2, color: last.result_text?.toLowerCase().startsWith('won') ? B_GREEN : B_RED }}>
                  {last.result_text}.
                </div>
              </div>
            )}

            {/* Pavilion bulletin */}
            <div style={{ marginTop: 20, border: `1px dashed ${B_INK}`, padding: '14px 16px', fontFamily: serif, fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: B_RED, marginBottom: 6 }}>
                Pavilion Bulletin
              </div>
              Teas this Saturday by <b>Mrs. Pemberton</b>. Cake confirmed. The roller has been serviced. Please bring a ball.
            </div>
          </aside>
        </div>
      </div>

      {/* Averages */}
      <div style={{ background: '#fffcf3', borderTop: `3px double ${B_INK}`, borderBottom: `3px double ${B_INK}`, marginTop: 30 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div style={{ fontFamily: fraktur, fontSize: 46, color: B_RED }}>The Averages</div>
            <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 14, color: '#6a6248', marginTop: 2 }}>
              Season to-date. Corrections to the scorer, who usually ignores them.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
            <ScorebookTable
              title="Batting"
              headers={['Player', 'Inn', 'Runs', 'HS', 'Avg']}
              rows={topBatters.map(b => [b.name, b.inns, b.runs, b.hs, b.avg.toFixed(1)])}
            />
            <ScorebookTable
              title="Bowling"
              headers={['Player', 'Ovs', 'Wkts', 'Best', 'Avg']}
              rows={topBowlers.map(b => [b.name, b.overs, b.wkts, b.best, b.avg.toFixed(1)])}
            />
          </div>
        </div>
      </div>

      {/* Three columns */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 36 }}>
          <BColumn title="Upcoming Fixtures">
            {upcoming.map((f, i) => (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '56px 1fr 24px', gap: 8, alignItems: 'baseline', padding: '10px 0', borderTop: i === 0 ? 'none' : `1px dashed ${B_RULE}` }}>
                <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', color: B_RED }}>
                  {formatDateNum(f.match_date)}
                </div>
                <div style={{ fontFamily: serif, fontSize: 15 }}>
                  v. {f.opponent}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: f.home_away === 'H' ? B_GREEN : B_RED, textAlign: 'right' }}>
                  {f.home_away}
                </div>
              </div>
            ))}
          </BColumn>

          <BColumn title="Division Table">
            {table.slice(0, 8).map((r) => (
              <div key={r.team} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 30px 46px', gap: 6, padding: '8px 0', borderTop: r.pos === 1 ? 'none' : `1px dashed ${B_RULE}`, background: r.self ? 'rgba(166,25,46,.06)' : 'transparent', marginLeft: r.self ? -6 : 0, marginRight: r.self ? -6 : 0, paddingLeft: r.self ? 6 : 0, paddingRight: r.self ? 6 : 0 }}>
                <div style={{ fontFamily: mono, fontSize: 11, color: '#6a6248' }}>{r.pos}.</div>
                <div style={{ fontFamily: serif, fontSize: 14, fontWeight: r.self ? 700 : 400 }}>{r.team}</div>
                <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#6a6248' }}>{r.w}</div>
                <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{r.pts} pts</div>
              </div>
            ))}
          </BColumn>

          <BColumn title="Notices &amp; Bulletins">
            {tweets.map((t, i) => (
              <div key={i} style={{ padding: '10px 0', borderTop: i === 0 ? 'none' : `1px dashed ${B_RULE}` }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 1, color: '#6a6248', textTransform: 'uppercase' }}>
                  {t.who} · {t.when}
                </div>
                <div style={{ fontFamily: serif, fontSize: 14, marginTop: 3, lineHeight: 1.45 }}>
                  {t.text}
                </div>
              </div>
            ))}
          </BColumn>
        </div>
      </div>

      {/* Saints Want You — engraved ad */}
      <div style={{ background: B_PAPER, borderTop: `3px double ${B_INK}`, borderBottom: `3px double ${B_INK}` }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
          <div style={{ border: `2px solid ${B_INK}`, padding: 28, background: '#fffcf3', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, border: `1px solid ${B_INK}`, pointerEvents: 'none' }} />
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: B_RED, textAlign: 'center' }}>
              Wanted · Positions Vacant
            </div>
            <div style={{ fontFamily: fraktur, fontSize: 64, textAlign: 'center', lineHeight: 1, margin: '14px 0 10px', color: B_INK }}>
              The Saints <span style={{ color: B_RED }}>Want You.</span>
            </div>
            <div style={{ fontFamily: serif, fontSize: 15, lineHeight: 1.55, textAlign: 'center', maxWidth: 460, margin: '0 auto', fontStyle: 'italic' }}>
              Persons of <b>sound mind</b> (not required) and <b>sound arm</b> (preferred, not essential) invited to
              take the field this season. Teas and tall tales provided. All ages and abilities.
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 18 }}>
              <a
                href="mailto:pmsmith31@icloud.com"
                style={{ fontFamily: mono, fontSize: 12, letterSpacing: 1, padding: '10px 18px', background: B_INK, color: B_PAPER, textDecoration: 'none', textTransform: 'uppercase' }}
              >
                Apply within →
              </a>
              <div style={{ fontFamily: mono, fontSize: 11, alignSelf: 'center', color: '#6a6248' }}>
                or telephone <b style={{ color: B_INK }}>07783 596 582</b>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#6a6248', marginBottom: 8 }}>
              From our President
            </div>
            <blockquote style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 24, lineHeight: 1.35, margin: 0, color: B_INK }}>
              &ldquo;We have lost, broadly speaking, since 1877. But we have lost with our boots on, and someone has always
              remembered to bring the sandwiches.&rdquo;
            </blockquote>
            <div style={{ fontFamily: serif, fontSize: 13, color: '#6a6248', marginTop: 10, fontStyle: 'italic' }}>
              — H. J. Morris, club president 1962–present
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontFamily: fraktur, fontSize: 32, color: B_INK }}>With thanks to our sponsors</div>
          <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, color: '#6a6248', marginTop: 2 }}>
            Without whom the new sightscreens would have remained, regrettably, an ambition.
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 36, padding: '20px 0', borderTop: `1px solid ${B_INK}`, borderBottom: `1px solid ${B_INK}` }}>
          {sponsors.map((s) => (
            <Image
              key={s.name}
              src={`/images/sponsors/${s.file}`}
              alt={s.name}
              width={120}
              height={40}
              style={{ height: 34, width: 'auto', objectFit: 'contain', filter: 'grayscale(1) contrast(1.1)', opacity: 0.8, mixBlendMode: 'multiply' }}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `3px double ${B_INK}`, marginTop: 30, padding: '24px 32px', textAlign: 'center', fontFamily: mono, fontSize: 11, letterSpacing: 1, color: '#6a6248' }}>
        <div style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 13, marginBottom: 6 }}>
          Printed, bound and occasionally proof-read at Bitchet Green.
        </div>
        &copy; {new Date().getFullYear()} St Lawrence CC · Bitchet Green, Ivy Hatch, TN15 0NB · est. MDCCCLXXVII
      </div>
    </div>
  )
}
