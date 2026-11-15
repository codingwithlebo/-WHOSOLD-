import {
  ContactShadows,
  Float,
  MeshDistortMaterial,
  Sparkles,
  useCursor,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { DemoPhase } from '../features/landing/demoMachine'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import StudioLights from './StudioLights'

const COINS = 16
const BASE_COINS = 8
const COIN_RADIUS = 0.55
const COIN_HEIGHT = 0.13
const { damp } = THREE.MathUtils

const PHASE_COLOR: Record<DemoPhase, string> = {
  idle: '#8b5cf6',
  doubled: '#fbbf24',
  lost: '#f43f5e',
  intact: '#2dd4bf',
}

interface Target {
  x: number
  y: number
  scale: number
}

/** Where each coin should rest for a phase: one stack, or two when doubled. */
function coinTarget(index: number, phase: DemoPhase): Target {
  const level = index % BASE_COINS
  if (phase === 'doubled') {
    return {
      x: index < BASE_COINS ? -0.62 : 0.62,
      y: level * COIN_HEIGHT,
      scale: 1,
    }
  }
  const visible = index < BASE_COINS
  return { x: 0, y: level * COIN_HEIGHT, scale: visible ? 1 : 0 }
}

interface CoinProps {
  index: number
  phase: DemoPhase
  reduced: boolean
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

function Coin({ index, phase, reduced, geometry, material }: CoinProps) {
  const ref = useRef<THREE.Mesh>(null)
  const velocity = useRef(new THREE.Vector3())
  const spin = useRef(new THREE.Vector3())
  const seenPhase = useRef<DemoPhase>(phase)
  const [initial] = useState(() => coinTarget(index, phase))

  useFrame((_, rawDelta) => {
    const coin = ref.current
    if (!coin) return
    const dt = Math.min(rawDelta, 1 / 30)
    const target = coinTarget(index, phase)

    if (seenPhase.current !== phase) {
      if (phase === 'lost') {
        // Burst outward, then fall: the group lost everything.
        velocity.current.set(
          (Math.random() - 0.5) * 7,
          2.5 + Math.random() * 3.5,
          (Math.random() - 0.3) * 4,
        )
        spin.current.set(
          Math.random() * 12,
          Math.random() * 6,
          Math.random() * 12,
        )
      } else if (phase === 'doubled' && index >= BASE_COINS) {
        // New coins rain down onto the second stack, one after another.
        coin.position.set(target.x, 3.5 + (index - BASE_COINS) * 0.45, 0)
        coin.scale.setScalar(1)
      } else if (seenPhase.current === 'lost') {
        coin.position.set(target.x, 3 + index * 0.25, 0)
        coin.rotation.set(0, 0, 0)
      }
      seenPhase.current = phase
    }

    if (phase === 'lost') {
      if (reduced) {
        coin.scale.setScalar(0)
        return
      }
      velocity.current.y -= 9.8 * dt
      coin.position.addScaledVector(velocity.current, dt)
      coin.rotation.x += spin.current.x * dt
      coin.rotation.y += spin.current.y * dt
      coin.rotation.z += spin.current.z * dt
      coin.scale.setScalar(damp(coin.scale.x, 0, 1.4, dt))
      return
    }

    const speed = reduced ? 1000 : 7
    coin.position.x = damp(coin.position.x, target.x, speed, dt)
    coin.position.y = damp(coin.position.y, target.y, reduced ? 1000 : 5, dt)
    coin.position.z = damp(coin.position.z, 0, speed, dt)
    coin.rotation.x = damp(coin.rotation.x, 0, speed, dt)
    coin.rotation.z = damp(coin.rotation.z, 0, speed, dt)
    coin.scale.setScalar(damp(coin.scale.x, target.scale, speed, dt))
  })

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[initial.x, initial.y, 0]}
      ref={ref}
      scale={initial.scale}
    />
  )
}

