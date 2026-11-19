import { Environment, Lightformer } from '@react-three/drei'

/**
 * Lighting shared by every scene. Metal and diamond look real only when they
 * have bright things to reflect, so this builds a small "photo studio"
 * environment from local light panels (nothing is downloaded at runtime).
 */
export default function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight intensity={1.6} position={[3, 6, 4]} />
      <pointLight
        color="#a879e8"
        distance={12}
        intensity={30}
        position={[-4, 2, 2]}
      />
      <Environment resolution={512}>
        {/* Soft violet room tone instead of a black void */}
        <color args={['#2a2142']} attach="background" />
        {/* Overhead softbox: makes coin faces and note tops glow */}
        <Lightformer
          color="#fff6e0"
          intensity={3.2}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[9, 9, 1]}
        />
        {/* Front strip: highlights on surfaces facing the camera */}
        <Lightformer
          intensity={1.6}
          position={[0, 1.5, 7]}
          scale={[12, 2.5, 1]}
        />
        {/* Ring light: crisp sparkle in the diamond facets */}
        <Lightformer
          form="ring"
          intensity={6}
          position={[0, 3, 5]}
          scale={2.2}
        />
        <Lightformer intensity={2.2} position={[0, 5, -4]} scale={[10, 2, 1]} />
        <Lightformer
          color="#a78bfa"
          intensity={4}
          position={[-6, 1, 1]}
          rotation-y={Math.PI / 2}
          scale={[5, 5, 1]}
        />
        <Lightformer
          color="#fbbf24"
          intensity={4}
          position={[6, 1, 1]}
          rotation-y={-Math.PI / 2}
          scale={[5, 5, 1]}
        />
      </Environment>
    </>
  )
}
