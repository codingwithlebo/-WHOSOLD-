import { describe, expect, it } from 'vitest'
import {
  demoReducer,
  initialDemoState,
  STARTING_FUND_CENTS,
} from './demoMachine'

describe('demoReducer (landing page Double or Pass preview)', () => {
  it('starts idle with the starting fund', () => {
    expect(initialDemoState).toEqual({
      phase: 'idle',
      fundCents: STARTING_FUND_CENTS,
    })
  })

  it('doubles the fund on a Double that wins', () => {
    const state = demoReducer(initialDemoState, { type: 'double', won: true })
    expect(state).toEqual({
      phase: 'doubled',
      fundCents: STARTING_FUND_CENTS * 2,
    })
  })

  it('wipes the fund on a Double that loses', () => {
    const state = demoReducer(initialDemoState, { type: 'double', won: false })
    expect(state).toEqual({ phase: 'lost', fundCents: 0 })
  })

  it('keeps the fund intact on Pass', () => {
    const state = demoReducer(initialDemoState, { type: 'pass' })
    expect(state).toEqual({ phase: 'intact', fundCents: STARTING_FUND_CENTS })
  })

  it('ignores a second choice until reset (choices are final)', () => {
    const lost = demoReducer(initialDemoState, { type: 'double', won: false })
    expect(demoReducer(lost, { type: 'pass' })).toBe(lost)
    expect(demoReducer(lost, { type: 'reset' })).toEqual(initialDemoState)
  })
})
