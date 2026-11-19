import { toError } from '../../lib/supabase'
import type { ResolvedRoundSummary, RoundOutcome } from './RoundHistoryPage'

export interface HistoryRpcRow {
  id: string
  resolved_at: string
  outcome: RoundOutcome
  starting_fund_cents: number
  final_fund_cents: number
}

interface HistoryRpcResponse {
  data: HistoryRpcRow[] | null
  error: { message: string } | null
}

export type GetHistoryRpc = (args: {
  target_group_id: string
}) => PromiseLike<HistoryRpcResponse>

export async function loadGroupHistory(
  groupId: string,
  getHistory: GetHistoryRpc,
): Promise<ResolvedRoundSummary[]> {
  const { data, error } = await getHistory({ target_group_id: groupId })

  if (error) throw toError(error)
  if (data === null) {
    throw new Error('The history service returned no data.')
  }

  return data.map((round) => ({
    id: round.id,
    resolvedAt: round.resolved_at,
    outcome: round.outcome,
    startingFundCents: round.starting_fund_cents,
    finalFundCents: round.final_fund_cents,
  }))
}
