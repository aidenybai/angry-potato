import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'

type BurstParticle = {
  id: string
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  duration: number
  size: number
  rotation: number
  rotationSpeed: number
}

type PotatoBurstProps = {
  origin: THREE.Vector3
  texture: THREE.Texture
  onComplete: () => void
}

const PARTICLE_COUNT = 56
const GRAVITY = 8.8

function makeParticle(origin: THREE.Vector3): BurstParticle {
  const angle = Math.random() * Math.PI * 2
  const lift = 0.25 + Math.random() * 0.95
  const spread = 0.45 + Math.random() * 0.85
  const force = 3.8 + Math.random() * 4.3

  return {
    id: crypto.randomUUID(),
    position: origin
      .clone()
      .add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.22,
          (Math.random() - 0.5) * 0.22,
          (Math.random() - 0.5) * 0.22,
        ),
      ),
    velocity: new THREE.Vector3(
      Math.cos(angle) * spread,
      lift,
      Math.sin(angle) * spread * 0.65,
    )
      .normalize()
      .multiplyScalar(force),
    life: 0,
    duration: 1.25 + Math.random() * 0.75,
    size: 0.18 + Math.random() * 0.2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 11,
  }
}

export function PotatoBurst({
  origin,
  texture,
  onComplete,
}: PotatoBurstProps) {
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, () => makeParticle(origin)),
  )
  const sprites = useRef<(THREE.Sprite | null)[]>([])
  const completed = useRef(false)

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    let livingParticles = 0

    particles.forEach((particle, index) => {
      const sprite = sprites.current[index]
      if (!sprite) return

      particle.life += delta
      particle.velocity.y -= GRAVITY * delta
      particle.velocity.multiplyScalar(Math.pow(0.992, delta * 60))
      particle.position.addScaledVector(particle.velocity, delta)
      particle.rotation += particle.rotationSpeed * delta

      const progress = particle.life / particle.duration
      const inBounds =
        particle.position.y > -4 && particle.position.lengthSq() < 220

      if (progress < 1 && inBounds) {
        livingParticles += 1
        const entrance = Math.min(1, progress * 12)
        const exit = Math.max(0, 1 - progress)
        const scale = particle.size * entrance * Math.pow(exit, 0.38)

        sprite.visible = true
        sprite.position.copy(particle.position)
        sprite.scale.setScalar(scale)
        sprite.material.rotation = particle.rotation
        sprite.material.opacity = Math.min(1, exit * 1.8)
      } else {
        sprite.visible = false
      }
    })

    if (livingParticles === 0 && !completed.current) {
      completed.current = true
      onComplete()
    }
  })

  return (
    <group>
      {particles.map((particle, index) => (
        <sprite
          key={particle.id}
          ref={(sprite) => {
            sprites.current[index] = sprite
          }}
          position={particle.position}
          scale={particle.size}
          renderOrder={3}
        >
          <spriteMaterial
            map={texture}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      ))}
    </group>
  )
}
