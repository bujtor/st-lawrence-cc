'use client'

import { useState, useRef, useEffect } from 'react'
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

const ROLES = ['BAT', 'BOWL', 'AR', 'WK']

export default function AddRinginModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, role: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('BAT')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    if (name.trim()) {
      onAdd(name.trim(), role)
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: `1px solid ${C_RULE}`,
          maxWidth: 380,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header band */}
        <div style={{ background: C_GREEN, padding: '16px 24px' }}>
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 3,
              color: C_RED,
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            — Captain
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 22,
              fontStyle: 'italic',
              fontWeight: 400,
              color: '#fff',
              lineHeight: 1.1,
            }}
          >
            Add Ring-In
          </div>
          <div style={{ fontFamily: sansTight, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            They can set availability across the season. Promote to full member any time.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', background: C_CREAM }}>
          <label
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2,
              color: '#888',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            placeholder="e.g. Pete from Otford"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#fff',
              border: `1px solid ${C_RULE}`,
              color: C_INK,
              fontFamily: sansTight,
              fontSize: 14,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 16,
            }}
          />

          <label
            style={{
              fontFamily: mono,
              fontSize: 10,
              letterSpacing: 2,
              color: '#888',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Role
          </label>
          <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  border: `1.5px solid ${role === r ? C_GREEN : C_RULE}`,
                  background: role === r ? C_GREEN : '#fff',
                  color: role === r ? '#fff' : '#888',
                  fontFamily: mono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 0',
                background: '#fff',
                border: `1px solid ${C_RULE}`,
                color: '#888',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: '12px 0',
                background: name.trim() ? C_GREEN : '#ddd',
                border: 'none',
                color: '#fff',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
            >
              Add Ring-In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
