import { Environment, Lightformer } from '@react-three/drei'

/**
 * Lighting shared by every scene. The environment is built from local
 * light panels, so nothing is downloaded at runtime.
 */
export default function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight intensity={1.4} position={[3, 6, 4]} />
      <pointLight
        color="#8b5cf6"
        distance={12}
        intensity={30}
        position={[-4, 2, 2]}
      />
      <Environment resolution={256}>
        <Lightformer intensity={2.2} position={[0, 5, -3]} scale={[10, 2, 1]} />
        <Lightformer
          color="#a78bfa"
          intensity={4}
          position={[-5, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[4, 4, 1]}
        />
        <Lightformer
          color="#fbbf24"
          intensity={3}
          position={[5, 1, 1]}
          rotation-y={-Math.PI / 2}
          scale={[4, 4, 1]}
        />
      </Environment>
    </>
  )
}
