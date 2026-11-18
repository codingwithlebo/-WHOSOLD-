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
  it('keeps add-form controls in keyboard order', async () => {
    const user = userEvent.setup()
    renderWishlist()

    await user.tab()
    expect(screen.getByLabelText('Item name')).toHaveFocus()
    await user.tab()
    expect(screen.getByLabelText('Price (Rand)')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Add item' })).toHaveFocus()
  })

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
    const price = screen.getByLabelText('Price (Rand)')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter a valid price greater than R0.00.')
    expect(price).toHaveAttribute('aria-invalid', 'true')
    expect(price).toHaveAttribute('aria-describedby', error.id)
    expect(screen.getByText('R0.00')).toBeInTheDocument()
  })

  it('associates an empty item-name error with its input', async () => {
    renderWishlist()

    await userEvent.type(screen.getByLabelText('Price (Rand)'), '20')
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    const itemName = screen.getByLabelText('Item name')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter an item name.')
    expect(itemName).toHaveAttribute('aria-invalid', 'true')
    expect(itemName).toHaveAttribute('aria-describedby', error.id)
  })

  it('associates edit errors with the editing field only', async () => {
    renderWishlist({ items: [sampleItem] })

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Wireless headphones' }),
    )
    const item = screen.getByRole('listitem')
    const name = within(item).getByLabelText('Item name')
    await userEvent.clear(name)
    await userEvent.click(within(item).getByRole('button', { name: 'Save' }))

    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter an item name.')
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAttribute('aria-describedby', error.id)
    const [addName] = screen.getAllByLabelText('Item name')
    expect(addName).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('associates add errors with the add form while an item is being edited', async () => {
    renderWishlist({ items: [sampleItem] })

    await userEvent.click(
      screen.getByRole('button', { name: 'Edit Wireless headphones' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }))

    const [addName, editingName] = screen.getAllByLabelText('Item name')
    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Enter an item name.')
    expect(addName).toHaveAttribute('aria-invalid', 'true')
    expect(addName).toHaveAttribute('aria-describedby', error.id)
    expect(editingName).not.toHaveAttribute('aria-invalid', 'true')
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
