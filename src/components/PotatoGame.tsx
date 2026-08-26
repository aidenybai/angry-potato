import { Line } from '@react-three/drei'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { useCallback, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { usePotatoTexture } from '../lib/potatoTexture'
import { PotatoBurst } from './PotatoBurst'
import { SceneEnvironment } from './SceneEnvironment'

type GameMode = 'idle' | 'dragging' | 'flying' | 'bursting' | 'respawning'

const REST_POSITION = new THREE.Vector3(0, 0, 0)
const FLOOR_Y = -1.55
const POTATO_RADIUS = 0.72
const DRAG_LIMIT = 2.65
const CLICK_THRESHOLD = 8
const LAUNCH_POWER = 4.35
const GRAVITY = 9.8
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

function Trajectory({ pullPosition }: { pullPosition: THREE.Vector3 }) {
  const points = useMemo(() => {
    const velocity = REST_POSITION.clone()
      .sub(pullPosition)
      .multiplyScalar(LAUNCH_POWER)
    const result: { id: number; position: THREE.Vector3 }[] = []

    for (let index = 1; index <= 22; index += 1) {
      const time = index * 0.105
      const point = pullPosition
        .clone()
        .addScaledVector(velocity, time)
        .add(new THREE.Vector3(0, -0.5 * GRAVITY * time * time, 0))

      if (point.y < FLOOR_Y + POTATO_RADIUS * 0.4) break
      result.push({ id: index, position: point })
    }

    return result
  }, [pullPosition])

  return (
    <group>
      {points.map(({ id, position: point }, index) => {
        const fade = 1 - index / Math.max(points.length, 1)
        return (
          <mesh key={id} position={point} scale={0.045 + fade * 0.045}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshBasicMaterial
              color="#fff4c8"
              transparent
              opacity={0.25 + fade * 0.55}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export function PotatoGame() {
  const potatoTexture = usePotatoTexture()
  const potatoGroup = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const initialPosition = useMemo(() => REST_POSITION.clone(), [])
  const initialVelocity = useMemo(() => new THREE.Vector3(), [])
  const position = useRef(initialPosition)
  const velocity = useRef(initialVelocity)
  const pointerStart = useRef({ x: 0, y: 0 })
  const maximumMovement = useRef(0)
  const bounceSquash = useRef(0)
  const settleTime = useRef(0)
  const burstTimer = useRef(0)
  const respawnTimer = useRef(0)
  const [mode, setMode] = useState<GameMode>('idle')
  const [previewPosition, setPreviewPosition] = useState(() =>
    REST_POSITION.clone(),
  )
  const [burst, setBurst] = useState<{
    id: number
    origin: THREE.Vector3
  } | null>(null)

  const resetAtCenter = useCallback(() => {
    position.current.copy(REST_POSITION)
    velocity.current.set(0, 0, 0)
    settleTime.current = 0
  }, [])

  const beginBurst = useCallback(() => {
    resetAtCenter()
    burstTimer.current = 0
    setBurst({
      id: performance.now(),
      origin: REST_POSITION.clone().add(new THREE.Vector3(0, 0.05, 0)),
    })
    setMode('bursting')
  }, [resetAtCenter])

  const finishBurst = useCallback(() => {
    resetAtCenter()
    respawnTimer.current = 0
    setBurst(null)
    setMode('respawning')
  }, [resetAtCenter])

  const projectPointer = useCallback((event: ThreeEvent<PointerEvent>) => {
    const projected = new THREE.Vector3()
    event.ray.intersectPlane(DRAG_PLANE, projected)

    const pull = projected.addScaledVector(REST_POSITION, -1)
    if (pull.length() > DRAG_LIMIT) pull.setLength(DRAG_LIMIT)
    pull.y = Math.max(pull.y, FLOOR_Y + POTATO_RADIUS)

    return pull.add(REST_POSITION)
  }, [])

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (mode !== 'idle') return
    event.stopPropagation()
    const captureTarget = event.target as (EventTarget & {
      setPointerCapture(pointerId: number): void
    }) | null
    captureTarget?.setPointerCapture(event.pointerId)
    pointerStart.current = { x: event.clientX, y: event.clientY }
    maximumMovement.current = 0
    setMode('dragging')
  }

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (mode !== 'dragging') return
    event.stopPropagation()

    const movement = Math.hypot(
      event.clientX - pointerStart.current.x,
      event.clientY - pointerStart.current.y,
    )
    maximumMovement.current = Math.max(maximumMovement.current, movement)

    if (maximumMovement.current >= CLICK_THRESHOLD) {
      const nextPosition = projectPointer(event)
      position.current.copy(nextPosition)
      setPreviewPosition(nextPosition.clone())
    }
  }

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (mode !== 'dragging') return
    event.stopPropagation()
    const captureTarget = event.target as (EventTarget & {
      releasePointerCapture(pointerId: number): void
    }) | null
    captureTarget?.releasePointerCapture(event.pointerId)

    if (maximumMovement.current < CLICK_THRESHOLD) {
      beginBurst()
      return
    }

    velocity.current
      .copy(REST_POSITION)
      .addScaledVector(position.current, -1)
      .multiplyScalar(LAUNCH_POWER)
    bounceSquash.current = -0.2
    settleTime.current = 0
    setMode('flying')
  }

  const handlePointerCancel = () => {
    if (mode !== 'dragging') return
    resetAtCenter()
    setPreviewPosition(REST_POSITION.clone())
    setMode('idle')
  }

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 1 / 30)
    const group = potatoGroup.current

    if (mode === 'flying') {
      velocity.current.y -= GRAVITY * delta
      velocity.current.multiplyScalar(Math.pow(0.998, delta * 60))
      position.current.addScaledVector(velocity.current, delta)

      if (position.current.y <= FLOOR_Y + POTATO_RADIUS) {
        position.current.y = FLOOR_Y + POTATO_RADIUS

        if (velocity.current.y < 0) {
          const impact = Math.abs(velocity.current.y)
          velocity.current.y = impact * 0.46
          velocity.current.x *= 0.8
          velocity.current.z *= 0.8
          bounceSquash.current = Math.min(0.38, impact * 0.045)
        }

        velocity.current.x *= Math.pow(0.91, delta * 60)
        velocity.current.z *= Math.pow(0.91, delta * 60)

        if (velocity.current.length() < 0.48) {
          settleTime.current += delta
          velocity.current.multiplyScalar(0.8)
        } else {
          settleTime.current = 0
        }

        if (settleTime.current > 0.42) {
          respawnTimer.current = 0
          setMode('respawning')
        }
      }

      if (
        Math.abs(position.current.x) > 12 ||
        position.current.y < -5 ||
        Math.abs(position.current.z) > 8
      ) {
        resetAtCenter()
        respawnTimer.current = 0
        setMode('respawning')
      }
    }

    if (mode === 'bursting') burstTimer.current += delta

    if (mode === 'respawning') {
      respawnTimer.current += delta
      position.current.lerp(REST_POSITION, 1 - Math.pow(0.0005, delta))

      if (respawnTimer.current > 0.52) {
        resetAtCenter()
        setPreviewPosition(REST_POSITION.clone())
        setMode('idle')
      }
    }

    bounceSquash.current = THREE.MathUtils.damp(
      bounceSquash.current,
      0,
      8,
      delta,
    )

    if (group) {
      group.position.copy(position.current)
      group.visible = !(mode === 'bursting' && burstTimer.current > 0.16)

      let targetScaleX = 1
      let targetScaleY = 1

      if (mode === 'flying') {
        const stretch = Math.min(0.26, velocity.current.length() * 0.018)
        targetScaleX = 1 - stretch * 0.45
        targetScaleY = 1 + stretch
      }

      if (mode === 'bursting') {
        const pop = Math.min(1, burstTimer.current / 0.16)
        const scale = Math.max(0, 1 - pop * pop)
        targetScaleX = scale * (1 + pop * 0.35)
        targetScaleY = scale
      }

      if (mode === 'respawning') {
        const progress = Math.min(1, respawnTimer.current / 0.5)
        const overshoot = 1 + Math.sin(progress * Math.PI) * 0.22
        targetScaleX = progress * overshoot
        targetScaleY = progress * overshoot
      }

      targetScaleX += bounceSquash.current
      targetScaleY -= bounceSquash.current * 0.65

      group.scale.x = THREE.MathUtils.damp(
        group.scale.x,
        Math.max(0, targetScaleX),
        18,
        delta,
      )
      group.scale.y = THREE.MathUtils.damp(
        group.scale.y,
        Math.max(0, targetScaleY),
        18,
        delta,
      )
      group.scale.z = group.scale.x
      group.rotation.z = THREE.MathUtils.damp(
        group.rotation.z,
        mode === 'flying' ? -velocity.current.x * 0.018 : 0,
        8,
        delta,
      )
    }

    if (shadow.current) {
      shadow.current.position.x = position.current.x
      shadow.current.position.z = position.current.z - 0.08
      const height = Math.max(
        0,
        position.current.y - (FLOOR_Y + POTATO_RADIUS),
      )
      const shadowScale = THREE.MathUtils.clamp(1 - height * 0.12, 0.35, 1)
      shadow.current.scale.set(shadowScale, shadowScale, shadowScale)
      const material = shadow.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.17 * shadowScale
    }
  })

  const isPulled =
    mode === 'dragging' && maximumMovement.current >= CLICK_THRESHOLD

  return (
    <>
      <SceneEnvironment floorY={FLOOR_Y} shadowRef={shadow} />

      {isPulled && (
        <>
          <Line
            points={[REST_POSITION, previewPosition]}
            color="#6a352c"
            lineWidth={4}
            transparent
            opacity={0.8}
          />
          <mesh position={REST_POSITION}>
            <ringGeometry args={[0.1, 0.15, 24]} />
            <meshBasicMaterial
              color="#fff2bd"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <Trajectory pullPosition={previewPosition} />
        </>
      )}

      <group ref={potatoGroup} position={REST_POSITION}>
        <sprite
          scale={[2.05, 2.05, 1]}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          renderOrder={2}
        >
          <spriteMaterial
            map={potatoTexture}
            transparent
            alphaTest={0.08}
            depthWrite={false}
            toneMapped={false}
          />
        </sprite>
      </group>

      {burst && (
        <PotatoBurst
          key={burst.id}
          origin={burst.origin}
          texture={potatoTexture}
          onComplete={finishBurst}
        />
      )}
    </>
  )
}
