import Link from 'next/link'

const candidates = [
  {
    key: 'a',
    name: 'A · Saints',
    tagline: 'Closest to current site',
    description:
      'Keeps the emerald green, adds a maroon sash red lifted from the shirt trim, and tightens type with Libre Caslon Text for headlines. Safest pick; lowest migration cost.',
    palette: [
      { name: 'Green',  hex: '#1f5a3f' },
      { name: 'Dark',   hex: '#123a28' },
      { name: 'Maroon', hex: '#8e1d2c' },
      { name: 'Cream',  hex: '#faf7f1' },
      { name: 'Ink',    hex: '#1a1a1a' },
    ],
  },
  {
    key: 'b',
    name: 'B · Scorebook',
    tagline: 'Most characterful',
    description:
      'Treats the site like a broadsheet — cream paper, blackletter masthead (UnifrakturCook), ruled scorebook tables, typewriter captions, dry cricket-correspondent prose. Leans hard into 1877 heritage.',
    palette: [
      { name: 'Paper',    hex: '#f5eedb' },
      { name: 'Paper Dk', hex: '#ebe2ca' },
      { name: 'Ink',      hex: '#1c1a14' },
      { name: 'Red',      hex: '#a6192e' },
      { name: 'Green',    hex: '#2d5a3f' },
      { name: 'Rule',     hex: '#c8bd9a' },
    ],
  },
  {
    key: 'c',
    name: 'C · Bitchet Green',
    tagline: 'Biggest swing',
    description:
      'Magazine-scale display serif (Fraunces at 180px+), full-bleed photography, scoreboard-style numerics, heavy pull quotes. Needs the photography to land — fortunately it is good.',
    palette: [
      { name: 'Green',    hex: '#0d3b27' },
      { name: 'Green Lt', hex: '#1a5a3c' },
      { name: 'Red',      hex: '#c12027' },
      { name: 'Cream',    hex: '#f3efe6' },
      { name: 'Ink',      hex: '#111111' },
    ],
  },
]

export default function CandidatesIndex() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif', color: '#1a1a1a' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e5e5', padding: '32px 40px 28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: 10 }}>
            St Lawrence CC — Internal Design Review
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5, margin: 0 }}>
            Design Candidates — Pick one to preview
          </h1>
          <p style={{ color: '#666', marginTop: 8, fontSize: 15, lineHeight: 1.5 }}>
            Only the home page is fully designed in each direction. Team review only.
            Desktop layouts — mobile breakpoints not yet designed.
          </p>
          <div style={{ marginTop: 14 }}>
            <Link href="/" style={{ fontSize: 13, color: '#1f5a3f', fontWeight: 600, textDecoration: 'none', letterSpacing: 0.2 }}>
              ← Return to live site
            </Link>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 40px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {candidates.map((c) => (
            <div key={c.key} style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Palette swatches */}
              <div style={{ display: 'flex', height: 10 }}>
                {c.palette.map((p) => (
                  <div key={p.name} title={`${p.name}: ${p.hex}`} style={{ flex: 1, background: p.hex }} />
                ))}
              </div>

              <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>
                  {c.tagline}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 10px', letterSpacing: -0.3 }}>{c.name}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: '#555', margin: '0 0 20px', flex: 1 }}>
                  {c.description}
                </p>

                {/* Palette detail */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {c.palette.map((p) => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#777' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 2, background: p.hex, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                      <span>{p.hex}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/candidates/${c.key}`}
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '10px 16px',
                    background: '#1f5a3f',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 4,
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: 0.3,
                  }}
                >
                  View candidate →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
