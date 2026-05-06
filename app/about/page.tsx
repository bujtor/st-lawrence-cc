import Image from 'next/image'
import Link from 'next/link'
import {
  CKicker,
  CCard,
  CMonoLabel,
  CContainer,
  C_GREEN,
  C_RED,
  C_INK,
  C_RULE,
  C_CREAM,
  display,
  mono,
  sansTight,
} from '@/components/c/primitives'

export default function AboutPage() {
  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <Image
          src="/images/gallery/hero-batting-cottage.jpg"
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover object-top"
          priority
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(160deg, rgba(13,59,39,.75) 0%, rgba(13,59,39,.25) 55%, rgba(13,59,39,.7) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            maxWidth: 1240,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingBottom: 48,
          }}
        >
          {/* Badge */}
          <div style={{ marginBottom: 20 }}>
            <Image
              src="/images/badge.png"
              alt="St Lawrence Cricket Club"
              width={120}
              height={83}
              style={{ filter: 'brightness(0) invert(1)', opacity: 0.9 }}
            />
          </div>

          <CKicker color={C_RED}>About the Club</CKicker>
          <h1
            style={{
              fontFamily: display,
              fontSize: 'clamp(52px, 9vw, 112px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.88,
              letterSpacing: -4,
              color: '#fff',
              margin: '14px 0 0',
            }}
          >
            St Lawrence<br />
            <span style={{ fontWeight: 600, fontStyle: 'normal' }}>Cricket Club.</span>
          </h1>

          {/* Hero stats bar */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              gap: 40,
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,.2)',
              paddingTop: 22,
            }}
          >
            {[
              { label: 'Founded', value: '1877' },
              { label: 'Home Ground', value: 'Bitchet Green' },
              { label: 'League', value: 'KCVL' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: 2.5,
                    color: 'rgba(255,255,255,.55)',
                    textTransform: 'uppercase',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 26,
                    fontWeight: 500,
                    color: '#fff',
                    lineHeight: 1,
                    marginTop: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main content ──────────────────────────────────────── */}
      <CContainer padding="64px 32px 80px">
        <div
          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}
          className="about-grid"
        >

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Our Ground */}
            <CCard padding="32px 36px">
              <div style={{ borderBottom: `2px solid ${C_GREEN}`, paddingBottom: 14, marginBottom: 22 }}>
                <CKicker color="#888">Our Ground</CKicker>
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 36,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginTop: 8,
                  }}
                >
                  Bitchet Green.
                </div>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', margin: 0 }}>
                St Lawrence Cricket Club plays at Bitchet Green, a picturesque ground near Sevenoaks
                in Kent. Surrounded by ancient woodland and orchards, it remains one of the most
                beautiful settings for Saturday afternoon village cricket in the county.
              </p>

              {/* Ground photos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image
                    src="/images/gallery/roller.jpg"
                    alt="Rolling the wicket"
                    fill
                    className="object-cover"
                  />
                </div>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image
                    src="/images/gallery/outfield-stripes.jpg"
                    alt="Freshly cut outfield"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Address block */}
              <div
                style={{
                  marginTop: 24,
                  padding: '16px 20px',
                  background: C_CREAM,
                  border: `1px solid ${C_RULE}`,
                }}
              >
                <CMonoLabel color="#999">Address</CMonoLabel>
                <p
                  style={{
                    fontFamily: display,
                    fontSize: 18,
                    fontWeight: 500,
                    color: C_INK,
                    margin: '8px 0 0',
                    letterSpacing: -0.3,
                  }}
                >
                  Bitchet Green, Sevenoaks,<br />
                  Kent, TN15 0NB
                </p>
                <a
                  href="https://www.google.com/maps?q=51.2748,0.2305"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 10,
                    fontFamily: mono,
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: C_RED,
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  View on Google Maps →
                </a>
              </div>
            </CCard>

            {/* Club History */}
            <CCard padding="32px 36px">
              <div style={{ borderBottom: `2px solid ${C_GREEN}`, paddingBottom: 14, marginBottom: 22 }}>
                <CKicker color="#888">History</CKicker>
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 36,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginTop: 8,
                  }}
                >
                  Since 1877.
                </div>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', margin: '0 0 16px' }}>
                St Lawrence Cricket Club was founded in 1877, making us one of Kent&rsquo;s longest-standing
                village clubs. For nearly 150 years we&rsquo;ve played our cricket on the same patch of ground
                at Bitchet Green &mdash; through two world wars, a pandemic, and one particularly wet summer
                in 2012.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', margin: 0 }}>
                We compete in the <strong>Kent County Village League (KCVL)</strong>, playing Saturday
                afternoon cricket from May to September each year. The Saints have always been a
                community club first &mdash; competitive on the field, welcoming off it.
              </p>
            </CCard>

            {/* Club Life */}
            <CCard padding="32px 36px">
              <div style={{ borderBottom: `2px solid ${C_GREEN}`, paddingBottom: 14, marginBottom: 22 }}>
                <CKicker color="#888">The Club</CKicker>
                <div
                  style={{
                    fontFamily: display,
                    fontSize: 36,
                    fontWeight: 500,
                    fontStyle: 'italic',
                    letterSpacing: -1,
                    lineHeight: 1,
                    marginTop: 8,
                  }}
                >
                  More than cricket.
                </div>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: '#444', margin: 0 }}>
                St Lawrence is about the friendships, the teas, and the post-match conversations that make
                village cricket special. A game that lasts six hours. A ground where the boundary sometimes
                involves negotiating with a labrador. Cricket played as it was meant to be.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image
                    src="/images/gallery/pavilion-social.jpg"
                    alt="Players enjoying tea"
                    fill
                    className="object-cover"
                  />
                </div>
                <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                  <Image
                    src="/images/gallery/team-pavilion.jpg"
                    alt="Team at the pavilion"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </CCard>

          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Badge */}
            <CCard padding="28px 24px" style={{ textAlign: 'center' }}>
              <Image
                src="/images/badge.png"
                alt="St Lawrence Cricket Club badge"
                width={200}
                height={138}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </CCard>

            {/* Contact */}
            <div style={{ background: C_GREEN, padding: '28px 24px' }}>
              <CKicker color={C_RED}>Contact</CKicker>
              <div
                style={{
                  fontFamily: display,
                  fontSize: 28,
                  fontWeight: 500,
                  fontStyle: 'italic',
                  letterSpacing: -0.5,
                  color: '#fff',
                  marginTop: 10,
                  lineHeight: 1.1,
                }}
              >
                Gary Evans &amp; Paul Martin<br />
                <span style={{ fontStyle: 'normal', fontWeight: 400, fontSize: 18, opacity: 0.7 }}>
                  Captains
                </span>
              </div>
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link
                  href="/contact"
                  style={{
                    display: 'block',
                    padding: '12px 18px',
                    background: C_RED,
                    color: '#fff',
                    textDecoration: 'none',
                    fontFamily: mono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                  }}
                >
                  Send a message
                </Link>
              </div>
            </div>

            {/* Quick facts */}
            <CCard padding="24px">
              <CMonoLabel color="#999">Quick Facts</CMonoLabel>
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Founded', value: '1877' },
                  { label: 'Ground', value: 'Bitchet Green' },
                  { label: 'League', value: 'Kent County Village League' },
                  { label: 'Season', value: 'May – September' },
                  { label: 'Matches per season', value: '18 fixtures' },
                  { label: 'County', value: 'Kent' },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      padding: '10px 0',
                      borderBottom: i < 5 ? `1px dashed ${C_RULE}` : 'none',
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        letterSpacing: 1.5,
                        color: '#999',
                        textTransform: 'uppercase',
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontFamily: display,
                        fontSize: 15,
                        fontWeight: 500,
                        color: C_INK,
                        textAlign: 'right',
                      }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </CCard>

            {/* Club shop link */}
            <CCard padding="20px 24px">
              <CMonoLabel color="#999">Club Shop</CMonoLabel>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: '10px 0 14px' }}>
                Whites, caps, and club kit. Official SLCC merchandise via Serious Sport.
              </p>
              <a
                href="https://www.serioussport.co.uk/teamstores/st-lawrence-cc"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: C_RED,
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
              >
                Visit Shop →
              </a>
            </CCard>

          </div>
        </div>

        {/* ─── Action photo strip ─── */}
        <div style={{ marginTop: 48 }}>
          <div style={{ borderTop: `2px solid ${C_INK}`, paddingTop: 20, marginBottom: 16 }}>
            <CKicker color="#888">Gallery · From the Boundary</CKicker>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
            }}
            className="gallery-grid"
          >
            {[
              { src: '/images/gallery/batting-trees.jpg', alt: 'Batting at Bitchet Green' },
              { src: '/images/gallery/bowling-action.jpg', alt: 'Bowling action' },
              { src: '/images/gallery/batting-shot.jpg', alt: 'Cover drive' },
            ].map(({ src, alt }) => (
              <div key={src} style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                <Image src={src} alt={alt} fill className="object-cover" style={{ filter: 'saturate(1.05)' }} />
              </div>
            ))}
          </div>
        </div>

      </CContainer>

      {/* ─── Saints Want You banner ─── */}
      <div style={{ background: C_INK, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'relative',
            maxWidth: 1240,
            margin: '0 auto',
            padding: '80px 32px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 4,
              color: C_RED,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            ★ Recruiting ★
          </div>
          <h2
            style={{
              fontFamily: display,
              fontSize: 'clamp(56px, 10vw, 120px)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 0.9,
              letterSpacing: -4,
              color: '#fff',
              margin: '18px 0 0',
            }}
          >
            The Saints<br />
            <span style={{ fontStyle: 'normal', fontWeight: 600, color: C_RED }}>want you.</span>
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              maxWidth: 560,
              margin: '28px auto 0',
              color: 'rgba(255,255,255,.7)',
            }}
          >
            Experienced cricketer, rusty club player, or someone whose last innings was Under-13s Colts
            &mdash; you are welcome here. Drop the captains a line.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 14,
              marginTop: 32,
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/contact"
              style={{
                padding: '15px 28px',
                background: C_RED,
                color: '#fff',
                textDecoration: 'none',
                fontFamily: mono,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 840px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .gallery-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
