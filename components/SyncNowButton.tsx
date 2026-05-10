'use client'

import { useState } from 'react'
import { C_GREEN, C_RED, C_RULE, mono } from '@/lib/c-theme/tokens'

type State = 'idle' | 'syncing' | 'done' | 'error'

export default function SyncNowButton() {
  const [state, setState] = useState<State>('idle')
  const [summary, setSummary] = useState<string>('')

  async function onClick() {
    if (state === 'syncing') return
    setState('syncing')
    setSummary('')
    try {
      const r = await fetch('/api/sync-now', { method: 'POST' })
      const j = (await r.json().catch(() => ({}))) as {
        status?: string
        fixtures?: { results_merged?: number; updated?: number }
        scorecards?: { fetched?: number }
        standings?: { teams?: number }
        message?: string
      }
      if (!r.ok || j.status !== 'ok') {
        setState('error')
        setSummary(j.message ?? `HTTP ${r.status}`)
        return
      }
      const merged = j.fixtures?.results_merged ?? 0
      const fetched = j.scorecards?.fetched ?? 0
      const teams = j.standings?.teams ?? 0
      setState('done')
      setSummary(
        merged + fetched > 0
          ? `Updated · ${merged} result${merged === 1 ? '' : 's'} merged · ${fetched} scorecard${fetched === 1 ? '' : 's'} fetched · standings: ${teams} teams`
          : `Already up to date · standings: ${teams} teams`,
      )
    } catch (e) {
      setState('error')
      setSummary(e instanceof Error ? e.message : 'request failed')
    }
  }

  const labelByState: Record<State, string> = {
    idle: 'Sync now',
    syncing: 'Syncing…',
    done: 'Synced ✓',
    error: 'Failed — try again',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={state === 'syncing'}
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 2,
          fontWeight: 700,
          textTransform: 'uppercase',
          padding: '10px 18px',
          background: state === 'error' ? C_RED : C_GREEN,
          color: '#fff',
          border: 0,
          cursor: state === 'syncing' ? 'default' : 'pointer',
          opacity: state === 'syncing' ? 0.7 : 1,
        }}
      >
        {labelByState[state]}
      </button>
      <span
        style={{
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 1.5,
          color: state === 'error' ? C_RED : '#666',
          textTransform: state === 'idle' ? 'uppercase' : 'none',
        }}
      >
        {state === 'idle'
          ? '— pulls fresh fixtures, results, scorecards & standings from Play-Cricket'
          : summary}
      </span>
    </div>
  )
}

// Re-export the rule colour so the page can match the divider style if it wants.
export { C_RULE }
