import { lazy, useCallback, useEffect, useState } from 'react'
import Scene3D from '../../three/Scene3D'
import { useAuth } from '../auth/AuthContext'
import GroupsDashboard, { type GroupSummary } from '../groups/GroupsDashboard'
import {
  createGroup,
  joinGroup,
  loadGroups,
  lockGroup,
} from '../groups/groupService'

const AmbientScene = lazy(() => import('../../three/AmbientScene'))

export default function DashboardPage() {
  const { displayName, user } = useAuth()
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [groupsLoadError, setGroupsLoadError] = useState<string | null>(null)

  const refreshGroups = useCallback(async () => {
    if (!user) {
      setGroupsLoading(false)
      setGroupsLoadError('Your session has expired. Please sign in again.')
      return
    }

    setGroupsLoading(true)
    setGroupsLoadError(null)
    try {
      setGroups(await loadGroups(user.id))
    } catch (reason) {
      setGroupsLoadError(
        reason instanceof Error
          ? reason.message
          : 'Could not load your groups. Please try again.',
      )
    } finally {
      setGroupsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    let active = true
    loadGroups(user.id)
      .then((loadedGroups) => {
        if (active) {
          setGroups(loadedGroups)
          setGroupsLoadError(null)
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setGroupsLoadError(
            reason instanceof Error
              ? reason.message
              : 'Could not load your groups. Please try again.',
          )
        }
      })
      .finally(() => {
        if (active) setGroupsLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  async function handleCreateGroup(name: string): Promise<GroupSummary> {
    if (!user)
      throw new Error('Your session has expired. Please sign in again.')
    const group = await createGroup(name, user.id, displayName)
    setGroupsLoadError(null)
    return group
  }

  async function handleJoinGroup(code: string): Promise<GroupSummary> {
    if (!user)
      throw new Error('Your session has expired. Please sign in again.')
    const group = await joinGroup(code, user.id)
    setGroupsLoadError(null)
    return group
  }

  async function handleLockGroup(groupId: string): Promise<void> {
    if (!user)
      throw new Error('Your session has expired. Please sign in again.')
    await lockGroup(groupId)
  }

  return (
    <div className="dashboard">
      <Scene3D className="scene-backdrop">
        <AmbientScene count={14} />
      </Scene3D>
      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <p className="mb-5 text-on-surface-muted">
          Hey {displayName ?? 'player'} 👋
        </p>
        <GroupsDashboard
          groups={groups}
          onGroupsChange={setGroups}
          groupsLoading={groupsLoading}
          groupsLoadError={groupsLoadError}
          onRetryGroups={() => void refreshGroups()}
          onCreateGroup={handleCreateGroup}
          onJoinGroup={handleJoinGroup}
          onLockGroup={handleLockGroup}
        />
      </div>
    </div>
  )
}
