import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import GroupsDashboard, { type GroupSummary } from './GroupsDashboard'

const sampleGroup: GroupSummary = {
  id: 'group-1',
  name: 'The Wednesday crew',
  joinCode: 'ABC123',
  members: ['Lebo', 'Mandla'],
  isLeader: true,
  isLocked: false,
}

function renderGroups(
  overrides: Partial<ComponentProps<typeof GroupsDashboard>> = {},
) {
  return renderWithProviders(
    <GroupsDashboard
      groups={[]}
      onCreateGroup={vi.fn().mockResolvedValue(sampleGroup)}
      onJoinGroup={vi.fn().mockResolvedValue(sampleGroup)}
      onLockGroup={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  )
}

describe('GroupsDashboard', () => {
  it('creates a group with a trimmed name and shows its join details', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(sampleGroup)
    renderGroups({ onCreateGroup })

    await userEvent.type(screen.getByLabelText('Group name'), '  Crew  ')
    await userEvent.click(screen.getByRole('button', { name: 'Create group' }))

    expect(onCreateGroup).toHaveBeenCalledWith('Crew')
    expect(await screen.findByText('The Wednesday crew')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('2 of 10 members')).toBeInTheDocument()
  })

  it('requires a group name before calling the create service', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue(sampleGroup)
    renderGroups({ onCreateGroup })

    await userEvent.click(screen.getByRole('button', { name: 'Create group' }))

    expect(onCreateGroup).not.toHaveBeenCalled()
    const groupName = screen.getByLabelText('Group name')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter a group name.')
    expect(groupName).toHaveAttribute('aria-invalid', 'true')
    expect(groupName).toHaveAttribute('aria-describedby', error.id)
  })

  it('normalizes join codes and rejects invalid codes before calling the service', async () => {
    const onJoinGroup = vi.fn().mockResolvedValue(sampleGroup)
    renderGroups({ onJoinGroup })

    await userEvent.type(screen.getByLabelText('Join code'), ' ab12 ')
    await userEvent.click(screen.getByRole('button', { name: 'Join group' }))

    expect(onJoinGroup).not.toHaveBeenCalled()
    const joinCode = screen.getByLabelText('Join code')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter a valid 6-character group code.')
    expect(joinCode).toHaveAttribute('aria-invalid', 'true')
    expect(joinCode).toHaveAttribute('aria-describedby', error.id)

    await userEvent.clear(screen.getByLabelText('Join code'))
    await userEvent.type(screen.getByLabelText('Join code'), 'ab12cd')
    await userEvent.click(screen.getByRole('button', { name: 'Join group' }))

    expect(onJoinGroup).toHaveBeenCalledWith('AB12CD')
    expect(await screen.findByText('The Wednesday crew')).toBeInTheDocument()
  })

  it('shows service errors without displaying a successful result', async () => {
    const onCreateGroup = vi
      .fn()
      .mockRejectedValue(new Error('Group services are not connected yet.'))
    renderGroups({ onCreateGroup })

    await userEvent.type(screen.getByLabelText('Group name'), 'My group')
    await userEvent.click(screen.getByRole('button', { name: 'Create group' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Group services are not connected yet.',
    )
    expect(
      screen.getByText("You haven't joined a group yet."),
    ).toBeInTheDocument()
  })

  it('lets the leader lock a group and hides the action after locking', async () => {
    const onLockGroup = vi.fn().mockResolvedValue(undefined)
    renderGroups({ groups: [sampleGroup], onLockGroup })

    await userEvent.click(screen.getByRole('button', { name: 'Lock group' }))

    expect(onLockGroup).toHaveBeenCalledWith('group-1')
    expect(await screen.findByText('Group locked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Lock group' }),
    ).not.toBeInTheDocument()
  })

  it('keeps form controls in keyboard order', async () => {
    const user = userEvent.setup()
    renderGroups()

    await user.tab()
    expect(screen.getByLabelText('Group name')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Create group' })).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Join code')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Join group' })).toHaveFocus()
  })

  it('copies a group join code and confirms the action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    renderGroups({ groups: [sampleGroup] })

    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }))

    expect(writeText).toHaveBeenCalledWith('ABC123')
    expect(
      await screen.findByRole('button', { name: 'Copied' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Join code copied.')).toHaveAttribute(
      'role',
      'status',
    )
  })
})
