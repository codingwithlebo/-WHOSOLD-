import { motion } from 'motion/react'
import { lazy } from 'react'
import { Button } from '../../components/ui/Button'
import TiltCard from '../../components/ui/TiltCard'
import Scene3D from '../../three/Scene3D'
import { useAuth } from '../auth/AuthContext'

const AmbientScene = lazy(() => import('../../three/AmbientScene'))

/** Placeholder until Phase 2 (groups) lands. */
export default function DashboardPage() {
  const { displayName } = useAuth()

  return (
    <div className="dashboard">
      <Scene3D className="scene-backdrop">
        <AmbientScene count={14} />
      </Scene3D>

      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="dashboard-title"
          initial={{ opacity: 0, y: 16 }}
        >
          Hey {displayName ?? 'player'} 👋
        </motion.h1>
        <p className="mt-2 text-slate-300">
          You&apos;re not in a group yet. Start one or join your crew with a
          code.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <TiltCard className="action-card">
            <span aria-hidden="true" className="step-icon">
              ✨
            </span>
            <h2>Create a group</h2>
            <p>Get a join code to share with your mates.</p>
            <Button disabled variant="primary">
              Coming in Phase 2
            </Button>
          </TiltCard>
          <TiltCard className="action-card">
            <span aria-hidden="true" className="step-icon">
              🔑
            </span>
            <h2>Join with a code</h2>
            <p>Got a 6-character code? Jump straight in.</p>
            <Button disabled variant="secondary">
              Coming in Phase 2
            </Button>
          </TiltCard>
        </div>
      </div>
    </div>
  )
}
