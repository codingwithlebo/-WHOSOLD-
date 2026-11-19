import { describe, expect, it } from 'vitest'
import {
  formatCountdown,
  formatSastInputValue,
  parseSastInputValue,
} from './roundTime'

describe('roundTime', () => {
  it('converts between ISO times and SAST datetime-local values', () => {
    const instant = new Date('2026-11-20T08:30:00.000Z')

    expect(formatSastInputValue(instant)).toBe('2026-11-20T10:30')
    expect(parseSastInputValue('2026-11-20T10:30')?.toISOString()).toBe(
      instant.toISOString(),
    )
  })

  it('rejects invalid local times and formats non-negative countdowns', () => {
    expect(parseSastInputValue('2026-02-30T10:30')).toBeNull()
    expect(formatCountdown(60_001)).toBe('1m 01s')
    expect(formatCountdown(-1)).toBe('0m 00s')
  })
})
