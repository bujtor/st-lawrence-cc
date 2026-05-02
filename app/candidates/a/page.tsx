import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { topBatters, topBowlers, table, tweets } from '../_data/stubs'
import type { Fixture } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const A_GREEN = '#1f5a3f'
const A_GREEN_DK = '#123a28'
const A_RED = '#8e1d2c'
const A_CREAM = '#faf7f1'
const A_INK = '#1a1a1a'

const serif = 'var(--font-libre-caslon), "Source Serif 4", Georgia, serif'
const mono = 'var(--font-jetbrains), ui-monospace, monospace'
const sans = 'var(--font-geist-sans), Inter, system-ui, sans-serif'

const sponsors = [
  { name: 'Mount Vineyard', file: 'mount-vineyard.png' },
  { name: 'Barber Jack',    file: 'barber-jack.png' },
  { name: 'JML',            file: 'jml.jpeg' },
  { name: 'Regal Point',    file: 'regal-point.jpg' },
  { name: 'Gulliver',       file: 'gulliver.png' },
  { name: 'Savills',        file: 'savills.png' },
]

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatDateNum(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function SLCCMark({ color = '#fff', size = 28 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="19" fill="none" stroke={color} strokeWidth="1.5" />
      <text x="20" y="27" textAnchor="middle"
        fontFamily={`var(--font-unifrakturcook), "UnifrakturMaguntia", serif`}
        fontSize="22" fontWeight="700" fill={color}>S</text>
    </svg>
  )
}

function HeritageStamp() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid rgba(255,255,255,.55)', padding: '9px 14px',
      transform: 'rotate(-3deg)',
      fontFamily: serif, fontStyle: 'italic', color: 'rgba(255,255,255,.85)',
      fontSize: 13, letterSpacing: 1, lineHeight: 1,
    }}>
      <span style={{ fontVariantCaps: 'all-small-caps', letterSpacing: 2, fontStyle: 'normal' }}>Est.</span>
      <span style={{ fontFamily: serif, fontWeight: 700, marginLeft: 8, fontSize: 18, fontStyle: 'normal' }}>1877</span>
    </div>
  )
}

function ScoreCard({ kind, f }: { kind: 'next' | 'last'; f: Fixture | null | undefined }) {
  if (!f) return null
  const isNext = kind === 'next'
  return (
    <div style={{
      background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,.18)', borderRadius: 4,
      padding: '16px 18px', color: '#fff',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: isNext ? '#c9e8d5' : 'rgba(255,255,255,.55)', fontWeight: 600 }}>
        {isNext ? 'Next Match' : 'Last Result'}
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 500, lineHeight: 1.1 }}>
          vs {f.opponent}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '3px 6px',
          background: f.home_away === 'H' ? 'rgba(255,255,255,.18)' : 'rgba(142,29,44,.9)',
          borderRadius: 2, letterSpacing: 1,
        }}>
          {f.home_away === 'H' ? 'HOME' : 'AWAY'}
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>
        {formatDateShort(f.match_date)} · {isNext ? f.venue : f.result_text}
      </div>
      {isNext && (
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.12)',
          display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,.75)',
        }}>
          <span>Meet {f.meet_time?.slice(0, 5) ?? '—'}</span>
          <span>Start {f.start_time?.slice(0, 5) ?? '—'}</span>
          <span style={{ color: '#fff' }}>XI: 9 + 2 maybes</span>
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 28, height: 2, background: A_RED }} />
      <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: A_GREEN, fontWeight: 700, fontFamily: sans }}>
        {children}
      </div>
    </div>
  )
}

