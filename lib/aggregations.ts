/**
 * Pure aggregation functions extracted from app/stats/page.tsx.
 * These are testable in isolation without any Supabase or Next.js dependencies.
 */

export type BatRow = {
  batsman_name: string | null
  batsman_id: number | null
  runs: number | null
  balls: number | null
  how_out: string | null
  match_id: number
}

export type BowlRow = {
  bowler_name: string | null
  bowler_id: number | null
  overs: number | null
  runs: number | null
  wickets: number | null
  maidens: number | null
  match_id: number
  innings_number: number
}

export type BatterAgg = {
  name: string
  id: number | null
  matches: Set<number>
  inns: number
  notOut: number
  runs: number
  hs: number
  fifties: number
  hundreds: number
  totalBalls: number
}

export type BowlerAgg = {
  name: string
  id: number | null
  matches: Set<number>
  overs: number
  runs: number
  wickets: number
  bestWkts: number
  bestRuns: number
  fiveWs: number
}

export function aggregateBatting(rows: BatRow[]): Map<string, BatterAgg> {
  const batterMap = new Map<string, BatterAgg>()

  for (const row of rows) {
    const ho = (row.how_out ?? '').toLowerCase()
    // "did not bat" rows shouldn't count as innings (or as not-outs).
    // Empty how_out is also a DNB indicator from Play-Cricket — skip both.
    const didNotBat = !ho || ho === 'did not bat'

    const key = String(row.batsman_id ?? row.batsman_name)
    if (!batterMap.has(key)) {
      batterMap.set(key, {
        name: row.batsman_name ?? '?',
        id: row.batsman_id ?? null,
        matches: new Set(),
        inns: 0,
        notOut: 0,
        runs: 0,
        hs: 0,
        fifties: 0,
        hundreds: 0,
        totalBalls: 0,
      })
    }
    const agg = batterMap.get(key)!
    agg.matches.add(row.match_id)
    if (didNotBat) continue

    agg.inns++
    const r = row.runs ?? 0
    agg.runs += r
    if (r > agg.hs) agg.hs = r
    if (r >= 100) agg.hundreds++
    else if (r >= 50) agg.fifties++
    agg.totalBalls += row.balls ?? 0
    if (ho === 'not out') agg.notOut++
  }

  return batterMap
}

export function aggregateBowling(rows: BowlRow[]): Map<string, BowlerAgg> {
  const bowlerMap = new Map<string, BowlerAgg>()

  for (const row of rows) {
    const key = String(row.bowler_id ?? row.bowler_name)
    if (!bowlerMap.has(key)) {
      bowlerMap.set(key, {
        name: row.bowler_name ?? '?',
        id: row.bowler_id ?? null,
        matches: new Set(),
        overs: 0,
        runs: 0,
        wickets: 0,
        bestWkts: 0,
        bestRuns: 999,
        fiveWs: 0,
      })
    }
    const agg = bowlerMap.get(key)!
    agg.matches.add(row.match_id)
    agg.overs += row.overs ?? 0
    agg.runs += row.runs ?? 0
    const w = row.wickets ?? 0
    agg.wickets += w
    if (w >= 5) agg.fiveWs++
    const r = row.runs ?? 0
    if (w > agg.bestWkts || (w === agg.bestWkts && r < agg.bestRuns)) {
      agg.bestWkts = w
      agg.bestRuns = r
    }
  }

  return bowlerMap
}
