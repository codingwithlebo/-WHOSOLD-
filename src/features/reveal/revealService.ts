import { toError } from '../../lib/supabase'
import type { MemberResult, RevealOutcome, RoundReveal } from './revealTypes'

/** One row of `get_reveal`, exactly as docs/contracts/get-reveal.md defines it. */
export interface RevealRpcRow {
  round_id: string
  outcome: RevealOutcome
  starting_fund_cents: number
  final_fund_cents: number
  release_at: string
  members: {
    user_id: string
    display_name: string
    result: MemberResult
  }[]
}

interface RevealRpcResponse {
  data: RevealRpcRow[] | null
  error: { message: string; code?: string } | null
}

export type GetRevealRpc = (args: {
  target_round_id: string
}) => PromiseLike<RevealRpcResponse>

const resultOrder: Record<MemberResult, number> = {
  doubled_lost: 0,
  doubled_won: 1,
  passed: 2,
}

export async function loadReveal(
  roundId: string,
  getReveal: GetRevealRpc,
): Promise<RoundReveal> {
  const { data, error } = await getReveal({ target_round_id: roundId })

  if (error) throw toError(error)
  const row = data?.[0]
  if (!row) {
    throw new Error('The reveal service returned no data.')
  }

  const members = row.members
    .map((member) => ({
      userId: member.user_id,
      displayName: member.display_name,
      result: member.result,
    }))
    .sort(
      (a, b) =>
        resultOrder[a.result] - resultOrder[b.result] ||
        a.displayName.localeCompare(b.displayName),
    )

  return {
    roundId: row.round_id,
    outcome: row.outcome,
    startingFundCents: row.starting_fund_cents,
    finalFundCents: row.final_fund_cents,
    releasedAt: row.release_at,
    members,
  }
}

/** "2d 4h 05m", "4h 05m 09s" or "5m 09s" until the release time. */
export function formatTimeUntil(milliseconds: number): string {
  const total = Math.max(0, Math.ceil(milliseconds / 1000))
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const seconds = total % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  if (days > 0) return `${days}d ${hours}h ${pad(minutes)}m`
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
  return `${minutes}m ${pad(seconds)}s`
}
