import { describe, expect, it, vi } from 'vitest'
import type { GetRevealRpc, RevealRpcRow } from './revealService'
import { formatTimeUntil, loadReveal } from './revealService'

const row: RevealRpcRow = {
  round_id: 'round-1',
  outcome: 'lost',
  starting_fund_cents: 5_000_000,
  final_fund_cents: 0,
  release_at: '2026-11-20T16:00:00.000Z',
  members: [
    { user_id: 'u-1', display_name: 'Cara', result: 'passed' },
    { user_id: 'u-2', display_name: 'Bob', result: 'doubled_won' },
    { user_id: 'u-3', display_name: 'Alice', result: 'passed' },
    { user_id: 'u-4', display_name: 'Dan', result: 'doubled_lost' },
  ],
}

describe('loadReveal', () => {
  it('calls get_reveal with its contract argument and maps the row', async () => {
    const getReveal: GetRevealRpc = vi
      .fn()
      .mockResolvedValue({ data: [row], error: null })

    const reveal = await loadReveal('round-1', getReveal)

    expect(getReveal).toHaveBeenCalledWith({ target_round_id: 'round-1' })
    expect(reveal).toMatchObject({
      roundId: 'round-1',
      outcome: 'lost',
      startingFundCents: 5_000_000,
      finalFundCents: 0,
      releasedAt: '2026-11-20T16:00:00.000Z',
    })
    // Losses first, then wins, then passes; alphabetical inside a group.
    expect(reveal.members.map((m) => m.displayName)).toEqual([
      'Dan',
      'Bob',
      'Alice',
      'Cara',
    ])
  })

  it('surfaces the server message, e.g. before release time', async () => {
    const getReveal: GetRevealRpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Results are not released yet.', code: 'P0001' },
    })

    await expect(loadReveal('round-1', getReveal)).rejects.toThrow(
      'Results are not released yet.',
    )
  })

  it('rejects an empty response', async () => {
    const getReveal: GetRevealRpc = vi
      .fn()
      .mockResolvedValue({ data: [], error: null })

    await expect(loadReveal('round-1', getReveal)).rejects.toThrow(
      'The reveal service returned no data.',
    )
  })
})

describe('formatTimeUntil', () => {
  it.each([
    [0, '0m 00s'],
    [-5_000, '0m 00s'],
    [65_000, '1m 05s'],
    [3_600_000 + 61_000, '1h 01m 01s'],
    [2 * 86_400_000 + 4 * 3_600_000 + 5 * 60_000, '2d 4h 05m'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatTimeUntil(ms)).toBe(expected)
  })
})
