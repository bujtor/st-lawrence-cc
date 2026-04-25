import { describe, it, expect } from 'vitest'
import {
  parsePCDate,
  parsePCTime,
  parsePCOvers,
  formatOvers,
  toIntOrNull,
  toNumOrNull,
} from '../lib/play-cricket'

describe('parsePCDate', () => {
  it('converts valid DD/MM/YYYY to ISO', () => {
    expect(parsePCDate('01/06/2025')).toBe('2025-06-01')
    expect(parsePCDate('15/12/2024')).toBe('2024-12-15')
    expect(parsePCDate('5/3/2026')).toBe('2026-03-05')
  })

  it('returns null for empty string', () => {
    expect(parsePCDate('')).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parsePCDate(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parsePCDate(undefined)).toBeNull()
  })

  it('returns null for malformed string (wrong separator)', () => {
    expect(parsePCDate('2025-06-01')).toBeNull()
    expect(parsePCDate('01.06.2025')).toBeNull()
  })

  it('returns null when parts are missing', () => {
    expect(parsePCDate('01/06')).toBeNull()
    expect(parsePCDate('/')).toBeNull()
  })

  it('returns null for non-numeric parts', () => {
    expect(parsePCDate('XX/06/2025')).toBeNull()
    expect(parsePCDate('01/AB/2025')).toBeNull()
    expect(parsePCDate('01/06/ABCD')).toBeNull()
  })
})

describe('parsePCTime', () => {
  it('converts valid HH:MM to HH:MM:00', () => {
    expect(parsePCTime('13:00')).toBe('13:00:00')
    expect(parsePCTime('09:30')).toBe('09:30:00')
  })

  it('returns null for empty string', () => {
    expect(parsePCTime('')).toBeNull()
  })

  it('handles single-digit hours', () => {
    expect(parsePCTime('9:30')).toBe('09:30:00')
  })
})

describe('parsePCOvers', () => {
  it('converts "4.3" to 4.5 (4 overs + 3 balls)', () => {
    expect(parsePCOvers('4.3')).toBeCloseTo(4.5)
  })

  it('converts "4" to 4.0', () => {
    expect(parsePCOvers('4')).toBe(4.0)
  })

  it('converts "10.5" to 10.833...', () => {
    expect(parsePCOvers('10.5')).toBeCloseTo(10.8333, 3)
  })

  it('returns null for empty string', () => {
    expect(parsePCOvers('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(parsePCOvers(null)).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(parsePCOvers('abc')).toBeNull()
  })

  it('clamps invalid balls count (> 5) and returns whole overs only', () => {
    // "5.7" is invalid (7 balls), so clamp: return 5 (whole overs)
    expect(parsePCOvers('5.7')).toBe(5)
  })
})

describe('formatOvers', () => {
  it('converts 4.5 (decimal) to "4.3" (cricket notation)', () => {
    expect(formatOvers(4.5)).toBe('4.3')
  })

  it('converts 4.0 to "4.0"', () => {
    expect(formatOvers(4.0)).toBe('4.0')
  })

  it('converts 10.833 to "10.5"', () => {
    expect(formatOvers(10.833333)).toBe('10.5')
  })

  it('returns "−" for null', () => {
    expect(formatOvers(null)).toBe('−')
  })

  it('returns "−" for undefined', () => {
    expect(formatOvers(undefined)).toBe('−')
  })
})

describe('toIntOrNull', () => {
  it('parses valid integer string', () => {
    expect(toIntOrNull('42')).toBe(42)
    expect(toIntOrNull('0')).toBe(0)
  })

  it('returns null for empty string', () => {
    expect(toIntOrNull('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(toIntOrNull(null)).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(toIntOrNull('abc')).toBeNull()
  })
})

describe('toNumOrNull', () => {
  it('parses valid float string', () => {
    expect(toNumOrNull('3.14')).toBeCloseTo(3.14)
    expect(toNumOrNull('0')).toBe(0)
  })

  it('returns null for empty string', () => {
    expect(toNumOrNull('')).toBeNull()
  })

  it('returns null for null', () => {
    expect(toNumOrNull(null)).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(toNumOrNull('xyz')).toBeNull()
  })
})
