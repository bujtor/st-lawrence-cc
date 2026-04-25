/**
 * London timezone helpers.
 * Extracted from app/api/fixture-stats/route.ts for DRY reuse.
 */

const londonFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' })

/** Returns today's date in London timezone as YYYY-MM-DD */
export function todayLondon(): string {
  return londonFmt.format(new Date())
}

/** Returns the current London date and time */
export function nowLondon(): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const parts = dtf.formatToParts(new Date())
  const get = (k: string) => parts.find(p => p.type === k)?.value ?? '00'
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour')}:${get('minute')}:${get('second')}`
  return { date, time }
}

/**
 * Convert a London wall-clock date+time to UTC milliseconds.
 * Handles BST/GMT automatically by using the UK locale offset for that date.
 */
export function londonWallTimeToUtc(date: string, time: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time)
  if (!m || !t) return null
  const [, y, mo, d] = m
  const [, hh, mm, ss] = t

  // Construct UTC date as if the wall-time were UTC, then shift by offset.
  const naiveUtc = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +(ss ?? '0'))
  // Compute the offset (in minutes) between London and UTC at that instant.
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const parts = dtf.formatToParts(new Date(naiveUtc))
  const get = (k: string) => parts.find(p => p.type === k)?.value ?? '0'
  const londonReprAsUtc = Date.UTC(+get('year'), +get('month') - 1, +get('day'), +get('hour'), +get('minute'), +get('second'))
  const offsetMs = londonReprAsUtc - naiveUtc
  return naiveUtc - offsetMs
}
