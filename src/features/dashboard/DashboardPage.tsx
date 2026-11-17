import { lazy } from 'react'
import Scene3D from '../../three/Scene3D'
import { useAuth } from '../auth/AuthContext'
import GroupsDashboard, { type GroupSummary } from '../groups/GroupsDashboard'

const AmbientScene = lazy(() => import('../../three/AmbientScene'))

const GROUPS_NOT_CONNECTED =
  'Group services are not connected yet. No changes were saved.'

const noGroups: GroupSummary[] = []
const rejectUnavailable = () => Promise.reject(new Error(GROUPS_NOT_CONNECTED))

export default function DashboardPage() {
  const { displayName } = useAuth()

  return (
    <div className="dashboard">
      <Scene3D className="scene-backdrop">
        <AmbientScene count={14} />
      </Scene3D>
      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <p className="mb-5 text-slate-300">Hey {displayName ?? 'player'} 👋</p>
        <GroupsDashboard
          groups={noGroups}
          onCreateGroup={rejectUnavailable}
          onJoinGroup={rejectUnavailable}
          onLockGroup={rejectUnavailable}
        />
      </div>
    </div>
  )
}
