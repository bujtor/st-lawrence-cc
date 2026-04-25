import { cookies } from 'next/headers'
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'captain-session'
const PAYLOAD = 'captain'

export function expectedToken(): string | null {
  const secret = process.env.SESSION_SECRET
  if (!secret) return null
  return createHmac('sha256', secret).update(PAYLOAD).digest('hex')
}

export async function isCaptainAuthed(): Promise<boolean> {
  const expected = expectedToken()
  if (!expected) return false
  const c = (await cookies()).get(COOKIE_NAME)?.value
  if (!c) return false
  // Both must be valid hex strings of equal length
  let a: Buffer, b: Buffer
  try {
    a = Buffer.from(expected, 'hex')
    b = Buffer.from(c, 'hex')
  } catch {
    return false
  }
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export function captainCookieSetHeader(): { name: string; value: string; options: object } | null {
  const expected = expectedToken()
  if (!expected) return null
  return {
    name: COOKIE_NAME,
    value: expected,
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    },
  }
}
