import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PotatoGame } from './components/PotatoGame'

export default function App() {
  return (
    <main className="playground">
      <header className="title-card">
        <p className="eyebrow">angry potato</p>
        <h1>click to burst <span>·</span> drag to launch</h1>
      </header>

      <div className="scene" aria-label="Interactive 3D potato playground">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [0, 2.15, 9], fov: 42, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.outputColorSpace = 'srgb'
            gl.toneMappingExposure = 1.05
          }}
        >
          <Suspense fallback={null}>
            <PotatoGame />
          </Suspense>
        </Canvas>
      </div>

      <p className="touch-note">works with a mouse or a finger</p>
    </main>
  )
}
