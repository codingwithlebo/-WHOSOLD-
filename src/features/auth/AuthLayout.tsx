import { motion } from 'motion/react'
import { lazy, type ReactNode } from 'react'
import TiltCard from '../../components/ui/TiltCard'
import Scene3D from '../../three/Scene3D'
import { useAuth } from './AuthContext'

const AmbientScene = lazy(() => import('../../three/AmbientScene'))

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const { configured } = useAuth()

  return (
    <div className="auth-page">
      <Scene3D className="scene-backdrop">
        <AmbientScene />
      </Scene3D>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <TiltCard className="auth-card" max={3}>
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {configured ? null : (
            <p className="notice">
              Supabase is not connected yet. Forms work, but log-in starts
              working once the project keys are in <code>.env</code>.
            </p>
          )}
          {children}
          <div className="auth-footer">{footer}</div>
        </TiltCard>
      </motion.div>
    </div>
  )
}
