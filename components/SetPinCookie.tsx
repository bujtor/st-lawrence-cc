'use client'

import { useEffect } from 'react'

export default function SetPinCookie({ pin }: { pin: string }) {
  useEffect(() => {
    // Set the cookie via the API so it persists
    fetch('/api/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
  }, [pin])

  return null
}
