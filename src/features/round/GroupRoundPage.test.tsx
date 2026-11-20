import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import GroupRoundPage from './GroupRoundPage'

const roundService = vi.hoisted(() => ({
  getGroupRound: vi.fn(),
  getReveal: vi.fn(),
  submitChoice: vi.fn(),
}))

vi.mock('./roundService', () => roundService)

function makeRound(myChoice: 'pass' | 'double' | null) {
  const now = Date.now()
  return {
    id: 'round-1',
    groupId: 'group-1',
    groupName: 'Crew',
    startingFundCents: 5000,
    opensAt: new Date(now - 10 * 60_000).toISOString(),
    closesAt: new Date(now + 10 * 60_000).toISOString(),
    releaseAt: new Date(now + 60 * 60_000).toISOString(),
    status: 'open' as const,
    answeredCount: myChoice ? 1 : 0,
    memberCount: 2,
    myChoice,
  }
}

describe('GroupRoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    roundService.getGroupRound
      .mockResolvedValueOnce(makeRound(null))
      .mockResolvedValue(makeRound('pass'))
    roundService.submitChoice.mockResolvedValue(undefined)
  })

  it('submits a choice through the round service and refreshes private state', async () => {
    const user = userEvent.setup()

    renderWithProviders(
      <Routes>
        <Route element={<GroupRoundPage />} path="/groups/:groupId/round" />
      </Routes>,
      {
        route: '/groups/group-1/round',
      },
    )

    await user.click(await screen.findByRole('button', { name: 'Choose Pass' }))
    await user.click(screen.getByRole('button', { name: 'Confirm Pass' }))

    expect(roundService.submitChoice).toHaveBeenCalledOnce()
    expect(roundService.submitChoice).toHaveBeenCalledWith('round-1', 'pass')
    expect(await screen.findByText('Choice submitted')).toBeInTheDocument()
    expect(roundService.getGroupRound).toHaveBeenCalledTimes(2)
  })
})
