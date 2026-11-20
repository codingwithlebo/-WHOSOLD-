import type { User } from '@supabase/supabase-js'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeAuth, renderWithProviders } from '../../test/renderWithProviders'
import { addWishlistItem, loadWishlist } from '../wishlist/wishlistService'
import GroupPage from './GroupPage'
import { loadGroup, type GroupSummary } from './groupService'

vi.mock('./groupService', () => ({ loadGroup: vi.fn() }))
vi.mock('../wishlist/wishlistService', () => ({
  addWishlistItem: vi.fn(),
  deleteWishlistItem: vi.fn(),
  loadWishlist: vi.fn(),
  updateWishlistItem: vi.fn(),
}))

const group: GroupSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'The Wednesday crew',
  joinCode: 'ABC123',
  members: [
    { userId: 'user-1', displayName: 'Lebo', isLeader: true },
    { userId: 'user-2', displayName: 'Mandla', isLeader: false },
  ],
  isLeader: true,
  isLocked: false,
}

const wishlist = [
  {
    id: 'item-1',
    name: 'Wireless headphones',
    priceCents: 125050,
    canManage: true,
  },
]

function renderGroupPage(route = `/groups/${group.id}`) {
  return renderWithProviders(
    <Routes>
      <Route element={<GroupPage />} path="/groups/:groupId" />
    </Routes>,
    {
      auth: makeAuth({ user: { id: 'user-1' } as User }),
      route,
    },
  )
}

describe('GroupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(loadGroup).mockResolvedValue(group)
    vi.mocked(loadWishlist).mockResolvedValue(wishlist)
    vi.mocked(addWishlistItem).mockResolvedValue({
      id: 'item-2',
      name: 'A book',
      priceCents: 2000,
      canManage: true,
    })
  })

  it('loads the group and wishlist, then adds items using cents', async () => {
    renderGroupPage()

    expect(
      await screen.findByRole('heading', { name: 'Group wishlist' }),
    ).toBeInTheDocument()
    expect(screen.getByText(group.name)).toBeInTheDocument()
    expect(screen.getByText('Open to new members')).toBeInTheDocument()
    expect(screen.getByText('2 members')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Try the game preview' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Live rounds are not connected to groups yet. This preview uses demo data, and choices are not saved.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Open demo preview' }),
    ).toHaveAttribute('href', `/groups/${group.id}/round`)
    expect(screen.getAllByText('R1 250.50')).toHaveLength(3)

    await userEvent.type(screen.getByLabelText('Item name'), 'A book')
    await userEvent.type(screen.getByLabelText('Price (Rand)'), '20.00')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(loadGroup).toHaveBeenCalledWith(group.id, 'user-1')
    expect(loadWishlist).toHaveBeenCalledWith(group.id, 'user-1', true)
    expect(addWishlistItem).toHaveBeenCalledWith(
      group.id,
      'A book',
      2000,
      'user-1',
      true,
    )
    expect(await screen.findByText('R20.00')).toBeInTheDocument()
    expect(screen.getAllByText('R1 270.50')).toHaveLength(2)
  })

  it('does not request wishlist data for a group the member cannot access', async () => {
    vi.mocked(loadGroup).mockResolvedValue(null)
    renderGroupPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This group could not be found or you are not a member.',
    )
    expect(loadWishlist).not.toHaveBeenCalled()
  })

  it('treats a malformed group URL as not found without offering a retry', async () => {
    renderGroupPage('/groups/abc')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This group could not be found or you are not a member.',
    )
    expect(loadGroup).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Retry loading group' }),
    ).not.toBeInTheDocument()
  })

  it('lets the member retry after a transient group data load error', async () => {
    vi.mocked(loadWishlist)
      .mockRejectedValueOnce(new Error('Network temporarily unavailable.'))
      .mockResolvedValueOnce(wishlist)
    renderGroupPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network temporarily unavailable.',
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Retry loading group' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Group wishlist' }),
    ).toBeInTheDocument()
    expect(loadGroup).toHaveBeenCalledTimes(2)
    expect(loadWishlist).toHaveBeenCalledTimes(2)
  })
})
