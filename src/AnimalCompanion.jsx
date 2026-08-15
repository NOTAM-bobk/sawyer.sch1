import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { AnimationMixer, LoopRepeat } from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

// ---------------------------------------------------------------------------
// Drop your two animation exports here:
//   /public/models/running.fbx
//   /public/models/low-crawl.fbx
// (rename "low crawl.fbx" -> "low-crawl.fbx" — no spaces in filenames served
// from /public, spaces get URL-encoded and are easy to typo)
//
// If either file is missing, the error boundary below just renders nothing
// — the rest of the page is unaffected.
// ---------------------------------------------------------------------------
const RUN_URL = '/models/running.fbx'
const CRAWL_URL = '/models/low-crawl.fbx'

// Mixamo-style exports are usually ~170 units tall — this scales it down
// into the small "roams around the page" range. Tweak to taste.
const MODEL_SCALE = 0.012

// World-space wander bounds (roughly maps to the visible viewport at the
// camera distance below — doesn't need to be pixel-perfect, it's decorative).
const BOUNDS_X = 6.5
const BOUNDS_Y = 3.2
const RESPAWN_MARGIN = 7.5 // how far off-bounds before we teleport back in
const WALK_SPEED = 1.6 // world units / second
const CURSOR_AVOID_RADIUS = 1.6 // how close the pointer has to get to spook it

function rand(min, max) {
  return min + Math.random() * (max - min)
}

function randomEdgeSpawn() {
  const edge = Math.floor(Math.random() * 4)
  const x = edge === 0 ? -BOUNDS_X - 1 : edge === 1 ? BOUNDS_X + 1 : rand(-BOUNDS_X, BOUNDS_X)
  const y = edge === 2 ? -BOUNDS_Y - 1 : edge === 3 ? BOUNDS_Y + 1 : rand(-BOUNDS_Y, BOUNDS_Y)
  return [x, y]
}

function randomTarget() {
  return [rand(-BOUNDS_X, BOUNDS_X), rand(-BOUNDS_Y, BOUNDS_Y)]
}

// Tracks the mouse/touch position in the same world-space range the animal
// wanders in, so it can react to the visitor's cursor. This is a loose
// approximation (not a true screen->world projection), which is plenty
// convincing for a decorative element.
function usePointerWorld() {
  const pointer = useRef([9999, 9999]) // start far away = "no cursor nearby"

  useEffect(() => {
    function handleMove(clientX, clientY) {
      const nx = (clientX / window.innerWidth) * 2 - 1
      const ny = -((clientY / window.innerHeight) * 2 - 1)
      pointer.current = [nx * BOUNDS_X, ny * BOUNDS_Y]
    }
    function onMouse(e) {
      handleMove(e.clientX, e.clientY)
    }
    function onTouch(e) {
      if (e.touches?.[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])

  return pointer
}

// Loads one FBX export and plays its first animation clip on mount.
function AnimatedModel({ url, groupRef }) {
  const fbx = useLoader(FBXLoader, url)
  const mixerRef = useRef(null)

  useEffect(() => {
    if (!fbx.animations?.length) return
    const mixer = new AnimationMixer(fbx)
    const action = mixer.clipAction(fbx.animations[0])
    action.setLoop(LoopRepeat)
    action.play()
    mixerRef.current = mixer
    return () => mixer.stopAllAction()
  }, [fbx])

  useFrame((_, delta) => {
    mixerRef.current?.update(delta)
  })

  return <primitive ref={groupRef} object={fbx} scale={MODEL_SCALE} />
}

function Wanderer() {
  const groupRef = useRef(null)
  const pos = useRef(randomEdgeSpawn())
  const target = useRef(randomTarget())
  const [mode, setMode] = useState('running') // 'running' | 'crawling'
  const pointer = usePointerWorld()

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    const [px, py] = pos.current
    const [ptx, pty] = pointer.current
    const distToCursor = Math.hypot(ptx - px, pty - py)

    // If the cursor gets close, flee toward the opposite side instead of
    // whatever the current target was — gives the illusion of noticing you.
    if (distToCursor < CURSOR_AVOID_RADIUS) {
      const away = Math.atan2(py - pty, px - ptx)
      target.current = [
        Math.max(-BOUNDS_X, Math.min(BOUNDS_X, px + Math.cos(away) * 4)),
        Math.max(-BOUNDS_Y, Math.min(BOUNDS_Y, py + Math.sin(away) * 4)),
      ]
      if (mode !== 'running') setMode('running')
    }

    const [tx, ty] = target.current
    const dx = tx - px
    const dy = ty - py
    const dist = Math.hypot(dx, dy)

    if (dist < 0.3) {
      target.current = randomTarget()
      if (Math.random() < 0.35) setMode((m) => (m === 'running' ? 'crawling' : 'running'))
    } else {
      const speed = mode === 'crawling' ? WALK_SPEED * 0.4 : WALK_SPEED
      const step = Math.min(speed * delta, dist)
      pos.current = [px + (dx / dist) * step, py + (dy / dist) * step]
      g.rotation.y = Math.atan2(dx, dy) // face direction of travel
    }

    const [cx, cy] = pos.current
    if (Math.abs(cx) > RESPAWN_MARGIN || Math.abs(cy) > RESPAWN_MARGIN) {
      pos.current = randomEdgeSpawn()
      target.current = randomTarget()
    }

    g.position.set(pos.current[0], pos.current[1], 0)
  })

  const url = mode === 'crawling' ? CRAWL_URL : RUN_URL

  // key={mode} forces a clean remount when switching FBX files, so the new
  // clip starts fresh instead of trying to blend two different skeletons.
  return <AnimatedModel key={mode} url={url} groupRef={groupRef} />
}

// Missing /models/*.fbx files throw inside useLoader's suspense — this
// catches that so it never takes down the rest of the page.
class AnimalErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function AnimalCompanion() {
  return (
    <div className="animal-companion" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 1.5, 10], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} />
        <AnimalErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Wanderer />
          </Suspense>
        </AnimalErrorBoundary>
      </Canvas>
    </div>
  )
}
