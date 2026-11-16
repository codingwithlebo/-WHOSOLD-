import { describe, expect, it } from 'vitest'
import { formatRand, parseRandToCents } from './money'

describe('formatRand', () => {
  it('formats cents as Rand with space thousands separators', () => {
    expect(formatRand(123456)).toBe('R1 234.56')
    expect(formatRand(5_000_000)).toBe('R50 000.00')
    expect(formatRand(0)).toBe('R0.00')
  })

  it('can hide cents for large headline numbers', () => {
    expect(formatRand(10_000_000, { cents: false })).toBe('R100 000')
  })
})

describe('parseRandToCents', () => {
  it('parses plain and formatted amounts', () => {
    expect(parseRandToCents('1234.5')).toBe(123450)
    expect(parseRandToCents('R1 234.56')).toBe(123456)
    expect(parseRandToCents(' 99 ')).toBe(9900)
  })

  it('rejects empty, negative, zero and non-numeric input', () => {
    expect(parseRandToCents('')).toBeNull()
    expect(parseRandToCents('-5')).toBeNull()
    expect(parseRandToCents('0')).toBeNull()
    expect(parseRandToCents('abc')).toBeNull()
    expect(parseRandToCents('1.234')).toBeNull()
  })
})
