import { describe, it, expect } from 'vitest'
import { shiftDate } from '../lib/london-time'

describe('shiftDate', () => {
  it('moves back across month and year boundaries', () => {
    expect(shiftDate('2027-05-01', -1)).toBe('2027-04-30')
    expect(shiftDate('2027-01-01', -3)).toBe('2026-12-29')
  })
  it('handles leap years and forward shifts', () => {
    expect(shiftDate('2028-03-01', -1)).toBe('2028-02-29')
    expect(shiftDate('2027-02-28', 1)).toBe('2027-03-01')
  })
  it('is unaffected by clock changes (BST end, last Sunday of October)', () => {
    expect(shiftDate('2027-11-01', -1)).toBe('2027-10-31')
    expect(shiftDate('2027-03-29', -1)).toBe('2027-03-28')
  })
})
