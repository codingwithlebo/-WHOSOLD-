import { useState, type SubmitEvent } from 'react'
import { Button } from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TextField from '../../components/ui/TextField'
import { formatRand, parseRandToCents } from '../../lib/money'

export interface WishlistItem {
  id: string
  name: string
  priceCents: number
}

interface WishlistPanelProps {
  items: WishlistItem[]
  onAddItem: (name: string, priceCents: number) => Promise<WishlistItem>
  onUpdateItem: (
    itemId: string,
    name: string,
    priceCents: number,
  ) => Promise<WishlistItem>
  onDeleteItem: (itemId: string) => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'The request could not be completed. Please try again.'
}

function parseItem(
  nameInput: string,
  priceInput: string,
):
  | { ok: true; name: string; priceCents: number }
  | { ok: false; error: string } {
  const name = nameInput.trim()
  if (!name) return { ok: false, error: 'Enter an item name.' }

  const priceCents = parseRandToCents(priceInput)
  if (priceCents === null) {
    return { ok: false, error: 'Enter a valid price greater than R0.00.' }
  }

  return { ok: true, name, priceCents }
}

export default function WishlistPanel({
  items: initialItems,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: WishlistPanelProps) {
  const [items, setItems] = useState(initialItems)
  const [itemName, setItemName] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPrice, setEditingPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fundTotal = items.reduce((total, item) => total + item.priceCents, 0)

  async function handleAdd(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = parseItem(itemName, itemPrice)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const item = await onAddItem(parsed.name, parsed.priceCents)
      setItems((current) => [...current, item])
      setItemName('')
      setItemPrice('')
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  function startEditing(item: WishlistItem) {
    setEditingItemId(item.id)
    setEditingName(item.name)
    setEditingPrice(formatRand(item.priceCents))
    setError(null)
  }

  async function handleUpdate(
    event: SubmitEvent<HTMLFormElement>,
    itemId: string,
  ) {
    event.preventDefault()
    const parsed = parseItem(editingName, editingPrice)
    if (!parsed.ok) {
      setError(parsed.error)
      return
    }

    setBusy(true)
    setError(null)
    try {
      const item = await onUpdateItem(itemId, parsed.name, parsed.priceCents)
      setItems((current) =>
        current.map((existing) => (existing.id === itemId ? item : existing)),
      )
      setEditingItemId(null)
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(itemId: string) {
    setBusy(true)
    setError(null)
    try {
      await onDeleteItem(itemId)
      setItems((current) => current.filter((item) => item.id !== itemId))
    } catch (reason) {
      setError(getErrorMessage(reason))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="wishlist-heading" className="mx-auto w-full">
      <header>
        <p className="eyebrow">YOUR CREW</p>
        <h2 className="dashboard-title" id="wishlist-heading">
          Group wishlist
        </h2>
        <p className="mt-2 text-slate-300">
          Sponsored by a mystery billionaire · virtual funds
        </p>
      </header>

      <Card className="mt-6 p-6">
        <h3 className="text-xl font-bold">Add an item</h3>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          onSubmit={(event) => void handleAdd(event)}
        >
          <TextField
            autoComplete="off"
            label="Item name"
            maxLength={100}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Wireless headphones"
            value={itemName}
          />
          <TextField
            inputMode="decimal"
            label="Price (Rand)"
            onChange={(event) => setItemPrice(event.target.value)}
            placeholder="1 250.00"
            value={itemPrice}
          />
          <Button disabled={busy} type="submit" variant="primary">
            {busy ? 'Working…' : 'Add item'}
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="form-error mt-5" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-xl font-bold">Wishlist items</h3>
          <p aria-live="polite" className="text-lg font-semibold">
            <span className="text-slate-300">Fund total: </span>
            <span>{formatRand(fundTotal)}</span>
          </p>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-slate-300">No wishlist items yet.</p>
        ) : (
          <ul className="mt-4 list-none space-y-3 p-0">
            {items.map((item) => (
              <li
                className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-3 last:border-b-0"
                key={item.id}
              >
                {editingItemId === item.id ? (
                  <form
                    className="grid w-full gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-end"
                    onSubmit={(event) => void handleUpdate(event, item.id)}
                  >
                    <TextField
                      autoComplete="off"
                      label="Item name"
                      maxLength={100}
                      onChange={(event) => setEditingName(event.target.value)}
                      value={editingName}
                    />
                    <TextField
                      inputMode="decimal"
                      label="Price (Rand)"
                      onChange={(event) => setEditingPrice(event.target.value)}
                      value={editingPrice}
                    />
                    <Button disabled={busy} type="submit" variant="primary">
                      Save
                    </Button>
                    <Button
                      disabled={busy}
                      onClick={() => setEditingItemId(null)}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-slate-300">
                        {formatRand(item.priceCents)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        aria-label={`Edit ${item.name}`}
                        disabled={busy}
                        onClick={() => startEditing(item)}
                        variant="ghost"
                      >
                        Edit
                      </Button>
                      <Button
                        aria-label={`Delete ${item.name}`}
                        disabled={busy}
                        onClick={() => void handleDelete(item.id)}
                        variant="ghost"
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