function PerfCard({ title, rows }: { title: string; rows: [string, string, string][] }) {
  return (
    <div style={{ border: '1px solid #ececec', borderRadius: 4, padding: '18px 20px', background: '#fff' }}>
      <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500, marginBottom: 14, color: A_INK }}>{title}</div>
      <div>
        {rows.map(([name, stat, sub], i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '9px 0', borderTop: i === 0 ? 'none' : '1px dashed #eee',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ width: 18, fontFamily: mono, fontSize: 11, color: '#aaa', textAlign: 'right' }}>{i + 1}.</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: mono, fontWeight: 600, fontSize: 13, color: A_GREEN_DK }}>{stat}</div>
              <div style={{ fontSize: 11, color: '#999', fontFamily: mono }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UpcomingCard({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <div style={{ border: '1px solid #ececec', borderRadius: 4, padding: '18px 20px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>Upcoming</div>
        <a href="#" style={{ fontSize: 11, color: A_GREEN, textDecoration: 'none', fontWeight: 600 }}>All fixtures →</a>
      </div>
      {fixtures.map((f, i) => (
        <div key={f.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 0', borderTop: i === 0 ? 'none' : '1px dashed #eee',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: '#999', width: 46 }}>
              {formatDateNum(f.match_date)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{f.opponent}</div>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 2, letterSpacing: 1,
            background: f.home_away === 'H' ? '#e8f1ec' : '#f5e6e8',
            color: f.home_away === 'H' ? A_GREEN : A_RED,
          }}>
            {f.home_away}
          </div>
        </div>
      ))}
    </div>
  )
}

function TableCard() {
  const topSix = table.slice(0, 6)
  return (
    <div style={{ border: '1px solid #ececec', borderRadius: 4, padding: '18px 20px', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div style={{ fontFamily: serif, fontSize: 18, fontWeight: 500 }}>KCVL Division</div>
        <a href="#" style={{ fontSize: 11, color: A_GREEN, textDecoration: 'none', fontWeight: 600 }}>Full table →</a>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '18px 1fr 30px 30px 46px', gap: 6,
        fontSize: 10, color: '#999', fontFamily: mono, letterSpacing: 0.5,
        paddingBottom: 6, borderBottom: '1px solid #eee',
      }}>
        <div>#</div><div></div>
        <div style={{ textAlign: 'right' }}>P</div>
        <div style={{ textAlign: 'right' }}>W</div>
        <div style={{ textAlign: 'right' }}>PTS</div>
      </div>
      {topSix.map((r) => (
        <div key={r.team} style={{
          display: 'grid', gridTemplateColumns: '18px 1fr 30px 30px 46px', gap: 6,
          padding: '7px 0', alignItems: 'center',
          background: r.self ? '#f4f9f6' : 'transparent',
          marginLeft: r.self ? -8 : 0, marginRight: r.self ? -8 : 0,
          paddingLeft: r.self ? 8 : 0, paddingRight: r.self ? 8 : 0,
          borderRadius: r.self ? 3 : 0,
        }}>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#999' }}>{r.pos}</div>
          <div style={{ fontSize: 13, fontWeight: r.self ? 700 : 400, color: r.self ? A_GREEN_DK : A_INK }}>{r.team}</div>
          <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#555' }}>{r.p}</div>
          <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#555' }}>{r.w}</div>
          <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{r.pts}</div>
        </div>
      ))}
    </div>
  )
}

export default async function CandidateAPage() {
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
    .limit(4)

  const next = nextFixtures?.[0] ?? null
  const last = lastResults?.[0] ?? null
  const upcoming: Fixture[] = upcomingFixtures ?? []

  return (
    <div style={{ fontFamily: sans, color: A_INK, background: '#fff' }}>
      {/* Preview mode banner */}
      <div style={{ background: '#fffbe6', borderBottom: '1px solid #f0e6b0', padding: '8px 32px', fontSize: 12, color: '#7a6a20', textAlign: 'center' }}>
        Preview mode — only the home page is fully designed in this direction.
        Navigation links below are dead.{' '}
        <Link href="/candidates" style={{ color: A_GREEN, fontWeight: 600, textDecoration: 'none' }}>Back to candidates</Link>
      </div>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #eee', background: '#fff', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: A_INK }}>
            <SLCCMark color={A_GREEN} size={32} />
            <div style={{ fontFamily: serif, fontWeight: 600, letterSpacing: -0.3, fontSize: 18 }}>St Lawrence CC</div>
          </a>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: 14, fontWeight: 500 }}>
            {['Fixtures', 'Table', 'Stats', 'Sponsors', 'About'].map((l) => (
              <a key={l} href="#" style={{ color: '#4a4a4a', textDecoration: 'none' }}>{l}</a>
            ))}
            <a href="#" style={{ padding: '8px 14px', background: A_GREEN, color: '#fff', borderRadius: 6, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Join Us</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', height: 620, overflow: 'hidden', background: A_GREEN_DK }}>
        <Image
          src="/images/gallery/hero-batting-hedge.jpg"
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover"
          style={{ objectPosition: '50% 40%', opacity: 0.9 }}
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(18,58,40,.35) 0%, rgba(18,58,40,.25) 40%, rgba(18,58,40,.95) 100%)` }} />

        {/* Diagonal sash */}
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 260, height: 600,
          background: A_RED, opacity: 0.92, transform: 'rotate(18deg)', transformOrigin: 'top right',
          boxShadow: '-8px 0 40px rgba(0,0,0,.2)',
        }} />
        <div style={{
          position: 'absolute', top: -40, right: 190, width: 10, height: 700,
          background: '#fff', transform: 'rotate(18deg)', transformOrigin: 'top right',
        }} />

        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '80px 32px 40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: serif, fontSize: 13, letterSpacing: 4, color: 'rgba(255,255,255,.75)', textTransform: 'uppercase' }}>
              Bitchet Green · Ivy Hatch · Kent
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 92, lineHeight: 0.92, fontWeight: 500, color: '#fff', margin: '18px 0 0', letterSpacing: -1.5 }}>
              St Lawrence<br />
              <span style={{ fontStyle: 'italic', fontWeight: 400 }}>Cricket Club</span>
            </h1>
            <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
              <HeritageStamp />
              <div style={{ color: 'rgba(255,255,255,.7)', fontSize: 14, maxWidth: 420, lineHeight: 1.5 }}>
                A Kent County Village League side, playing at Bitchet Green since 1877. Saturday cricket, loud teas, occasional victory.
              </div>
            </div>
          </div>

          {/* Scoreboard card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 720 }}>
            <ScoreCard kind="next" f={next} />
            <ScoreCard kind="last" f={last} />
          </div>
        </div>
      </div>

      {/* Sponsor strip */}
      <div style={{ borderBottom: '1px solid #efefef', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#a0a0a0', fontWeight: 600, fontFamily: sans }}>
            Backed by
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
            {sponsors.map((s) => (
              <Image
                key={s.name}
                src={`/images/sponsors/${s.file}`}
                alt={s.name}
                width={100}
                height={34}
                style={{ height: 28, width: 'auto', objectFit: 'contain', filter: 'grayscale(1)', opacity: 0.65 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* This season */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 32px 32px' }}>
        <SectionLabel>This Season</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 40, marginTop: 28, alignItems: 'start' }}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <PerfCard
                title="Top of the batting"
                rows={topBatters.slice(0, 4).map(b => [b.name, `${b.runs} runs`, `avg ${b.avg}`])}
              />
              <PerfCard
                title="Top of the bowling"
                rows={topBowlers.slice(0, 4).map(b => [b.name, `${b.wkts} wkts`, `best ${b.best}`])}
              />
            </div>
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <UpcomingCard fixtures={upcoming} />
              <TableCard />
            </div>
          </div>

          {/* Quote block */}
          <div style={{
            background: A_CREAM, border: '1px solid #ebe5d7', borderRadius: 4, padding: '32px 34px',
            display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 100,
          }}>
            <div style={{ fontSize: 72, fontFamily: serif, color: A_RED, lineHeight: 0.5, height: 24 }}>“</div>
            <div style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.4, fontStyle: 'italic', color: A_INK }}>
              Play fair. Stay late. Chase the ice cream van.
            </div>
            <div style={{ fontSize: 12, color: '#999', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: sans }}>
              — club motto, officially adopted about six weeks ago
            </div>
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #ebe5d7' }}>
              <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#888', fontWeight: 600, fontFamily: sans }}>Since 1877</div>
              <div style={{ fontFamily: serif, fontSize: 72, lineHeight: 1, fontWeight: 500, color: A_GREEN_DK, marginTop: 6 }}>149</div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Seasons of village cricket at Bitchet Green. Most of them lost in the third over.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saints Want You */}
      <div style={{ position: 'relative', overflow: 'hidden', background: A_GREEN_DK, color: '#fff' }}>
        <Image
          src="/images/gallery/team-pavilion.jpg"
          alt="St Lawrence CC team"
          fill
          className="object-cover"
          style={{ opacity: 0.18 }}
        />
        <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '80px 32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: '#f6c4ca', fontWeight: 600, fontFamily: sans }}>
              The Saints want you
            </div>
            <h2 style={{ fontFamily: serif, fontSize: 64, lineHeight: 1, fontWeight: 500, margin: '16px 0 20px', letterSpacing: -1 }}>
              Fancy a game?
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,.78)', maxWidth: 560 }}>
              Lapsed club cricketer? Complete beginner? Someone&rsquo;s dad who keeps muttering about &ldquo;getting back into it&rdquo;?
              We play 18 Saturdays a year, lose gracefully, and take tea seriously. All ages and abilities welcome —
              especially anyone who can bowl a straight one.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 4, padding: 28 }}>
            <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 600, fontFamily: sans }}>Get in touch</div>
            <div style={{ fontFamily: serif, fontSize: 22, marginTop: 6, marginBottom: 4 }}>Paul Smith</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 18 }}>Captain &amp; fixtures secretary</div>
            <a
              href="mailto:pmsmith31@icloud.com"
              style={{ display: 'block', textAlign: 'center', padding: '12px 18px', background: A_RED, color: '#fff', textDecoration: 'none', borderRadius: 4, fontWeight: 600, fontSize: 14, letterSpacing: 0.5 }}
            >
              Email Paul
            </a>
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,.55)' }}>
              or call <span style={{ fontFamily: mono, color: '#fff' }}>07783 596 582</span>
            </div>
          </div>
        </div>
      </div>

      {/* Photo strip + social */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '64px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 }}>
          {/* Photo strip */}
          <div>
            <SectionLabel>From the boundary</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 28 }}>
              <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 4 }}>
                <Image src="/images/gallery/batting-shot.jpg" alt="Cover drive, v. Shoreham" fill className="object-cover" />
                <div style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 11, fontFamily: mono, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '3px 6px' }}>
                  Cover drive, v. Shoreham
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12 }}>
                {[
                  { src: '/images/gallery/roller.jpg', caption: 'Roger on the roller. Again.' },
                  { src: '/images/gallery/bowling-action.jpg', caption: 'Martin mid-over' },
                ].map((p) => (
                  <div key={p.src} style={{ position: 'relative', overflow: 'hidden', borderRadius: 4, aspectRatio: '4 / 3' }}>
                    <Image src={p.src} alt={p.caption} fill className="object-cover" />
                    <div style={{ position: 'absolute', bottom: 8, left: 10, fontSize: 10, fontFamily: mono, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '2px 5px' }}>
                      {p.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social feed */}
          <div>
            <SectionLabel>From the pavilion</SectionLabel>
            <div style={{ marginTop: 28, border: '1px solid #ececec', borderRadius: 4, padding: '8px 20px', background: '#fff' }}>
              {tweets.map((t, i) => (
                <div key={i} style={{ padding: '14px 0', borderTop: i === 0 ? 'none' : '1px dashed #eee' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: A_GREEN_DK }}>{t.who}</span>
                    <span style={{ fontSize: 11, color: '#aaa', fontFamily: mono }}>{t.when}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.45, color: '#333' }}>{t.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #eee', background: '#fafafa' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <SLCCMark color={A_GREEN} size={28} />
              <div style={{ fontFamily: serif, fontWeight: 600, fontSize: 16 }}>St Lawrence Cricket Club</div>
            </div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 8, lineHeight: 1.5 }}>
              Bitchet Green, Ivy Hatch, Sevenoaks, Kent TN15 0NB<br />
              Founded 1877 · Kent County Village League
            </div>
          </div>
          <div style={{ display: 'flex', gap: 40, fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#aaa', fontWeight: 600, marginBottom: 8, fontFamily: sans }}>The Club</div>
              {['Fixtures', 'Results', 'Table', 'Stats'].map(l => (
                <div key={l} style={{ padding: '3px 0', color: '#555' }}>{l}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: '#aaa', fontWeight: 600, marginBottom: 8, fontFamily: sans }}>Elsewhere</div>
              {['Play-Cricket', 'Twitter', 'Club Shop', 'Sponsors'].map(l => (
                <div key={l} style={{ padding: '3px 0', color: '#555' }}>{l}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #eee', padding: '14px 32px', fontSize: 11, color: '#aaa', textAlign: 'center', fontFamily: mono }}>
          &copy; {new Date().getFullYear()} St Lawrence CC · Website by the captain, at some point
        </div>
      </footer>
    </div>
  )
}
