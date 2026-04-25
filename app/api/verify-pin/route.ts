import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { captainCookieSetHeader } from '@/lib/captain-auth'

export async function POST(request: NextRequest) {
  const { pin } = await request.json()
  const correctPin = process.env.AVAILABILITY_PIN || '1234'

  // Constant-time PIN comparison
  const a = Buffer.from(correctPin)
  const b = Buffer.from(String(pin ?? ''))
  const valid = a.length === b.length && timingSafeEqual(a, b)

  if (valid) {
    const response = NextResponse.json({ ok: true })

    // Set signed captain-session cookie
    const cookieHeader = captainCookieSetHeader()
    if (cookieHeader) {
      const opts = cookieHeader.options as {
        httpOnly: boolean
        secure: boolean
        sameSite: 'lax'
        maxAge: number
        path: string
      }
      response.cookies.set(cookieHeader.name, cookieHeader.value, opts)
    }

    // Clear legacy cookie (in case someone has the old av_pin cookie)
    response.cookies.set('av_pin', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  }

  return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
}
