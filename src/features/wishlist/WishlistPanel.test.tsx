import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test/renderWithProviders'
import WishlistPanel, { type WishlistItem } from './WishlistPanel'

const sampleItem: WishlistItem = {
  id: 'item-1',
  name: 'Wireless headphones',
  priceCents: 125050,
}

function renderWishlist(
  overrides: Partial<ComponentProps<typeof WishlistPanel>> = {},
) {
  return renderWithProviders(
    <WishlistPanel
      items={[]}
      onAddItem={vi.fn().mockResolvedValue(sampleItem)}
      onUpdateItem={vi.fn().mockResolvedValue(sampleItem)}
      onDeleteItem={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  )
}

describe('WishlistPanel', () => {
  it('adds an item using cents and updates the fund total', async () => {
    const onAddItem = vi.fn().mockResolvedValue(sampleItem)
    renderWishlist({ onAddItem })

    await userEvent.type(screen.getByLabelText('Item name'), '  Headphones  ')
    await userEvent.type(screen.getByLabelText('Price (Rand)'), '1250.50')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(onAddItem).toHaveBeenCalledWith('Headphones', 125050)
    expect(await screen.findByText('Wireless headphones')).toBeInTheDocument()
    expect(screen.getAllByText('R1 250.50')).toHaveLength(2)
  })

  it('rejects invalid prices without calling the add service', async () => {
    const onAddItem = vi.fn().mockResolvedValue(sampleItem)
    renderWishlist({ onAddItem })

    await userEvent.type(screen.getByLabelText('Item name'), 'A book')
    await userEvent.type(screen.getByLabelText('Price (Rand)'), '-10')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(onAddItem).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a valid price greater than R0.00.',
    )
    expect(screen.getByText('R0.00')).toBeInTheDocument()
  })

  it('edits an item and recalculates the total', async () => {
    const updatedItem = {
      ...sampleItem,
      name: 'New headphones',
      priceCents: 3550,
    }
    const onUpdateItem = vi.fn().mockResolvedValue(updatedItem)
    renderWishlist({ items: [sampleItem], onUpdateItem })

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Wireless headphones' }),
    )
    const item = screen.getByRole('listitem')
    await userEvent.clear(within(item).getByLabelText('Item name'))
    await userEvent.type(
      within(item).getByLabelText('Item name'),
      'New headphones',
    )
    await userEvent.clear(within(item).getByLabelText('Price (Rand)'))
    await userEvent.type(within(item).getByLabelText('Price (Rand)'), '35.50')
    await userEvent.click(within(item).getByRole('button', { name: 'Save' }))

    expect(onUpdateItem).toHaveBeenCalledWith('item-1', 'New headphones', 3550)
    expect(await screen.findByText('New headphones')).toBeInTheDocument()
    expect(screen.getAllByText('R35.50')).toHaveLength(2)
  })

  it('deletes an item and recalculates the total', async () => {
    const onDeleteItem = vi.fn().mockResolvedValue(undefined)
    renderWishlist({ items: [sampleItem], onDeleteItem })

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete Wireless headphones' }),
    )

    expect(onDeleteItem).toHaveBeenCalledWith('item-1')
    expect(
      await screen.findByText('No wishlist items yet.'),
    ).toBeInTheDocument()
    expect(screen.getByText('R0.00')).toBeInTheDocument()
  })

  it('shows service errors without applying the failed add', async () => {
    const onAddItem = vi
      .fn()
      .mockRejectedValue(new Error('Wishlist service is unavailable.'))
    renderWishlist({ onAddItem })

    await userEvent.type(screen.getByLabelText('Item name'), 'A book')
    await userEvent.type(screen.getByLabelText('Price (Rand)'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wishlist service is unavailable.',
    )
    expect(screen.getByText('No wishlist items yet.')).toBeInTheDocument()
    expect(screen.getByText('R0.00')).toBeInTheDocument()
  })
})
