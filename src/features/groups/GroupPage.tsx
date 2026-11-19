import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import WishlistPanel, { type WishlistItem } from '../wishlist/WishlistPanel'
import {
  addWishlistItem,
  deleteWishlistItem,
  loadWishlist,
  updateWishlistItem,
} from '../wishlist/wishlistService'
import { loadGroup, type GroupSummary } from './groupService'

const UUID_PATTERN = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

export default function GroupPage() {
  const { user } = useAuth()
  const [group, setGroup] = useState<GroupSummary | null>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const { groupId } = useParams<{ groupId: string }>()

  useEffect(() => {
    let active = true

    async function fetchGroup() {
      setLoading(true)
      setError(null)
      setNotFound(false)

      if (!user) {
        setError(
          'Could not identify the group. Return to your groups and try again.',
        )
        setLoading(false)
        return
      }

      if (!groupId || !UUID_PATTERN.test(groupId)) {
        setNotFound(true)
        setLoading(false)
        return
      }

      try {
        const loadedGroup = await loadGroup(groupId, user.id)
        if (!loadedGroup) {
          if (active) setNotFound(true)
          return
        }

        const wishlist = await loadWishlist(
          groupId,
          user.id,
          loadedGroup.isLeader,
        )
        if (active) {
          setGroup(loadedGroup)
          setItems(wishlist)
        }
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Could not load this group. Please try again.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchGroup()
    return () => {
      active = false
    }
  }, [groupId, retryCount, user])

  if (loading) {
    return (
      <main className="dashboard group-detail" role="status">
        Loading group…
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="dashboard group-detail">
        <p className="form-error" role="alert">
          This group could not be found or you are not a member.
        </p>
        <ButtonLink className="mt-4" to="/dashboard" variant="secondary">
          Back to groups
        </ButtonLink>
      </main>
    )
  }

  if (error || !group || !user) {
    return (
      <main className="dashboard group-detail">
        <p className="form-error" role="alert">
          {error ?? 'Your session has expired. Please sign in again.'}
        </p>
        {error && groupId && user ? (
          <Button
            className="mt-4"
            onClick={() => {
              setLoading(true)
              setError(null)
              setRetryCount((current) => current + 1)
            }}
            variant="secondary"
          >
            Retry loading group
          </Button>
        ) : null}
        <ButtonLink className="mt-4" to="/dashboard" variant="secondary">
          Back to groups
        </ButtonLink>
      </main>
    )
  }

  const leaderName =
    group.members.find((member) => member.isLeader)?.displayName ??
    'group leader'

  return (
    <main className="dashboard group-detail">
      <div className="group-detail-topbar">
        <ButtonLink to="/dashboard" variant="ghost">
          Back to groups
        </ButtonLink>
        <span className="group-code-pill">
          Code <strong>{group.joinCode}</strong>
        </span>
      </div>
      <header className="group-title-plaque">
        <p className="eyebrow">YOUR CREW</p>
        <h1>Group wishlist</h1>
        <p>{group.name}</p>
      </header>
      <div className="group-status-pill">
        <span>
          {group.isLocked
            ? `Locked by Leader (${leaderName})`
            : 'Open to new members'}
        </span>
        <span aria-hidden="true">·</span>
        <strong>{group.members.length} members</strong>
      </div>
      <WishlistPanel
        items={items}
        onAddItem={(name, priceCents) =>
          addWishlistItem(group.id, name, priceCents, user.id, group.isLeader)
        }
        onUpdateItem={(itemId, name, priceCents) =>
          updateWishlistItem(itemId, name, priceCents, user.id, group.isLeader)
        }
        onDeleteItem={deleteWishlistItem}
      />
      <nav aria-label="Group navigation" className="group-page-nav">
        <ButtonLink to="/dashboard" variant="primary">
          Groups
        </ButtonLink>
        <a href="#wishlist-heading">Wishlist</a>
      </nav>
    </main>
  )
}
