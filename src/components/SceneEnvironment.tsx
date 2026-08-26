import { RoundedBox } from '@react-three/drei'
import type { RefObject } from 'react'
import * as THREE from 'three'

type SceneEnvironmentProps = {
  floorY: number
  shadowRef: RefObject<THREE.Mesh | null>
}

function PlaygroundDetails({ floorY }: { floorY: number }) {
  return (
    <group>
      <RoundedBox
        args={[1.2, 0.18, 0.48]}
        radius={0.09}
        smoothness={3}
        position={[-3.7, floorY + 0.08, -1.5]}
        rotation={[0, 0.28, -0.02]}
        receiveShadow
      >
        <meshStandardMaterial color="#a86d3e" roughness={0.95} />
      </RoundedBox>
      <mesh position={[3.5, floorY + 0.22, -1.8]} castShadow>
        <dodecahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color="#ce8c4d" roughness={1} />
      </mesh>
      <mesh position={[4.15, floorY + 0.12, -2.1]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#e4aa60" roughness={1} />
      </mesh>
      {[-4.7, -4.35, 4.6, 4.95].map((x, index) => (
        <group key={x} position={[x, floorY + 0.08, -2.4]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.3, 8]} />
            <meshStandardMaterial color="#648952" />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, 0, index % 2 ? 0.3 : -0.3]}>
            <circleGeometry args={[0.09, 12]} />
            <meshStandardMaterial
              color={index % 2 ? '#fff1a8' : '#f49d75'}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function SceneEnvironment({
  floorY,
  shadowRef,
}: SceneEnvironmentProps) {
  return (
    <>
      <color attach="background" args={['#efae65']} />
      <fog attach="fog" args={['#efae65', 10, 22]} />

      <ambientLight intensity={1.1} color="#ffe7bb" />
      <hemisphereLight args={['#fff1c9', '#9b593c', 1.6]} />
      <directionalLight
        position={[-4, 8, 5]}
        intensity={3.1}
        color="#fff2ca"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-5}
      />
      <pointLight position={[4, 1, 4]} intensity={8} color="#ffb36c" />

      <mesh
        position={[0, floorY - 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[45, 35]} />
        <meshStandardMaterial color="#bd7048" roughness={0.98} />
      </mesh>

      <mesh
        ref={shadowRef}
        position={[0, floorY + 0.012, -0.08]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 0.48, 1]}
        renderOrder={1}
      >
        <circleGeometry args={[0.8, 48]} />
        <meshBasicMaterial
          color="#512f31"
          transparent
          opacity={0.17}
          depthWrite={false}
        />
      </mesh>

      <PlaygroundDetails floorY={floorY} />
    </>
  )
}
