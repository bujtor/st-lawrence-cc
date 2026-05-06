import type { Metadata } from 'next'
import CContactForm from '../_components/CContactForm'
import { CKicker, CContainer } from '../_components/primitives'
import { C_GREEN, C_RED, C_INK, display, mono, sansTight } from '../_theme/tokens'

export const metadata: Metadata = {
  title: 'Contact — St Lawrence CC',
  description: 'Get in touch with St Lawrence Cricket Club — new players, sponsors, fixtures.',
}

export default function CContactPage() {
  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      {/* Dark green editorial header band */}
      <div style={{ background: C_GREEN, color: '#fff' }}>
        <CContainer padding="56px 32px 64px">
          <CKicker color={C_RED}>Get in touch</CKicker>
          <h1
            style={{
              fontFamily: display,
              fontSize: 'clamp(48px, 9vw, 96px)',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: -3,
              margin: '14px 0 0',
              color: '#fff',
            }}
          >
            Drop us a line.
          </h1>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.5,
              color: 'rgba(255,255,255,.78)',
              maxWidth: 580,
              marginTop: 22,
              fontWeight: 300,
            }}
          >
            New players, sponsors, fixture queries, requests to host the parish dog show on the
            outfield — whatever it is, the captains and committee read every message.
          </p>
        </CContainer>
      </div>

      <CContainer padding="56px 32px 80px" maxWidth={780}>
        <CContactForm />

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: `1px dashed ${'#d6d0be'}`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
          }}
          className="contact-meta-grid"
        >
          <div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 2.5,
                color: '#999',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Captains
            </div>
            <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, marginTop: 6 }}>
              Gary Evans &amp; Paul Martin
            </div>
          </div>
          <div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 2.5,
                color: '#999',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Ground
            </div>
            <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, marginTop: 6, lineHeight: 1.2 }}>
              Bitchet Green
            </div>
            <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
              Sevenoaks, Kent · TN15 0NB
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 560px) {
            .contact-meta-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </CContainer>
    </div>
  )
}
