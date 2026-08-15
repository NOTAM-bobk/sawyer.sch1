import { useEffect, useRef, useState } from 'react'
import CommentsSection, { CommentList, useComments } from './CommentsSection.jsx'
import AnimalCompanion from './AnimalCompanion.jsx'

// ---------------------------------------------------------------------------
// Edit this block to make the page yours. Everything below reads from here.
// ---------------------------------------------------------------------------
const PROFILE = {
  name: 'Sawyer',
  schools: 'Yinghua Academy > Minnetonka High School',
  bio:
    "I write code on weekdays and chase personal records on weekends. " +
    "Currently building things for the web, training for the next race, " +
    "and losing more Brawl Stars matches than I'd like to admit.",
  stats: [
    { value: '1:58', label: '800M' },
    { value: '4:28', label: '1609M' },
    { value: '17:00', label: '5K' },
    { value: '??', label: 'MARATHON' },
  ],
  // Drop matching image files in /public/logos/ — see README in that folder
  // for the exact filenames expected. If a file is missing, the bracket
  // code shows instead so nothing breaks.
  links: [
    { code: 'IG', label: 'Instagram', href: 'https://instagram.com/yourusername', icon: '/logos/instagram.svg' },
    { code: 'ST', label: 'Strava', href: 'https://strava.com/athletes/yourid', icon: '/logos/strava.svg' },
    { code: 'BS', label: 'Brawl Stars', href: 'https://brawlify.com/stats/profile/yourtag', icon: '/logos/brawlstars.svg' },
    { code: 'AN', label: 'Athletic.net', href: 'https://www.athletic.net/athlete/yourid', icon: '/logos/athleticnet.svg' },
    { code: 'GM', label: 'Gmail', href: 'mailto:you@gmail.com', icon: '/logos/gmail.svg' },
  ],
}

// Dummy data — swap for your real races and projects.
const RACES = [
  { name: 'Turkey Trot 5K', date: 'Nov 27' },
  { name: 'Frozen Foot 5K', date: 'Jan 10' },
  { name: 'Get Lucky 5K', date: 'Mar 14' },
  { name: 'Torchlight 5K', date: 'Jul 18' },
  { name: 'Red White & Boom 5K', date: 'Jul 4' },
  { name: 'Cross Country Classic 5K', date: 'Sep 5' },
]

const PROJECTS = [
  {
    name: 'Race Pace Calculator',
    description: 'A small tool that turns a goal finish time into mile and kilometer splits.',
    github: 'https://github.com/yourusername/race-pace-calculator',
  },
  {
    name: 'Strava Heatmap',
    description: 'Pulls route data from the Strava API and renders a heatmap of everywhere I have run.',
    github: 'https://github.com/yourusername/strava-heatmap',
  },
  {
    name: 'Training Log API',
    description: 'A lightweight backend for logging workouts, mileage, and splits over a season.',
    github: 'https://github.com/yourusername/training-log-api',
  },
]

// Point this at your deployed Cloudflare Worker (see cloudflare-worker/README.md).
// Leave blank to hide the view counter.
const VIEW_COUNTER_URL = 'https://sawyer-view-counter.sawyerbobk563.workers.dev/view'
// ---------------------------------------------------------------------------

