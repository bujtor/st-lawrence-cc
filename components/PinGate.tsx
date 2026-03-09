'use client'

import { useState } from 'react'
import Image from 'next/image'

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
      // Reload the page — the cookie is now set server-side
      window.location.reload()
    } else {
      setError(true)
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-xs w-full text-center">
        <Image src="/images/badge.png" alt="St Lawrence CC" width={160} height={56} className="mx-auto mb-6 h-12 w-auto" />
        <h1 className="text-lg font-bold text-gray-900 mb-1">Squad Availability</h1>
        <p className="text-sm text-gray-400 mb-6">Enter the access code to continue</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Access code"
          className={`w-full text-center text-2xl tracking-[0.3em] font-mono py-3 px-4 rounded-xl border-2 ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          } focus:outline-none focus:border-emerald-400 transition-colors`}
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-500 mt-2 font-medium">Wrong code — try again</p>
        )}
        <button
          onClick={submit}
          disabled={!pin || checking}
          className="w-full mt-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Enter'}
        </button>
        <p className="text-[11px] text-gray-300 mt-6">Code shared in the WhatsApp group</p>
      </div>
    </div>
  )
}
