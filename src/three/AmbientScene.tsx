import { Float, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Banknote, Coin3D } from './Money3D'
import StudioLights from './StudioLights'

/** Small seeded random generator so the coin layout is the same on every render. */
function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

interface FloatingCoin {
  position: [number, number, number]
  rotation: [number, number, number]
  speed: number
  scale: number
}

function makeCoins(count: number): FloatingCoin[] {
  const rand = seeded(2026)
  const between = (min: number, max: number) => min + rand() * (max - min)
  return Array.from({ length: count }, () => ({
    position: [between(-8, 8), between(-4.5, 4.5), between(-7, -1.5)],
    rotation: [between(0, Math.PI), between(0, Math.PI), between(0, Math.PI)],
    speed: between(0.6, 1.8),
    scale: between(0.5, 1),
  }))
}

function CameraParallax({ reduced }: { reduced: boolean }) {
  useFrame((state, rawDelta) => {
    if (reduced) return
    const dt = Math.min(rawDelta, 1 / 30)
    const { camera, pointer } = state
    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      pointer.x * 0.9,
      2,
      dt,
    )
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      pointer.y * 0.6,
      2,
      dt,
    )
    camera.lookAt(0, 0, -4)
  })
  return null
}

/** A calm field of floating coins and banknotes, used behind the auth and dashboard pages. */
export default function AmbientScene({ count = 22 }: { count?: number }) {
  const reduced = usePrefersReducedMotion()
  const pieces = useMemo(() => makeCoins(count), [count])

  return (
    <Canvas
      camera={{ fov: 45, position: [0, 0, 6] }}
      dpr={[1, 1.5]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true }}
    >
      <StudioLights />
      <CameraParallax reduced={reduced} />
      {pieces.map((piece, index) => (
        <Float
          enabled={!reduced}
          floatIntensity={1.6}
          key={index}
          rotationIntensity={2}
          speed={piece.speed}
        >
          {/* Every third piece is a banknote, the rest are coins. */}
          {index % 3 === 0 ? (
            <Banknote
              position={piece.position}
              rotation={piece.rotation}
              scale={piece.scale * 1.6}
            />
          ) : (
            <Coin3D
              position={piece.position}
              rotation={piece.rotation}
              scale={piece.scale * 0.9}
            />
          )}
        </Float>
      ))}
      <Sparkles
        color="#a78bfa"
        count={70}
        scale={[16, 9, 6]}
        size={2}
        speed={reduced ? 0 : 0.3}
      />
    </Canvas>
  )
}
