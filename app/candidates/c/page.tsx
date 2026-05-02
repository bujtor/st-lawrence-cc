import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { topBatters, topBowlers, table, tweets } from '../_data/stubs'
import type { Fixture } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const C_GREEN = '#0d3b27'
const C_GREEN_LT = '#1a5a3c'
const C_RED = '#c12027'
const C_CREAM = '#f3efe6'
const C_INK = '#111'

const display = 'var(--font-fraunces), "Libre Caslon Text", Georgia, serif'
const sansTight = 'var(--font-inter-tight), Inter, system-ui, sans-serif'
const mono = 'var(--font-jetbrains), ui-monospace, monospace'

const sponsors = [
  { name: 'Mount Vineyard', file: 'mount-vineyard.png' },
  { name: 'Barber Jack',    file: 'barber-jack.png' },
  { name: 'JML',            file: 'jml.jpeg' },
  { name: 'Regal Point',    file: 'regal-point.jpg' },
  { name: 'Gulliver',       file: 'gulliver.png' },
  { name: 'Savills',        file: 'savills.png' },
]

function formatDateDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').getDate()
}
function formatDateWeekday(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })
}
function formatDateMonth(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })
}
function formatDateFull(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}
function formatDateShort(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function CStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 40, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4, letterSpacing: -1 }}>{value}</div>
    </div>
  )
}

function CBigNumber({ label, value, small }: { label: string; value: string; small?: string }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: display, fontSize: 36, fontWeight: 500, lineHeight: 1, marginTop: 4, letterSpacing: -0.5 }}>{value}</div>
      {small && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{small}</div>}
    </div>
  )
}

function CEditorialHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— {kicker}</div>
      <div style={{ fontFamily: display, fontSize: 56, fontWeight: 400, fontStyle: 'italic', lineHeight: 1, letterSpacing: -1.5, marginTop: 8 }}>
        {title}
      </div>
    </div>
  )
}

