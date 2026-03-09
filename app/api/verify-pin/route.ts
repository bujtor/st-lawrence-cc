import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { pin } = await request.json()
  const correctPin = process.env.AVAILABILITY_PIN || '1234'

  if (pin === correctPin) {
    const response = NextResponse.json({ ok: true })
    response.cookies.set('av_pin', pin, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    })
    return response
  }

  return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
}
