/**
 * State for the landing-page "Double or Pass" preview. It mirrors the PRD
 * section 5 rules for a single player: a win doubles the fund, a loss wipes
 * it, a pass keeps it. Choices are final until the visitor resets.
 * This is a client-side teaser only — the real game is resolved on the server.
 */

export const STARTING_FUND_CENTS = 5_000_000 // R50 000

export type DemoPhase = 'idle' | 'doubled' | 'lost' | 'intact'

export interface DemoState {
  phase: DemoPhase
  fundCents: number
}

export type DemoAction =
  { type: 'double'; won: boolean } | { type: 'pass' } | { type: 'reset' }

export const initialDemoState: DemoState = {
  phase: 'idle',
  fundCents: STARTING_FUND_CENTS,
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === 'reset') return initialDemoState
  if (state.phase !== 'idle') return state

  if (action.type === 'pass') return { ...state, phase: 'intact' }
  return action.won
    ? { phase: 'doubled', fundCents: state.fundCents * 2 }
    : { phase: 'lost', fundCents: 0 }
}
