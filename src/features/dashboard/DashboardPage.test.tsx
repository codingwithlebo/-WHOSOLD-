import type { User } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import DashboardPage from './DashboardPage'
import {
  createGroup,
  loadGroups,
  type GroupSummary,
} from '../groups/groupService'

vi.mock('../../three/Scene3D', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('../../three/AmbientScene', () => ({ default: () => null }))
vi.mock('../groups/groupService', () => ({
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  loadGroups: vi.fn(),
  lockGroup: vi.fn(),
}))

const group: GroupSummary = {
  id: 'group-1',
  name: 'The Wednesday crew',
  joinCode: 'ABC123',
  members: ['Owethu'],
  isLeader: true,
  isLocked: false,
}
const createdGroup: GroupSummary = {
  id: 'group-2',
  name: 'New crew',
  joinCode: 'NEW234',
  members: ['Owethu'],
  isLeader: true,
  isLocked: false,
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadGroups).mockResolvedValue([])
    vi.mocked(createGroup).mockResolvedValue(createdGroup)
  })

  it('loads joined groups and creates a group for the signed-in member', async () => {
    vi.mocked(loadGroups).mockResolvedValue([group])
    renderWithProviders(<DashboardPage />, {
      auth: makeAuth({
        displayName: 'Owethu',
        user: { id: 'user-1' } as User,
      }),
    })

    expect(await screen.findByText('The Wednesday crew')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Group name'), 'New crew')
    await userEvent.click(screen.getByRole('button', { name: 'Create group' }))

    expect(loadGroups).toHaveBeenCalledWith('user-1')
    expect(createGroup).toHaveBeenCalledWith('New crew', 'user-1', 'Owethu')
    expect(await screen.findByText('NEW234')).toBeInTheDocument()
  })

  it('shows a retry action when groups fail to load', async () => {
    vi.mocked(loadGroups).mockRejectedValueOnce(
      new Error('Database temporarily unavailable.'),
    )
    renderWithProviders(<DashboardPage />, {
      auth: makeAuth({ user: { id: 'user-1' } as User }),
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database temporarily unavailable.',
    )
    expect(
      screen.getByRole('button', { name: 'Retry loading groups' }),
    ).toBeInTheDocument()
  })
})
