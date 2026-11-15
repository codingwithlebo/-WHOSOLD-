import { Suspense, type ReactNode } from 'react'
import { supportsWebGL } from './supportsWebGL'

interface Scene3DProps {
  /** A lazily imported scene, so three.js is only downloaded when needed. */
  children: ReactNode
  className?: string
}

/**
 * Renders a 3D scene when WebGL is available, otherwise a static gradient.
 * The 3D is decorative, so it is hidden from screen readers.
 */
export default function Scene3D({ children, className = '' }: Scene3DProps) {
  const fallback = <div className="scene-fallback" />

  return (
    <div aria-hidden="true" className={`scene ${className}`}>
      {supportsWebGL() ? (
        <Suspense fallback={fallback}>{children}</Suspense>
      ) : (
        fallback
      )}
    </div>
  )
}
