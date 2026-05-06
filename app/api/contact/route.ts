import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Crude per-IP rate limit: in-memory, resets on cold start, fine for the
// volume a village cricket club gets. Keeps obvious spam loops at bay
// without standing up Upstash or similar.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 min
const RATE_LIMIT_MAX = 5 // 5 messages per IP per window
const recentByIp = new Map<string, number[]>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  const hits = (recentByIp.get(ip) ?? []).filter((t) => t > cutoff)
  if (hits.length >= RATE_LIMIT_MAX) return false
  hits.push(now)
  recentByIp.set(ip, hits)
  return true
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  // Honeypot — bots fill in fields humans never see.
  if (typeof body.website === 'string' && body.website.length > 0) {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim() || null
  const message = String(body.message ?? '').trim()

  if (!name || name.length < 2 || name.length > 200) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 })
  }
  if (!validEmail(email) || email.length > 320) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }
  if (!message || message.length < 5 || message.length > 5000) {
    return NextResponse.json({ error: 'invalid_message' }, { status: 400 })
  }

  const ip = clientIp(req)
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const userAgent = req.headers.get('user-agent') ?? null

  // Persist first so we never lose a message even if Resend rejects.
  const sb = supabaseAdmin()
  const { data: inserted, error: insertErr } = await sb
    .from('contact_messages')
    .insert({
      name,
      email,
      phone,
      message,
      user_agent: userAgent,
      source_ip: ip,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    console.error('contact_messages insert failed', insertErr)
    return NextResponse.json({ error: 'storage_failed' }, { status: 500 })
  }

  // Send email via Resend (best-effort — Supabase row already saved).
  const apiKey = process.env.RESEND_API_KEY
  const fromAddr = process.env.CONTACT_FROM_EMAIL || 'noreply@stlawrencecc.co.uk'
  // Recipients: comma-separated list in CONTACT_RECIPIENT_EMAIL (handles multi-captain etc).
  const toAddrs = (process.env.CONTACT_RECIPIENT_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (!apiKey || toAddrs.length === 0) {
    await sb
      .from('contact_messages')
      .update({ email_error: 'missing_resend_config' })
      .eq('id', inserted.id)
    // Don't expose env state to caller — pretend it sent. Admin can read DB.
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  try {
    const resend = new Resend(apiKey)
    const subject = `[stlawrencecc.co.uk] ${name} via the contact form`
    const text = [
      `Name:    ${name}`,
      `Email:   ${email}`,
      phone ? `Phone:   ${phone}` : null,
      '',
      message,
      '',
      '— sent from the stlawrencecc.co.uk contact form',
    ]
      .filter((x) => x !== null)
      .join('\n')

    const { data, error } = await resend.emails.send({
      from: `St Lawrence CC <${fromAddr}>`,
      to: toAddrs,
      replyTo: email,
      subject,
      text,
    })

    if (error) {
      await sb
        .from('contact_messages')
        .update({ email_error: error.message ?? 'resend_error' })
        .eq('id', inserted.id)
    } else if (data?.id) {
      await sb
        .from('contact_messages')
        .update({ resend_id: data.id, email_sent_at: new Date().toISOString() })
        .eq('id', inserted.id)
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await sb.from('contact_messages').update({ email_error: msg }).eq('id', inserted.id)
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}
