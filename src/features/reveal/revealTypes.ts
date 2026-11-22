/**
 * View model for the Phase 6 reveal screen. The wire format is defined in
 * docs/contracts/get-reveal.md; revealService.ts maps one to the other.
 */
export type RevealOutcome = 'intact' | 'doubled' | 'lost'

/** Named breakdown result per member (IMPLEMENTATION_PLAN Q4). */
export type MemberResult = 'passed' | 'doubled_won' | 'doubled_lost'

export interface RevealMember {
  userId: string
  displayName: string
  result: MemberResult
}

export interface RoundReveal {
  roundId: string
  outcome: RevealOutcome
  startingFundCents: number
  finalFundCents: number
  releasedAt: string
  members: RevealMember[]
}

export type RevealState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error'; message: string }
  /** Results exist but release time has not passed. No outcome data is held. */
  | { status: 'waiting'; releaseAt: string }
  | { status: 'revealed'; reveal: RoundReveal }
