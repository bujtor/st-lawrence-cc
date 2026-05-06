'use client'

import { useState } from 'react'
import { C_GREEN, C_GREEN_LT, C_RED, C_INK, C_RULE, display, mono, sansTight } from '../_theme/tokens'

type State = 'idle' | 'sending' | 'sent' | 'error'

const labelStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: 2,
  textTransform: 'uppercase',
  color: '#888',
  fontWeight: 700,
  display: 'block',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  fontFamily: sansTight,
  fontSize: 15,
  width: '100%',
  border: `1px solid ${C_RULE}`,
  background: '#fff',
  padding: '10px 14px',
  outline: 'none',
  color: C_INK,
  borderRadius: 0,
}

export default function CContactForm() {
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (state === 'sending') return

    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      phone: String(fd.get('phone') ?? ''),
      message: String(fd.get('message') ?? ''),
      website: String(fd.get('website') ?? ''),
    }

    setState('sending')
    setErrorMsg('')
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = (await r.json().catch(() => ({}))) as { error?: string }
      if (!r.ok) {
        const msg =
          j.error === 'rate_limited'
            ? 'Too many messages from this connection — please try again in a few minutes.'
            : j.error === 'invalid_email'
              ? 'That email address looks off — could you double-check?'
              : j.error === 'invalid_name' || j.error === 'invalid_message'
                ? 'Please fill in all the required fields.'
                : 'Sorry, something went wrong sending that. Please try again.'
        setErrorMsg(msg)
        setState('error')
        return
      }
      setState('sent')
      e.currentTarget.reset()
    } catch {
      setErrorMsg('Could not reach the server. Please try again in a moment.')
      setState('error')
    }
  }

  if (state === 'sent') {
    return (
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C_RULE}`,
          borderTop: `3px solid ${C_GREEN}`,
          padding: '40px 36px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 3, color: C_GREEN_LT, fontWeight: 700, textTransform: 'uppercase' }}>
          — Message sent
        </div>
        <div
          style={{
            fontFamily: display,
            fontSize: 36,
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: -1,
            margin: '14px 0 12px',
            color: C_INK,
          }}
        >
          Thank you.
        </div>
        <p style={{ fontSize: 14, color: '#555', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
          We&rsquo;ll be in touch within a couple of days.
        </p>
        <button
          type="button"
          onClick={() => setState('idle')}
          style={{
            marginTop: 22,
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C_RED,
            fontWeight: 700,
          }}
        >
          Send another →
        </button>
      </div>
    )
  }

  const sending = state === 'sending'

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: '#fff',
        border: `1px solid ${C_RULE}`,
        padding: '32px 32px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {/* Honeypot */}
      <div style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
        <label>
          Website (do not fill in)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <label style={labelStyle} htmlFor="c-name">Name</label>
          <input id="c-name" name="name" type="text" required minLength={2} maxLength={200} disabled={sending} autoComplete="name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="c-email">Email</label>
          <input id="c-email" name="email" type="email" required maxLength={320} disabled={sending} autoComplete="email" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="c-phone">
          Phone <span style={{ color: '#bbb', fontWeight: 400, letterSpacing: 1 }}>(optional)</span>
        </label>
        <input id="c-phone" name="phone" type="tel" maxLength={40} disabled={sending} autoComplete="tel" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="c-message">Message</label>
        <textarea
          id="c-message"
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          disabled={sending}
          style={{ ...inputStyle, fontFamily: sansTight, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {state === 'error' && (
        <div
          style={{
            background: 'rgba(193,32,39,.08)',
            border: `1px solid rgba(193,32,39,.3)`,
            color: C_RED,
            fontSize: 13,
            padding: '10px 14px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          marginTop: 4,
          flexWrap: 'wrap',
        }}
      >
        <p style={{ fontSize: 12, color: '#888', margin: 0, maxWidth: 360 }}>
          We&rsquo;ll only use your details to reply to your message.
        </p>
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: '14px 26px',
            background: sending ? '#888' : C_GREEN,
            color: '#fff',
            border: 0,
            cursor: sending ? 'default' : 'pointer',
            fontFamily: mono,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .contact-grid { grid-template-columns: 1fr !important; }
        }
        input:focus, textarea:focus { border-color: ${C_GREEN} !important; box-shadow: 0 0 0 1px ${C_GREEN}; }
      `}</style>
    </form>
  )
}
