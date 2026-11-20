import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import GroupRoundLauncher from './GroupRoundLauncher'
import type { GroupSummary } from '../groups/groupService'

const roundService = vi.hoisted(() => ({
  getGroupRound: vi.fn(),
  startRound: vi.fn(),
}))

vi.mock('./roundService', () => roundService)

const group: GroupSummary = {
  id: 'group-1',
  name: 'Crew',
  joinCode: 'CREW01',
  isLeader: true,
  isLocked: true,
  members: [
    { userId: 'leader-1', displayName: 'Leader', isLeader: true },
    { userId: 'member-1', displayName: 'Member', isLeader: false },
  ],
}

describe('GroupRoundLauncher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    roundService.getGroupRound.mockResolvedValue(null)
    roundService.startRound.mockResolvedValue('round-1')
  })

  it('lets an eligible leader schedule a round', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <GroupRoundLauncher group={group} startingFundCents={5000} />,
    )

    await user.click(await screen.findByRole('button', { name: 'Start round' }))

    expect(roundService.startRound).toHaveBeenCalledOnce()
  })

  it('does not offer scheduling to a non-leader', async () => {
    renderWithProviders(
      <GroupRoundLauncher
        group={{ ...group, isLeader: false }}
        startingFundCents={5000}
      />,
    )

    expect(
      await screen.findByText(
        'Waiting for the group leader to schedule a round.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Start round' }),
    ).not.toBeInTheDocument()
  })
})
