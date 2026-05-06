'use client'

import { useState } from 'react'

type State = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactForm() {
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
      website: String(fd.get('website') ?? ''), // honeypot
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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <h3 className="text-lg font-bold text-emerald-800">Thanks — message sent.</h3>
        <p className="text-sm text-emerald-700 mt-2">
          We&rsquo;ll be in touch within a couple of days. If it&rsquo;s urgent, give Paul a ring on 07783 596 582.
        </p>
        <button
          type="button"
          onClick={() => setState('idle')}
          className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
        >
          Send another
        </button>
      </div>
    )
  }

  const sending = state === 'sending'

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot — hidden from real users */}
      <div style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, overflow: 'hidden' }} aria-hidden="true">
        <label>
          Website (do not fill in)
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={200}
            disabled={sending}
            autoComplete="name"
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            disabled={sending}
            autoComplete="email"
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          Phone <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
        </span>
        <input
          name="phone"
          type="tel"
          maxLength={40}
          disabled={sending}
          autoComplete="tel"
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
        />
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Message</span>
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={5000}
          rows={6}
          disabled={sending}
          className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-50"
        />
      </label>

      {state === 'error' && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 pt-2">
        <p className="text-xs text-gray-500">
          We&rsquo;ll only use your details to reply to your message.
        </p>
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm transition-colors"
        >
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
