import { describe, it, expect } from 'vitest'
import { aggregateBatting, aggregateBowling, type BatRow, type BowlRow } from '../lib/aggregations'

// ---- Batting tests ----

describe('aggregateBatting', () => {
  const mkBat = (overrides: Partial<BatRow> & { match_id?: number }): BatRow => ({
    batsman_name: 'Batter',
    batsman_id: 1,
    runs: 30,
    balls: 40,
    how_out: 'bowled',
    match_id: 1,
    ...overrides,
  })

  it('excludes DNB rows from innings count (how_out = "did not bat")', () => {
    const rows: BatRow[] = [
      mkBat({ how_out: 'did not bat', runs: 0 }),
      mkBat({ how_out: 'bowled', runs: 20, match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.inns).toBe(1) // DNB not counted
    expect(agg.runs).toBe(20)
  })

  it('excludes DNB rows with empty how_out from innings count', () => {
    const rows: BatRow[] = [
      mkBat({ how_out: '', runs: 0 }),
      mkBat({ how_out: 'lbw', runs: 15, match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.inns).toBe(1)
  })

  it('counts not out only for how_out === "not out" (not for empty/DNB)', () => {
    const rows: BatRow[] = [
      mkBat({ how_out: 'not out', runs: 42 }),
      mkBat({ how_out: '', runs: 0, match_id: 2 }),           // DNB — not a not-out
      mkBat({ how_out: 'did not bat', runs: 0, match_id: 3 }), // DNB — not a not-out
      mkBat({ how_out: 'bowled', runs: 10, match_id: 4 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.notOut).toBe(1)
    expect(agg.inns).toBe(2) // only "not out" and "bowled" count as innings
  })

  it('computes highest score correctly', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 45, match_id: 1 }),
      mkBat({ runs: 72, match_id: 2 }),
      mkBat({ runs: 10, match_id: 3 }),
    ]
    const map = aggregateBatting(rows)
    expect(map.get('1')!.hs).toBe(72)
  })

  it('computes average as runs / (inns - notOut)', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 60, how_out: 'not out', match_id: 1 }),
      mkBat({ runs: 40, how_out: 'bowled', match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    // avg = 100 / (2 - 1) = 100
    const denom = agg.inns - agg.notOut
    expect(denom).toBe(1)
    expect(agg.runs / denom).toBe(100)
  })

  it('average denom is 0 when all innings are not out', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 30, how_out: 'not out', match_id: 1 }),
      mkBat({ runs: 20, how_out: 'not out', match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.inns - agg.notOut).toBe(0) // no valid avg
  })

  it('counts 50s correctly (>= 50 but < 100)', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 55, match_id: 1 }),
      mkBat({ runs: 50, match_id: 2 }), // inclusive
      mkBat({ runs: 49, match_id: 3 }),
    ]
    const map = aggregateBatting(rows)
    expect(map.get('1')!.fifties).toBe(2)
  })

  it('counts 100s correctly and does NOT also count as a 50', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 100, match_id: 1 }),
      mkBat({ runs: 123, match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.hundreds).toBe(2)
    expect(agg.fifties).toBe(0) // 100+ should NOT also count as a 50
  })

  it('computes strike rate (runs/balls * 100)', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 50, balls: 40, match_id: 1 }),
      mkBat({ runs: 30, balls: 20, match_id: 2 }),
    ]
    const map = aggregateBatting(rows)
    const agg = map.get('1')!
    expect(agg.totalBalls).toBe(60)
    expect((agg.runs / agg.totalBalls) * 100).toBeCloseTo(133.33, 1)
  })

  it('totalBalls is 0 when balls field is null/missing', () => {
    const rows: BatRow[] = [
      mkBat({ runs: 20, balls: null, match_id: 1 }),
    ]
    const map = aggregateBatting(rows)
    expect(map.get('1')!.totalBalls).toBe(0)
  })
})

// ---- Bowling tests ----

describe('aggregateBowling', () => {
  const mkBowl = (overrides: Partial<BowlRow> & { match_id?: number }): BowlRow => ({
    bowler_name: 'Bowler',
    bowler_id: 10,
    overs: 8,
    runs: 24,
    wickets: 2,
    maidens: 1,
    match_id: 1,
    innings_number: 1,
    ...overrides,
  })

  it('computes best figures: max wickets, tiebreak min runs', () => {
    const rows: BowlRow[] = [
      mkBowl({ wickets: 3, runs: 30, match_id: 1 }),
      mkBowl({ wickets: 3, runs: 20, match_id: 2 }), // same wkts, fewer runs
      mkBowl({ wickets: 2, runs: 10, match_id: 3 }),
    ]
    const map = aggregateBowling(rows)
    const agg = map.get('10')!
    expect(agg.bestWkts).toBe(3)
    expect(agg.bestRuns).toBe(20)
  })

  it('counts 5W for any single innings with 5 or more wickets', () => {
    const rows: BowlRow[] = [
      mkBowl({ wickets: 5, match_id: 1 }),
      mkBowl({ wickets: 6, match_id: 2 }),
      mkBowl({ wickets: 4, match_id: 3 }),
    ]
    const map = aggregateBowling(rows)
    expect(map.get('10')!.fiveWs).toBe(2)
  })

  it('sums overs directly as decimal numbers', () => {
    // 4.5 decimal overs = 4 overs + 3 balls in cricket notation
    const rows: BowlRow[] = [
      mkBowl({ overs: 4.5, match_id: 1 }),
      mkBowl({ overs: 4.5, match_id: 2 }),
    ]
    const map = aggregateBowling(rows)
    expect(map.get('10')!.overs).toBeCloseTo(9.0)
  })

  it('returns null-equivalent avg when wickets == 0', () => {
    const rows: BowlRow[] = [
      mkBowl({ wickets: 0, runs: 30, match_id: 1 }),
    ]
    const map = aggregateBowling(rows)
    const agg = map.get('10')!
    expect(agg.wickets).toBe(0)
    // avg = runs/wickets — caller must check wickets > 0
  })

  it('returns null-equivalent econ when overs == 0', () => {
    const rows: BowlRow[] = [
      mkBowl({ overs: 0, runs: 0, match_id: 1 }),
    ]
    const map = aggregateBowling(rows)
    const agg = map.get('10')!
    expect(agg.overs).toBe(0)
    // econ = runs/overs — caller must check overs > 0
  })

  it('sums wickets and runs across multiple innings', () => {
    const rows: BowlRow[] = [
      mkBowl({ wickets: 3, runs: 25, overs: 6, match_id: 1 }),
      mkBowl({ wickets: 2, runs: 18, overs: 5, match_id: 2 }),
    ]
    const map = aggregateBowling(rows)
    const agg = map.get('10')!
    expect(agg.wickets).toBe(5)
    expect(agg.runs).toBe(43)
    expect(agg.overs).toBe(11)
  })
})