function CLeaderCard({ title, rows, color }: { title: string; rows: { n: number; name: string; big: string; small: string }[]; color: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e0d2', padding: '28px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${color}`, paddingBottom: 10 }}>
        <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5 }}>{title}</div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: '#888', textTransform: 'uppercase' }}>Top 5 · 2026</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: i === rows.length - 1 ? 'none' : '1px dashed #e5e0d2' }}>
          <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, color: i === 0 ? color : '#ccc', lineHeight: 1 }}>0{r.n}</div>
          <div>
            <div style={{ fontFamily: display, fontSize: 18, fontWeight: 500, letterSpacing: -0.3 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{r.small}</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color }}>
            {r.big}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function CandidateCPage() {
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
    <div style={{ fontFamily: sansTight, color: C_INK, background: C_CREAM }}>
      {/* Preview mode banner */}
      <div style={{ background: '#fffbe6', borderBottom: '1px solid #f0e6b0', padding: '8px 32px', fontSize: 12, color: '#7a6a20', textAlign: 'center', fontFamily: sansTight }}>
        Preview mode — only the home page is fully designed in this direction.
        Navigation links below are dead.{' '}
        <Link href="/candidates" style={{ color: C_GREEN, fontWeight: 600, textDecoration: 'none' }}>Back to candidates</Link>
      </div>

      {/* Nav */}
      <nav style={{ background: C_GREEN, color: '#fff', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: display, fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>ST·LAWRENCE</div>
            <div style={{ height: 16, width: 1, background: 'rgba(255,255,255,.3)' }} />
            <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.65)' }}>Est. 1877 · CC</div>
          </div>
          <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontSize: 13, fontWeight: 500, letterSpacing: 0.3 }}>
            {['Fixtures', 'Table', 'Stats', 'Sponsors', 'About'].map(l => (
              <a key={l} href="#" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}>{l}</a>
            ))}
            <a href="#join" style={{ padding: '8px 14px', background: C_RED, color: '#fff', borderRadius: 2, textDecoration: 'none', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>Play for us</a>
          </div>
        </div>
      </nav>

      {/* Full-bleed hero */}
      <div style={{ position: 'relative', height: 780, overflow: 'hidden' }}>
        <Image
          src="/images/gallery/hero-batting-cottage.jpg"
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover"
          priority
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(13,59,39,.85) 0%, rgba(13,59,39,.35) 45%, rgba(13,59,39,.15) 70%, rgba(13,59,39,.75) 100%)' }} />

        {/* Top metadata */}
        <div style={{ position: 'absolute', top: 24, left: 32, right: 32, display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase' }}>
          <span>Bitchet Green · N 51.274 · E 0.230</span>
          <span>Season 2026 — Week 05</span>
        </div>

        {/* Massive headline */}
        <div style={{ position: 'absolute', left: 32, right: 32, bottom: 40, maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ width: 48, height: 2, background: C_RED }} />
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,.9)', fontWeight: 600 }}>
              Village Cricket, Since the year of the bicycle
            </div>
          </div>
          <h1 style={{ fontFamily: display, fontSize: 180, lineHeight: 0.82, fontWeight: 300, color: '#fff', margin: 0, letterSpacing: -6, fontVariationSettings: "'opsz' 144" }}>
            St Lawrence<br />
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#fff' }}>Cricket Club.</span>
          </h1>
          <div style={{ marginTop: 26, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
            <div style={{ maxWidth: 520, color: 'rgba(255,255,255,.85)', fontSize: 18, lineHeight: 1.5, fontWeight: 300 }}>
              Eighteen Saturdays a year on a ground surrounded by orchards, oak and one particularly nosy labrador.
              We are <b style={{ fontWeight: 600 }}>the Saints</b>, of the Kent County Village League.
            </div>
            <div style={{ display: 'flex', gap: 40 }}>
              <CStat label="Founded" value="1877" />
              <CStat label="Seasons" value="149" />
              <CStat label="W-L 2026" value="3–2" />
            </div>
          </div>
        </div>
      </div>

      {/* Sponsor strip — dark band */}
      <div style={{ background: C_INK, color: 'rgba(255,255,255,.55)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>Backed by our sponsors ———</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            {sponsors.map(s => (
              <Image
                key={s.name}
                src={`/images/sponsors/${s.file}`}
                alt={s.name}
                width={100}
                height={28}
                style={{ height: 24, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.55 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scoreboard row */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '64px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 32 }}>
          {/* Next match */}
          <div style={{ background: C_GREEN, color: '#fff', padding: '36px 40px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: mono, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,.5)' }}>
              MATCH 06/18
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: C_RED, fontWeight: 700 }}>
              ▸ Next up · {next ? formatDateFull(next.match_date) : '—'}
            </div>
            {next && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: display, fontSize: 78, lineHeight: 0.92, letterSpacing: -2.5, fontWeight: 500 }}>
                  <span style={{ fontStyle: 'italic', fontWeight: 400, opacity: 0.6 }}>v.</span> {next.opponent}
                </div>
                <div style={{ display: 'flex', gap: 40, marginTop: 26, borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 22 }}>
                  <CBigNumber label="Start" value={next.start_time?.slice(0, 5) ?? '—'} />
                  <CBigNumber label="Meet" value={next.meet_time?.slice(0, 5) ?? '—'} />
                  <CBigNumber label="Venue" value={next.home_away === 'H' ? 'Home' : 'Away'} small={next.home_away === 'H' ? 'Bitchet Green' : next.venue} />
                  <CBigNumber label="XI" value="9+2" small="confirmed + maybes" />
                </div>
              </div>
            )}
          </div>

          {/* Last match */}
          {last && (
            <div style={{ background: '#fff', border: '1px solid #e5e0d2', padding: '28px 32px', position: 'relative' }}>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>
                Last result · {formatDateShort(last.match_date)}
              </div>
              <div style={{ fontFamily: display, fontSize: 40, lineHeight: 1.02, letterSpacing: -1, fontWeight: 500, marginTop: 10 }}>
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#888' }}>v.</span> {last.opponent}
              </div>
              <div style={{ fontFamily: display, fontStyle: 'italic', fontSize: 30, lineHeight: 1, color: last.result_text?.toLowerCase().startsWith('won') ? C_GREEN_LT : C_RED, marginTop: 16, letterSpacing: -0.5 }}>
                {last.result_text}.
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed #d6d0be', fontSize: 13, color: '#555', lineHeight: 1.5 }}>
                Martin 4/18 in a pivotal opening burst; Shea&rsquo;s 58 off 64 steadied the chase before a late collapse
                left the Saints short. The <b>Martin Jug</b> returns to the cabinet.
              </div>
              <a href="#" style={{ display: 'inline-block', marginTop: 14, fontFamily: mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C_RED, textDecoration: 'none', fontWeight: 700 }}>
                Read the match report →
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Editorial spread */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 48 }}>
          {/* Fixtures */}
          <div>
            <CEditorialHeader kicker="The Season Ahead" title="Saturdays of consequence." />
            <div style={{ borderTop: `2px solid ${C_INK}`, marginTop: 26 }}>
              {upcoming.map((f) => (
                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto 60px', gap: 20, alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #e5e0d2' }}>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: C_RED, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                      {formatDateWeekday(f.match_date)}
                    </div>
                    <div style={{ fontFamily: display, fontSize: 34, lineHeight: 1, fontWeight: 500, letterSpacing: -1 }}>
                      {formatDateDay(f.match_date)}
                    </div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>
                      {formatDateMonth(f.match_date)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: display, fontSize: 24, letterSpacing: -0.5, fontWeight: 500, lineHeight: 1.1 }}>
                      <span style={{ fontStyle: 'italic', color: '#aaa', fontWeight: 400 }}>v.</span> {f.opponent}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      {f.venue} · meet {f.meet_time?.slice(0, 5) ?? '—'} · start {f.start_time?.slice(0, 5) ?? '—'}
                    </div>
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, padding: '5px 10px', background: f.home_away === 'H' ? C_GREEN : C_RED, color: '#fff', letterSpacing: 2 }}>
                    {f.home_away === 'H' ? 'HOME' : 'AWAY'}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: mono, fontSize: 11, color: '#bbb' }}>
                    #{f.id.toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
            <a href="#" style={{ display: 'inline-block', marginTop: 20, fontFamily: mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C_RED, textDecoration: 'none', fontWeight: 700 }}>
              All 18 fixtures →
            </a>
          </div>

          {/* Table sidebar */}
          <div>
            <CEditorialHeader kicker="Division" title="The standings." />
            <div style={{ marginTop: 26, background: '#fff', border: '1px solid #e5e0d2', padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 28px 28px 46px', gap: 6, fontFamily: mono, fontSize: 10, color: '#999', letterSpacing: 1.5, paddingBottom: 8, borderBottom: '1px solid #e5e0d2', textTransform: 'uppercase' }}>
                <div>Pos</div><div></div>
                <div style={{ textAlign: 'right' }}>P</div>
                <div style={{ textAlign: 'right' }}>W</div>
                <div style={{ textAlign: 'right' }}>Pts</div>
              </div>
              {table.slice(0, 8).map((r) => (
                <div key={r.team} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 28px 28px 46px', gap: 6, padding: '8px 0', alignItems: 'center', borderBottom: '1px dashed #e5e0d2', background: r.self ? 'rgba(193,32,39,.06)' : 'transparent', marginLeft: r.self ? -8 : 0, marginRight: r.self ? -8 : 0, paddingLeft: r.self ? 8 : 0, paddingRight: r.self ? 8 : 0 }}>
                  <div style={{ fontFamily: mono, fontSize: 11, color: r.self ? C_RED : '#888', fontWeight: r.self ? 700 : 400 }}>{r.pos.toString().padStart(2, '0')}</div>
                  <div style={{ fontFamily: display, fontSize: 15, fontWeight: r.self ? 600 : 500, color: r.self ? C_GREEN : C_INK }}>{r.team}</div>
                  <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#666' }}>{r.p}</div>
                  <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', color: '#666' }}>{r.w}</div>
                  <div style={{ fontFamily: mono, fontSize: 12, textAlign: 'right', fontWeight: 700 }}>{r.pts}</div>
                </div>
              ))}
            </div>

            {/* Form */}
            <div style={{ marginTop: 28 }}>
              <CEditorialHeader kicker="Recent form" title="Last five." />
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {(['W', 'L', 'W', 'W', 'L'] as const).map((r, i) => (
                  <div key={i} style={{ width: 42, height: 42, fontFamily: display, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: r === 'W' ? C_GREEN : C_RED, color: '#fff' }}>{r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <div style={{ maxWidth: 980, margin: '0 auto', padding: '100px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700, marginBottom: 24 }}>
            Motto
          </div>
          <div style={{ fontFamily: display, fontSize: 84, fontWeight: 400, fontStyle: 'italic', lineHeight: 1.02, letterSpacing: -2 }}>
            &ldquo;Play fair. Stay late. Chase the ice&nbsp;cream van.&rdquo;
          </div>
        </div>
      </div>

      {/* Top performers */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px' }}>
        <CEditorialHeader kicker="Form Guide · 2026" title="Leading the charts." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 32 }}>
          <CLeaderCard
            title="Batting"
            color={C_GREEN}
            rows={topBatters.slice(0, 5).map((b, i) => ({
              n: i + 1, name: b.name, big: `${b.runs} runs`, small: `${b.inns} inn · avg ${b.avg}`,
            }))}
          />
          <CLeaderCard
            title="Bowling"
            color={C_RED}
            rows={topBowlers.slice(0, 5).map((b, i) => ({
              n: i + 1, name: b.name, big: `${b.wkts} wkts`, small: `${b.overs} overs · best ${b.best}`,
            }))}
          />
        </div>
      </div>

      {/* Saints Want You */}
      <div id="join" style={{ position: 'relative', overflow: 'hidden', color: '#fff', background: C_INK }}>
        <Image
          src="/images/gallery/team-away.jpg"
          alt="St Lawrence CC team"
          fill
          className="object-cover"
          style={{ opacity: 0.35 }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(17,17,17,.6) 0%, rgba(13,59,39,.85) 100%)' }} />
        <div style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '120px 32px', textAlign: 'center', zIndex: 1 }}>
          <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 4, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>
            ★ Recruiting ★
          </div>
          <h2 style={{ fontFamily: display, fontSize: 200, fontWeight: 400, fontStyle: 'italic', lineHeight: 0.9, letterSpacing: -6, margin: '20px 0 10px' }}>
            The Saints<br />
            <span style={{ fontStyle: 'normal', fontWeight: 600, color: C_RED }}>want you.</span>
          </h2>
          <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 620, margin: '28px auto 0', color: 'rgba(255,255,255,.8)' }}>
            Experienced cricketer, rusty club player, or someone whose last innings was Under-13s Colts —
            you are welcome here. Bring whites if you&rsquo;ve got &rsquo;em, borrow ours if you haven&rsquo;t.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 36 }}>
            <a
              href="mailto:pmsmith31@icloud.com"
              style={{ padding: '16px 28px', background: C_RED, color: '#fff', textDecoration: 'none', fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}
            >
              Email the captain
            </a>
            <a
              href="tel:07783596582"
              style={{ padding: '16px 28px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.4)', textDecoration: 'none', fontFamily: mono, fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}
            >
              07783 596 582
            </a>
          </div>
        </div>
      </div>

      {/* Photo strip + social */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '72px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div>
            <CEditorialHeader kicker="Gallery" title="From the boundary." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
              {[
                '/images/gallery/batting-shot.jpg',
                '/images/gallery/bowling-action.jpg',
                '/images/gallery/roller.jpg',
                '/images/gallery/pavilion-social.jpg',
              ].map((p, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image src={p} alt="Gallery" fill className="object-cover" style={{ filter: 'saturate(1.05)' }} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <CEditorialHeader kicker="The Pavilion" title="Dispatches." />
            <div style={{ marginTop: 24 }}>
              {tweets.map((t, i) => (
                <div key={i} style={{ padding: '18px 0', borderBottom: '1px solid #e5e0d2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, color: '#888', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    <span style={{ color: C_GREEN_LT, fontWeight: 700 }}>{t.who}</span>
                    <span>{t.when} ago</span>
                  </div>
                  <div style={{ fontFamily: display, fontSize: 19, lineHeight: 1.4, marginTop: 6, fontWeight: 400 }}>
                    {t.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: C_INK, color: 'rgba(255,255,255,.55)', padding: '48px 32px 24px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, color: '#fff', letterSpacing: -0.5 }}>
              St Lawrence CC
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, marginTop: 6 }}>
              EST. MDCCCLXXVII · BITCHET GREEN
            </div>
            <div style={{ fontSize: 13, marginTop: 20, lineHeight: 1.6, maxWidth: 320 }}>
              Bitchet Green, Ivy Hatch, Sevenoaks, Kent TN15 0NB.<br />
              A Kent County Village League side.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 56, fontSize: 13 }}>
            {([['The Club', ['Fixtures', 'Results', 'Table', 'Stats']], ['Connect', ['Twitter', 'Play-Cricket', 'Club Shop', 'Sponsors']]] as [string, string[]][]).map(([head, items]) => (
              <div key={head}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.4)', marginBottom: 12, textTransform: 'uppercase' }}>{head}</div>
                {items.map(l => <div key={l} style={{ padding: '4px 0', color: 'rgba(255,255,255,.75)' }}>{l}</div>)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1240, margin: '48px auto 0', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)', fontFamily: mono, fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,.3)', textAlign: 'center', textTransform: 'uppercase' }}>
          &copy; {new Date().getFullYear()} St Lawrence CC — Play fair. Stay late.
        </div>
      </footer>
    </div>
  )
}
