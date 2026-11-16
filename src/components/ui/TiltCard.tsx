import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { PointerEvent, ReactNode } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees. */
  max?: number
}

/** A card that tilts in 3D toward the pointer and shows a moving glare. */
export default function TiltCard({
  children,
  className = '',
  max = 8,
}: TiltCardProps) {
  const reduced = usePrefersReducedMotion()
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spring = { stiffness: 180, damping: 18 }
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), spring)
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), spring)
  const glareX = useTransform(px, (v) => `${v * 100}%`)
  const glareY = useTransform(py, (v) => `${v * 100}%`)

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reduced) return
    const rect = event.currentTarget.getBoundingClientRect()
    px.set((event.clientX - rect.left) / rect.width)
    py.set((event.clientY - rect.top) / rect.height)
  }

  function onPointerLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      className={`tilt-card ${className}`}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
        ['--glare-x' as string]: glareX,
        ['--glare-y' as string]: glareY,
      }}
    >
      {children}
    </motion.div>
  )
}
