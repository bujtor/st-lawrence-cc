'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  C_GREEN,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  display,
  sansTight,
  mono,
} from '@/lib/c-theme/tokens'

export default function PinGate() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  const submit = async () => {
    setChecking(true)
    setError(false)
    const res = await fetch(`/api/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) {
      window.location.reload()
    } else {
      setError(true)
      setChecking(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C_CREAM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: sansTight,
      }}
    >
      <div style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
        {/* Badge */}
        <div style={{ marginBottom: 32 }}>
          <Image
            src="/images/badge.png"
            alt="St Lawrence CC"
            width={160}
            height={56}
            style={{ height: 44, width: 'auto', margin: '0 auto' }}
          />
        </div>

        {/* Header band */}
        <div
          style={{
            background: C_GREEN,
            padding: '20px 28px',
            marginBottom: 0,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 3,
              color: C_RED,
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            — Availability
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 30,
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            Squad Portal
          </div>
          <div
            style={{
              fontFamily: sansTight,
              fontSize: 13,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 6,
            }}
          >
            Enter the access code to continue
          </div>
        </div>

        {/* Card body */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C_RULE}`,
            borderTop: 'none',
            padding: '28px 28px 24px',
          }}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Access code"
            autoFocus
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: 26,
              letterSpacing: '0.3em',
              fontFamily: mono,
              padding: '12px 16px',
              border: `1.5px solid ${error ? C_RED : C_RULE}`,
              background: error ? '#fff5f5' : C_CREAM,
              color: C_INK,
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          {error && (
            <p
              style={{
                fontFamily: mono,
                fontSize: 11,
                letterSpacing: 1.5,
                color: C_RED,
                textTransform: 'uppercase',
                marginTop: 8,
                fontWeight: 700,
              }}
            >
              Wrong code — try again
            </p>
          )}
          <button
            onClick={submit}
            disabled={!pin || checking}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 22px',
              background: !pin || checking ? '#ccc' : C_GREEN,
              color: '#fff',
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              border: 'none',
              cursor: !pin || checking ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {checking ? 'Checking...' : 'Enter'}
          </button>
          <p
            style={{
              fontFamily: sansTight,
              fontSize: 11,
              color: '#bbb',
              marginTop: 20,
            }}
          >
            Code shared in the WhatsApp group
          </p>
        </div>
      </div>
    </div>
  )
}
