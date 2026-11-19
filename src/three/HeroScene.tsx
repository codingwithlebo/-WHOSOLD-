import {
  ContactShadows,
  Float,
  MeshTransmissionMaterial,
  Sparkles,
  useCursor,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { DemoPhase } from '../features/landing/demoMachine'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { Banknote, Bundle, Coin3D } from './Money3D'
import { COIN_HEIGHT, getMoneyAssets } from './moneyAssets'
import StudioLights from './StudioLights'

const { damp } = THREE.MathUtils

const STACK_COINS = 16
const BASE_COINS = 8
const BUNDLE_HEIGHT = 0.3 * 0.85
const NOTES = 12

/** Phase accent colours: violet waiting, gold doubled, red lost, teal intact. */
const PHASE_COLOR: Record<DemoPhase, string> = {
  idle: '#a879e8',
  doubled: '#fbbf24',
  lost: '#f43f5e',
  intact: '#2dd4bf',
}

/** A barely-there tint so the diamond still reads as a clear stone. */
const DIAMOND_TINT: Record<DemoPhase, string> = {
  idle: '#f4efff',
  doubled: '#fff4d1',
  lost: '#ffe1e6',
  intact: '#e3fff8',
}

/** Stable pseudo-random number in [0, 1) for an index. */
function jitter(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

interface Rest {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
}

const hidden = (
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): Rest => ({ position, rotation, scale: 0 })

function stackCoinRest(index: number, phase: DemoPhase): Rest {
  const level = index % BASE_COINS
  const y = COIN_HEIGHT / 2 + level * COIN_HEIGHT
  const wobble = (jitter(index) - 0.5) * 0.05
  const rotation: [number, number, number] = [0, jitter(index + 40) * 6.28, 0]
  if (phase === 'doubled') {
    const x = index < BASE_COINS ? -0.72 : 0.42
    return { position: [x + wobble, y, 0.2 + wobble], rotation, scale: 1 }
  }
  if (index >= BASE_COINS) return hidden([0.42, y + 4, 0.2], rotation)
  return { position: [wobble, y, wobble * 0.6], rotation, scale: 1 }
}

const LOOSE_COINS: Rest[] = [
  { position: [1.4, COIN_HEIGHT / 2, 0.95], rotation: [0, 0.6, 0], scale: 1 },
  {
    position: [-1.55, COIN_HEIGHT / 2, -0.55],
    rotation: [0, 2.1, 0],
    scale: 1,
  },
  // Standing coin leaning back, showing its face to the camera.
  {
    position: [-0.55, 0.5, 1.15],
    rotation: [Math.PI / 2 - 0.35, 0, 0.25],
    scale: 1,
  },
]

function bundleRest(index: number, phase: DemoPhase): Rest {
  const position: [number, number, number] = [
    1.05 + (jitter(index + 7) - 0.5) * 0.1,
    BUNDLE_HEIGHT / 2 + index * BUNDLE_HEIGHT,
    -0.85,
  ]
  const rotation: [number, number, number] = [
    0,
    -0.55 + (jitter(index + 3) - 0.5) * 0.3,
    0,
  ]
  const visible = phase === 'doubled' ? index < 4 : index < 2
  return visible
    ? { position, rotation, scale: 0.85 }
    : hidden([position[0], position[1] + 3, position[2]], rotation)
}

interface PhysicalProps {
  phase: DemoPhase
  rest: (phase: DemoPhase) => Rest
  reduced: boolean
  children: ReactNode
}

/**
 * Moves a piece of money toward its resting place for the current phase.
 * When the fund is lost, it bursts outward and falls away under gravity.
 * When a piece appears (fund doubled), it drops in from above.
 */
function Physical({ phase, rest, reduced, children }: PhysicalProps) {
  const ref = useRef<THREE.Group>(null)
  const velocity = useRef(new THREE.Vector3())
  const spin = useRef(new THREE.Vector3())
  const seenPhase = useRef<DemoPhase>(phase)
  const [initial] = useState(() => rest(phase))

  useFrame((_, rawDelta) => {
    const group = ref.current
    if (!group) return
    const dt = Math.min(rawDelta, 1 / 30)
    const target = rest(phase)

    if (seenPhase.current !== phase) {
      const previous = seenPhase.current
      seenPhase.current = phase
      if (phase === 'lost') {
        velocity.current.set(
          (Math.random() - 0.5) * 7,
          2.5 + Math.random() * 3.5,
          (Math.random() - 0.2) * 4,
        )
        spin.current.set(
          Math.random() * 12,
          Math.random() * 6,
          Math.random() * 12,
        )
      } else if (previous === 'lost' || group.scale.x < 0.01) {
        // Drop in from above, staggered by the resting height.
        group.position.set(
          target.position[0],
          target.position[1] + 2.5 + target.position[1] * 2,
          target.position[2],
        )
        group.rotation.set(...target.rotation)
        if (target.scale > 0) group.scale.setScalar(target.scale)
      }
    }

    if (phase === 'lost') {
      if (reduced) {
        group.scale.setScalar(0)
        return
      }
      velocity.current.y -= 9.8 * dt
      group.position.addScaledVector(velocity.current, dt)
      group.rotation.x += spin.current.x * dt
      group.rotation.y += spin.current.y * dt
      group.rotation.z += spin.current.z * dt
      group.scale.setScalar(damp(group.scale.x, 0, 1.3, dt))
      return
    }

    const k = reduced ? 1000 : 7
    const [x, y, z] = target.position
    group.position.x = damp(group.position.x, x, k, dt)
    group.position.y = damp(group.position.y, y, reduced ? 1000 : 5, dt)
    group.position.z = damp(group.position.z, z, k, dt)
    group.rotation.x = damp(group.rotation.x, target.rotation[0], k, dt)
    group.rotation.y = damp(group.rotation.y, target.rotation[1], k, dt)
    group.rotation.z = damp(group.rotation.z, target.rotation[2], k, dt)
    group.scale.setScalar(damp(group.scale.x, target.scale, k, dt))
  })

  return (
    <group
      position={initial.position}
      ref={ref}
      rotation={initial.rotation}
      scale={initial.scale}
    >
      {children}
    </group>
  )
}

/** Banknotes drifting around the vault: a few at rest, a storm when doubled. */
function FlyingNote({
  index,
  phase,
  reduced,
}: {
  index: number
  phase: DemoPhase
  reduced: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  const fall = useRef(0)
  const radius = 2.1 + jitter(index) * 0.7
  const height = 0.5 + jitter(index + 11) * 2.4
  const speed = (0.12 + jitter(index + 23) * 0.12) * (index % 2 ? 1 : -1)
  const offset = (index / NOTES) * Math.PI * 2
  const visible = phase === 'doubled' ? true : phase !== 'lost' && index < 4

  useFrame((state, rawDelta) => {
    const note = ref.current
    if (!note) return
    const dt = Math.min(rawDelta, 1 / 30)
    const t = reduced ? 0 : state.clock.elapsedTime
    const angle = offset + t * speed

    if (phase === 'lost') {
      fall.current += dt
      note.position.y -= fall.current * 6 * dt
      note.rotation.z += dt * 3
    } else {
      fall.current = 0
      note.position.set(
        Math.cos(angle) * radius,
        height + Math.sin(t * 0.8 + index) * 0.25,
        Math.sin(angle) * radius * 0.7,
      )
      note.rotation.set(
        Math.sin(t * 1.3 + index) * 0.6,
        -angle + Math.PI / 2,
        Math.cos(t * 1.1 + index) * 0.4,
      )
    }
    note.scale.setScalar(damp(note.scale.x, visible ? 0.75 : 0, 4, dt))
  })

  return (
    <group ref={ref} scale={0}>
      <Banknote />
    </group>
  )
}

const GLINT_POINTS: [number, number, number][] = [
  [0.36, 0.27, 0.05],
  [-0.25, 0.27, 0.26],
  [0.5, 0.12, -0.3],
  [-0.55, 0.05, -0.1],
  [0.1, -0.35, 0.36],
  [0, 0.28, -0.2],
]

function Glints({ reduced }: { reduced: boolean }) {
  const { glintTexture } = getMoneyAssets()
  const refs = useRef<(THREE.Sprite | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    refs.current.forEach((sprite, i) => {
      if (!sprite) return
      const pulse = reduced
        ? 0.15
        : Math.pow(Math.max(0, Math.sin(t * (1.3 + i * 0.37) + i * 2.1)), 14)
      sprite.scale.setScalar(0.05 + pulse * 0.55)
    })
  })

  return (
    <>
      {GLINT_POINTS.map((point, i) => (
        <sprite
          key={i}
          position={point}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <spriteMaterial
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            map={glintTexture}
            transparent
          />
        </sprite>
      ))}
    </>
  )
}

function Diamond({ phase, reduced }: { phase: DemoPhase; reduced: boolean }) {
  const { diamondGeometry } = getMoneyAssets()
  const spinRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const boost = useRef(0)
  const [hovered, setHovered] = useState(false)
  const tint = useMemo(() => new THREE.Color(), [])
  const accent = useMemo(() => new THREE.Color(), [])
  const background = useMemo(() => new THREE.Color('#d9d2ff'), [])
  useCursor(hovered)

  useFrame((_, rawDelta) => {
    const group = spinRef.current
    const mesh = meshRef.current
    if (!group || !mesh) return
    const dt = Math.min(rawDelta, 1 / 30)
    boost.current = damp(boost.current, 0, 1.6, dt)
    if (!reduced) group.rotation.y += dt * (0.5 + boost.current)
    group.scale.setScalar(damp(group.scale.x, hovered ? 1.15 : 1, 8, dt))

    const blend = 1 - Math.exp(-4 * dt)
    const material = mesh.material as THREE.MeshPhysicalMaterial
    tint.set(DIAMOND_TINT[phase])
    material.color.lerp(tint, blend)
    if (lightRef.current) {
      accent.set(PHASE_COLOR[phase])
      lightRef.current.color.lerp(accent, blend)
    }
  })

  return (
    <Float
      enabled={!reduced}
      floatIntensity={0.9}
      rotationIntensity={0.25}
      speed={1.8}
    >
      <group position={[0, 2.55, 0]} rotation-x={0.18}>
        <group ref={spinRef}>
          <mesh
            geometry={diamondGeometry}
            onClick={() => (boost.current = 14)}
            onPointerOut={() => setHovered(false)}
            onPointerOver={() => setHovered(true)}
            ref={meshRef}
          >
            <MeshTransmissionMaterial
              anisotropicBlur={0.05}
              background={background}
              backside
              backsideThickness={0.4}
              chromaticAberration={0.3}
              color={DIAMOND_TINT.idle}
              distortion={0}
              envMapIntensity={3}
              ior={2.42}
              resolution={512}
              roughness={0}
              samples={6}
              thickness={0.6}
            />
          </mesh>
          <Glints reduced={reduced} />
        </group>
        <pointLight
          color={PHASE_COLOR.idle}
          distance={4.5}
          intensity={14}
          position={[0, -0.9, 0]}
          ref={lightRef}
        />
      </group>
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
    <group position={[0, -0.12, 0]}>
      <mesh>
        <cylinderGeometry args={[2.2, 2.35, 0.24, 96]} />
        <meshStandardMaterial
          color="#15121f"
          metalness={0.6}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 0.121, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[2.06, 2.14, 96]} />
        <meshStandardMaterial color="#c89b3c" metalness={1} roughness={0.3} />
      </mesh>
      <mesh rotation-x={Math.PI / 2}>
        <torusGeometry args={[2.28, 0.02, 16, 128]} />
        <meshStandardMaterial
          color="#111827"
          emissive={PHASE_COLOR.idle}
          emissiveIntensity={2.4}
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
  children: ReactNode
  reduced: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, rawDelta) => {
    if (!ref.current || reduced) return
    const dt = Math.min(rawDelta, 1 / 30)
    ref.current.rotation.y = damp(
      ref.current.rotation.y,
      state.pointer.x * 0.4,
      3,
      dt,
    )
    ref.current.rotation.x = damp(
      ref.current.rotation.x,
      -state.pointer.y * 0.1,
      3,
      dt,
    )
  })
  return <group ref={ref}>{children}</group>
}

