import { describe, it, expect } from 'vitest'
import { normaliseResult } from '../lib/result-normalisation'

const OUR_TEAM_ID = 'team_123'
const OPP_TEAM_ID = 'team_456'

describe('normaliseResult', () => {
  it('W + applied_to == ours → "Won"', () => {
    expect(normaliseResult('W', OUR_TEAM_ID, OUR_TEAM_ID)).toBe('Won')
  })

  it('W + applied_to != ours → "Lost"', () => {
    expect(normaliseResult('W', OPP_TEAM_ID, OUR_TEAM_ID)).toBe('Lost')
  })

  it('"T" → "Tied"', () => {
    expect(normaliseResult('T', OPP_TEAM_ID, OUR_TEAM_ID)).toBe('Tied')
  })

  it('"D" → "Drew"', () => {
    expect(normaliseResult('D', OPP_TEAM_ID, OUR_TEAM_ID)).toBe('Drew')
  })

  it('"A" → "Abandoned"', () => {
    expect(normaliseResult('A', OPP_TEAM_ID, OUR_TEAM_ID)).toBe('Abandoned')
  })

  it('"C" → "Cancelled"', () => {
    expect(normaliseResult('C', OPP_TEAM_ID, OUR_TEAM_ID)).toBe('Cancelled')
  })

  it('empty string → null', () => {
    expect(normaliseResult('', OPP_TEAM_ID, OUR_TEAM_ID)).toBeNull()
  })

  it('unknown result code → null', () => {
    expect(normaliseResult('X', OPP_TEAM_ID, OUR_TEAM_ID)).toBeNull()
  })
})
