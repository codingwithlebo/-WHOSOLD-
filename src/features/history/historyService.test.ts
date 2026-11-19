import { describe, expect, it, vi } from 'vitest'
import type { GetHistoryRpc, HistoryRpcRow } from './historyService'
import { loadGroupHistory } from './historyService'

const rows: HistoryRpcRow[] = [
  {
    id: 'round-1',
    resolved_at: '2026-11-17T12:00:00.000Z',
    outcome: 'doubled',
    starting_fund_cents: 5000000,
    final_fund_cents: 10000000,
  },
  {
    id: 'round-2',
    resolved_at: '2026-11-16T12:00:00.000Z',
    outcome: 'lost',
    starting_fund_cents: 5000000,
    final_fund_cents: 0,
  },
]

describe('loadGroupHistory', () => {
  it('calls the history RPC with its contract argument and maps rows to the view model', async () => {
    const getHistory: GetHistoryRpc = vi.fn().mockResolvedValue({
      data: rows,
      error: null,
    })

    await expect(loadGroupHistory('group-1', getHistory)).resolves.toEqual([
      {
        id: 'round-1',
        resolvedAt: '2026-11-17T12:00:00.000Z',
        outcome: 'doubled',
        startingFundCents: 5000000,
        finalFundCents: 10000000,
      },
      {
        id: 'round-2',
        resolvedAt: '2026-11-16T12:00:00.000Z',
        outcome: 'lost',
        startingFundCents: 5000000,
        finalFundCents: 0,
      },
    ])
    expect(getHistory).toHaveBeenCalledWith({ target_group_id: 'group-1' })
  })

  it('returns an empty list for the contract empty response', async () => {
    const getHistory: GetHistoryRpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    await expect(loadGroupHistory('group-1', getHistory)).resolves.toEqual([])
  })

  it('surfaces RPC errors and rejects a missing response', async () => {
    const getHistoryError: GetHistoryRpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'This group could not be found or you are not a member.',
      },
    })
    const missingData: GetHistoryRpc = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })

    await expect(loadGroupHistory('group-1', getHistoryError)).rejects.toThrow(
      'This group could not be found or you are not a member.',
    )
    await expect(loadGroupHistory('group-1', missingData)).rejects.toThrow(
      'The history service returned no data.',
    )
  })
})