function MysteryGem({
  phase,
  reduced,
}: {
  phase: DemoPhase
  reduced: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const boost = useRef(0)
  const [hovered, setHovered] = useState(false)
  const targetColor = useMemo(() => new THREE.Color(), [])
  useCursor(hovered)

  useFrame((_, rawDelta) => {
    const gem = ref.current
    if (!gem) return
    const dt = Math.min(rawDelta, 1 / 30)
    boost.current = damp(boost.current, 0, 1.8, dt)
    if (!reduced) {
      gem.rotation.y += dt * (0.45 + boost.current)
      gem.rotation.x += dt * 0.12
    }
    gem.scale.setScalar(damp(gem.scale.x, hovered ? 1.18 : 1, 8, dt))

    const material = gem.material as THREE.MeshPhysicalMaterial
    targetColor.set(PHASE_COLOR[phase])
    material.color.lerp(targetColor, 1 - Math.exp(-4 * dt))
    material.emissive.lerp(targetColor, 1 - Math.exp(-4 * dt))
  })

  return (
    <Float
      enabled={!reduced}
      floatIntensity={1.1}
      rotationIntensity={0.3}
      speed={2}
    >
      <mesh
        onClick={() => (boost.current = 14)}
        onPointerOut={() => setHovered(false)}
        onPointerOver={() => setHovered(true)}
        position={[0, 2.35, 0]}
        ref={ref}
      >
        <icosahedronGeometry args={[0.5, 0]} />
        <MeshDistortMaterial
          color={PHASE_COLOR.idle}
          distort={reduced ? 0 : 0.28}
          emissive={PHASE_COLOR.idle}
          emissiveIntensity={0.55}
          metalness={0.35}
          roughness={0.12}
          speed={2.2}
        />
      </mesh>
    </Float>
  )
}

function Pedestal({ phase }: { phase: DemoPhase }) {
  const ring = useRef<THREE.MeshStandardMaterial>(null)
  const targetColor = useMemo(() => new THREE.Color(), [])

  useFrame((_, dt) => {
    if (!ring.current) return
    targetColor.set(PHASE_COLOR[phase])
    ring.current.emissive.lerp(
      targetColor,
      1 - Math.exp(-4 * Math.min(dt, 1 / 30)),
    )
  })

  return (
    <group position={[0, -0.16, 0]}>
      <mesh>
        <cylinderGeometry args={[1.6, 1.75, 0.2, 64]} />
        <meshStandardMaterial
          color="#1e1b2e"
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[1.62, 0.025, 16, 96]} />
        <meshStandardMaterial
          color="#111827"
          emissive={PHASE_COLOR.idle}
          emissiveIntensity={2.2}
          ref={ring}
        />
      </mesh>
    </group>
  )
}

/** Tilts the whole vault toward the pointer for a parallax feel. */
function PointerRig({
  children,
  reduced,
}: {
  children: React.ReactNode
  reduced: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, rawDelta) => {
    if (!ref.current || reduced) return
    const dt = Math.min(rawDelta, 1 / 30)
    ref.current.rotation.y = damp(
      ref.current.rotation.y,
      state.pointer.x * 0.45,
      3,
      dt,
    )
    ref.current.rotation.x = damp(
      ref.current.rotation.x,
      -state.pointer.y * 0.12,
      3,
      dt,
    )
  })
  return <group ref={ref}>{children}</group>
}

export default function HeroScene({ phase }: { phase: DemoPhase }) {
  const reduced = usePrefersReducedMotion()
  const geometry = useMemo(
    () =>
      new THREE.CylinderGeometry(
        COIN_RADIUS,
        COIN_RADIUS,
        COIN_HEIGHT * 0.9,
        48,
      ),
    [],
  )
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffc94d',
        emissive: '#4a2c00',
        emissiveIntensity: 0.35,
        metalness: 0.85,
        roughness: 0.3,
      }),
    [],
  )

  return (
    <Canvas
      camera={{ fov: 34, position: [0, 2.3, 8.4] }}
      dpr={[1, 1.75]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true }}
    >
      <StudioLights />
      <spotLight
        angle={0.5}
        decay={0}
        intensity={2.2}
        penumbra={0.8}
        position={[0, 6, 4]}
      />
      <PointerRig reduced={reduced}>
        <group position={[0, -0.7, 0]}>
          {Array.from({ length: COINS }, (_, index) => (
            <Coin
              geometry={geometry}
              index={index}
              key={index}
              material={material}
              phase={phase}
              reduced={reduced}
            />
          ))}
          <MysteryGem phase={phase} reduced={reduced} />
          <Pedestal phase={phase} />
          <Sparkles
            color={PHASE_COLOR[phase]}
            count={phase === 'doubled' ? 110 : 45}
            position={[0, 1.2, 0]}
            scale={[4.5, 3.5, 3]}
            size={phase === 'doubled' ? 5 : 2.5}
            speed={reduced ? 0 : 0.45}
          />
        </group>
      </PointerRig>
      <ContactShadows
        blur={2.6}
        far={4}
        opacity={0.55}
        position={[0, -0.97, 0]}
        scale={8}
      />
    </Canvas>
  )
}