export default function HeroScene({ phase }: { phase: DemoPhase }) {
  const reduced = usePrefersReducedMotion()

  return (
    <Canvas
      camera={{ fov: 34, position: [0, 2.7, 9.8] }}
      dpr={[1, 1.75]}
      frameloop={reduced ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true }}
    >
      <StudioLights />
      <spotLight
        angle={0.55}
        decay={0}
        intensity={2.4}
        penumbra={0.8}
        position={[2, 7, 5]}
      />
      <PointerRig reduced={reduced}>
        <group position={[0, -0.9, 0]}>
          {Array.from({ length: STACK_COINS }, (_, i) => (
            <Physical
              key={`coin-${i}`}
              phase={phase}
              reduced={reduced}
              rest={(p) => stackCoinRest(i, p)}
            >
              <Coin3D />
            </Physical>
          ))}
          {LOOSE_COINS.map((rest, i) => (
            <Physical
              key={`loose-${i}`}
              phase={phase}
              reduced={reduced}
              rest={() => rest}
            >
              <Coin3D />
            </Physical>
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <Physical
              key={`bundle-${i}`}
              phase={phase}
              reduced={reduced}
              rest={(p) => bundleRest(i, p)}
            >
              <Bundle />
            </Physical>
          ))}
          {Array.from({ length: NOTES }, (_, i) => (
            <FlyingNote
              index={i}
              key={`note-${i}`}
              phase={phase}
              reduced={reduced}
            />
          ))}
          <Diamond phase={phase} reduced={reduced} />
          <Pedestal phase={phase} />
          <Sparkles
            color={PHASE_COLOR[phase]}
            count={phase === 'doubled' ? 110 : 40}
            position={[0, 1.4, 0]}
            scale={[5, 3.8, 3.5]}
            size={phase === 'doubled' ? 5 : 2.5}
            speed={reduced ? 0 : 0.45}
          />
        </group>
      </PointerRig>
      <ContactShadows
        blur={2.6}
        far={4}
        opacity={0.6}
        position={[0, -1.15, 0]}
        scale={10}
      />
    </Canvas>
  )
}
