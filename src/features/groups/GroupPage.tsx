import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ButtonLink } from '../../components/ui/Button'
import { useAuth } from '../auth/AuthContext'
import WishlistPanel, { type WishlistItem } from '../wishlist/WishlistPanel'
import {
  addWishlistItem,
  deleteWishlistItem,
  loadWishlist,
  updateWishlistItem,
} from '../wishlist/wishlistService'
import { loadGroup, type GroupSummary } from './groupService'

export default function GroupPage() {
  const { user } = useAuth()
  const [group, setGroup] = useState<GroupSummary | null>(null)
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { groupId } = useParams<{ groupId: string }>()

  useEffect(() => {
    let active = true

    async function fetchGroup() {
      if (!user || !groupId) {
        setError(
          'Could not identify the group. Return to your groups and try again.',
        )
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setNotFound(false)

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
  }, [groupId, user])

  if (loading) {
    return (
      <main className="dashboard mx-auto w-full max-w-4xl" role="status">
        Loading group…
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="dashboard mx-auto w-full max-w-4xl">
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
      <main className="dashboard mx-auto w-full max-w-4xl">
        <p className="form-error" role="alert">
          {error ?? 'Your session has expired. Please sign in again.'}
        </p>
        <ButtonLink className="mt-4" to="/dashboard" variant="secondary">
          Back to groups
        </ButtonLink>
      </main>
    )
  }

  return (
    <main className="dashboard mx-auto w-full max-w-4xl">
      <ButtonLink to="/dashboard" variant="ghost">
        Back to groups
      </ButtonLink>
      <header className="mt-6">
        <p className="eyebrow">YOUR CREW</p>
        <h1 className="dashboard-title [overflow-wrap:anywhere]">
          {group.name}
        </h1>
        <p className="mt-2 text-slate-300">
          {group.members.length} of 10 members · Join code {group.joinCode}
        </p>
      </header>
      <section aria-labelledby="group-members-heading" className="mt-6">
        <h2 className="text-xl font-bold" id="group-members-heading">
          Group members
        </h2>
        <ul className="mt-2">
          {group.members.map((member, index) => (
            <li className="[overflow-wrap:anywhere]" key={`${member}-${index}`}>
              {member}
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-8">
        <WishlistPanel
          items={items}
          onAddItem={(name, priceCents) =>
            addWishlistItem(group.id, name, priceCents, user.id, group.isLeader)
          }
          onUpdateItem={(itemId, name, priceCents) =>
            updateWishlistItem(
              itemId,
              name,
              priceCents,
              user.id,
              group.isLeader,
            )
          }
          onDeleteItem={deleteWishlistItem}
        />
      </div>
    </main>
  )
}