function DotGrid() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let dots = []
    let ripples = []
    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    const pointer = { x: -9999, y: -9999, active: false }

    const SPACING = window.innerWidth < 640 ? 30 : 38
    const RADIUS = window.innerWidth < 640 ? 90 : 150
    const MAX_PUSH = 16

    function buildGrid() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      dots = []
      const cols = Math.ceil(width / SPACING) + 1
      const rows = Math.ceil(height / SPACING) + 1
      const offsetX = (width - (cols - 1) * SPACING) / 2
      const offsetY = (height - (rows - 1) * SPACING) / 2

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            ox: offsetX + c * SPACING,
            oy: offsetY + r * SPACING,
            dx: 0,
            dy: 0,
            heat: 0,
          })
        }
      }
    }

    function step() {
      ctx.clearRect(0, 0, width, height)
      const now = performance.now()

      ripples = ripples.filter((rp) => now - rp.t < 1100)

      for (const d of dots) {
        let heatTarget = 0
        if (pointer.active) {
          const dxp = d.ox - pointer.x
          const dyp = d.oy - pointer.y
          const dist = Math.sqrt(dxp * dxp + dyp * dyp)
          if (dist < RADIUS && dist > 0.001) {
            const strength = (1 - dist / RADIUS) * MAX_PUSH
            d.dx += (dxp / dist) * strength * 0.18
            d.dy += (dyp / dist) * strength * 0.18
            heatTarget = 1 - dist / RADIUS
          }
        }

        for (const rp of ripples) {
          const age = (now - rp.t) / 1000
          const waveR = age * 620
          const dxp = d.ox - rp.x
          const dyp = d.oy - rp.y
          const dist = Math.sqrt(dxp * dxp + dyp * dyp)
          const band = Math.abs(dist - waveR)
          if (band < 46) {
            const fall = 1 - age / 1.1
            const strength = (1 - band / 46) * 10 * Math.max(fall, 0)
            if (dist > 0.001) {
              d.dx += (dxp / dist) * strength
              d.dy += (dyp / dist) * strength
            }
            heatTarget = Math.max(heatTarget, (1 - band / 46) * Math.max(fall, 0))
          }
        }

        d.dx += (0 - d.dx) * 0.09
        d.dy += (0 - d.dy) * 0.09
        d.heat += (heatTarget - d.heat) * 0.12

        const x = d.ox + d.dx
        const y = d.oy + d.dy
        const size = 1.3 + d.heat * 1.6

        const inkR = 23, inkG = 20, inkB = 15
        const accR = 227, accG = 167, accB = 47
        const t = Math.min(d.heat, 1)
        const cr = inkR + (accR - inkR) * t
        const cg = inkG + (accG - inkG) * t
        const cb = inkB + (accB - inkB) * t
        const alpha = 0.16 + t * 0.55

        ctx.beginPath()
        ctx.fillStyle = `rgba(${cr | 0}, ${cg | 0}, ${cb | 0}, ${alpha})`
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(step)
    }

    let raf = requestAnimationFrame(step)

    function onMove(clientX, clientY) {
      pointer.x = clientX
      pointer.y = clientY
      pointer.active = true
    }
    function handleMouseMove(e) {
      onMove(e.clientX, e.clientY)
    }
    function handleTouchMove(e) {
      if (e.touches && e.touches[0]) {
        onMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }
    function handleLeave() {
      pointer.active = false
    }
    function handleClick(e) {
      ripples.push({ x: e.clientX, y: e.clientY, t: performance.now() })
    }
    function handleTouchStart(e) {
      if (e.touches && e.touches[0]) {
        const { clientX, clientY } = e.touches[0]
        onMove(clientX, clientY)
        ripples.push({ x: clientX, y: clientY, t: performance.now() })
      }
    }
    function handleResize() {
      buildGrid()
    }

    buildGrid()
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('mouseleave', handleLeave)
    window.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="dot-grid" aria-hidden="true" />
}

function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const dot = dotRef.current
    const ring = ringRef.current
    let ringX = -100, ringY = -100
    let targetX = -100, targetY = -100
    let raf

    function handleMove(e) {
      targetX = e.clientX
      targetY = e.clientY
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`
    }
    function handleDown() {
      ring.classList.add('is-active')
    }
    function handleUp() {
      ring.classList.remove('is-active')
    }

    function loop() {
      ringX += (targetX - ringX) * 0.18
      ringY += (targetY - ringY) * 0.18
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    loop()

    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)
    document.body.classList.add('cursor-none')

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
      document.body.classList.remove('cursor-none')
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  )
}

// Shows the real logo if it loads; falls back to the bracket code if the
// image hasn't been uploaded to /public/logos/ yet.
function LinkIcon({ src, code }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <span className="link-code">[{code}]</span>
  }

  return (
    <img
      src={src}
      alt=""
      className="link-icon"
      onError={() => setFailed(true)}
    />
  )
}

function ViewCounter() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!VIEW_COUNTER_URL) return
    let cancelled = false
    fetch(VIEW_COUNTER_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.views === 'number') setCount(data.views)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!VIEW_COUNTER_URL || count === null) return null

  return (
    <div className="view-counter" aria-label="Unique visitor count">
      <span className="view-dot" />
      {count.toLocaleString()} views
    </div>
  )
}

// Sticky bar pinned to the very top. It's translucent + blurred, so page
// content that scrolls up underneath it visibly blurs as it passes behind.
function StickyClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="sticky-clock" role="status" aria-label="Current time">
      <span className="sticky-clock-time">{time}</span>
      <span className="sticky-clock-date">{date}</span>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      Built and designed by Sawyer. By viewing this page you agree to the terms and service.
    </footer>
  )
}

function Overlay({ type, onClose, commentsState }) {
  useEffect(() => {
    if (!type) return
    document.body.style.overflow = 'hidden'
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [type, onClose])

  if (!type) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-bar">
        <button className="overlay-back" onClick={onClose}>
          <span aria-hidden="true">←</span> Back
        </button>
      </div>

      <div className="overlay-body">
        {type === 'races' && (
          <>
            <h2 className="overlay-title">Upcoming 5Ks</h2>
            <p className="overlay-sub">Placeholder races — swap RACES in App.jsx for the real schedule.</p>
            <div className="race-grid">
              {RACES.map((r) => (
                <div className="race-card" key={r.name}>
                  <span className="race-name">{r.name}</span>
                  <span className="race-date">{r.date}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {type === 'comments' && commentsState && (
          <>
            <h2 className="overlay-title">All comments</h2>
            <p className="overlay-sub">{commentsState.comments.length} comments</p>
            <CommentList
              comments={commentsState.comments}
              onLike={commentsState.likeComment}
              onReply={commentsState.replyToComment}
            />
          </>
        )}

        {type === 'projects' && (
          <>
            <h2 className="overlay-title">Projects</h2>
            <p className="overlay-sub">Placeholder projects — swap PROJECTS in App.jsx for the real list.</p>
            <div className="project-list">
              {PROJECTS.map((p) => (
                <a
                  className="project-card"
                  key={p.name}
                  href={p.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="project-head">
                    <span className="project-name">{p.name}</span>
                    <span className="project-arrow">↗</span>
                  </div>
                  <p className="project-desc">{p.description}</p>
                  <span className="project-link">github ↗</span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [activePanel, setActivePanel] = useState(null)
  const commentsState = useComments()

  return (
    <div className="page">
      <StickyClock />

      <DotGrid />
      <CustomCursor />
      <AnimalCompanion />

      <span className="corner corner-tl">+</span>
      <span className="corner corner-tr">+</span>
      <span className="corner corner-bl">+</span>
      <span className="corner corner-br">+</span>

      <ViewCounter />

      <main className="content">
        <header className="eyebrow-row">
          <span className="eyebrow">{PROFILE.schools}</span>
        </header>

        <section className="hero">
          <h1 className="headline">
            <span className="headline-lead">Welcome, I'm</span>
            <span className="headline-name">{PROFILE.name}.</span>
          </h1>
          <p className="bio">{PROFILE.bio}</p>
        </section>

        <section className="stats" aria-label="Stats">
          {PROFILE.stats.map((s) => (
            <div className="stat" key={s.label}>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </section>

        <section className="links" aria-label="Social links">
          {PROFILE.links.map((l) => (
            <a
              key={l.code}
              className="link-row"
              href={l.href}
              target={l.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
            >
              <LinkIcon src={l.icon} code={l.code} />
              <span className="link-label">{l.label}</span>
              <span className="link-arrow">↗</span>
            </a>
          ))}
        </section>

        <CommentsSection state={commentsState} onViewAll={() => setActivePanel('comments')} />

        <section className="cta-row" aria-label="More">
          <button className="cta-button" onClick={() => setActivePanel('races')}>
            5Ks Around Me
          </button>
          <button className="cta-button" onClick={() => setActivePanel('projects')}>
            Projects
          </button>
        </section>

        <SiteFooter />
      </main>

      <Overlay type={activePanel} onClose={() => setActivePanel(null)} commentsState={commentsState} />
    </div>
  )
}
