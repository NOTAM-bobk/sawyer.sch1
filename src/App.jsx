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
    "I think i am suposted to write something here... " +
    "idk what, so i am going to leave , " +
    "just scrool down.",
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
    { code: 'IG', label: 'Instagram', href: 'https://instagram.com/yourusername', icon: '/logos/instagram.jpeg' },
    { code: 'ST', label: 'Strava', href: 'https://www.strava.com/athletes/935277048', icon: '/logos/strava.jpeg' },
    { code: 'BS', label: 'Brawl Stars', href: 'https://brawlify.com/stats/profile/yourtag', icon: '/logos/brawl.jpeg' },
    { code: 'AN', label: 'Athletic.net', href: 'https://www.athletic.net/athlete/29503644/cross-country/all', icon: '/logos/athletic.jpeg' },
    { code: 'GM', label: 'Gmail', href: 'sawyer11456:you@gmail.com', icon: '/logos/gmail.jpeg' },
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
    name: 'Nexflix Clone',
    description: 'a working copy of nexflix, with live playback.',
    github: 'https://deephouse.vercel.app',
  },
  {
    name: 'Nimbus - Weather',
    description: 'A clean weather app',
    github: 'https://nimbus.edgeone.app/',
  },
  {
    name: 'Chat',
    description: 'a chat app with ai',
    github: 'https://chat11.edgeone.app',
  },
]

// Point this at your deployed Cloudflare Worker (see cloudflare-worker/README.md).
// Leave blank to hide the view counter.
const VIEW_COUNTER_URL = 'https://sawyer-view-counter.sawyerbobk563.workers.dev/view'

// Small ambient lines that occasionally type themselves out in the
// background, then fade away. Purely decorative. Add as many as you want —
// just drop another string in the array, nothing else to configure.
const QUOTES = [
  'small steps still count',
  'chase splits, not perfection',
  'code, run, repeat',
  'do it scared',
  'progress over perfect',
]
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

    const SPACING = window.innerWidth < 640 ? 22 : 29
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

// Small pill switch, fixed in the corner, that lets you turn the 3D
// companion off — handy on lower-end phones or if it's just in the way.
function FxToggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      className="fx-toggle"
      role="switch"
      aria-checked={enabled}
      aria-label="Toggle 3D companion"
      onClick={onToggle}
    >
      <span className="fx-toggle-label">3D</span>
      <span className="fx-toggle-track">
        <span className="fx-toggle-thumb" />
      </span>
    </button>
  )
}

// Small pill switch, fixed next to the 3D toggle, that plays/pauses a
// looping background track. Expects the file at /public/song.mp3 — the
// <audio> element just points at "/song.mp3", so drop the file in the
// project's public/ folder and it's picked up automatically.
//
// Browsers block audio.play() until a real user gesture happens, so this
// also listens for the page's first click/tap/keypress (anywhere, not
// just the button) and starts the track then, easing the volume in
// rather than snapping to full volume. If that first attempt is blocked
// for some reason, it just waits for the next interaction and tries again.
function SoundToggle() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    let started = false
    let fadeTimer = null

    function fadeIn() {
      audio.volume = 0
      let v = 0
      fadeTimer = setInterval(() => {
        v += 0.08
        if (v >= 1) {
          audio.volume = 1
          clearInterval(fadeTimer)
        } else {
          audio.volume = v
        }
      }, 60)
    }

    function tryAutoStart() {
      if (started) return
      started = true
      audio
        .play()
        .then(() => {
          fadeIn()
          setPlaying(true)
          removeListeners()
        })
        .catch(() => {
          // Blocked — allow the next interaction to try again.
          started = false
        })
    }

    function removeListeners() {
      window.removeEventListener('pointerdown', tryAutoStart)
      window.removeEventListener('keydown', tryAutoStart)
      window.removeEventListener('touchstart', tryAutoStart)
    }

    window.addEventListener('pointerdown', tryAutoStart)
    window.addEventListener('keydown', tryAutoStart)
    window.addEventListener('touchstart', tryAutoStart, { passive: true })

    return () => {
      clearInterval(fadeTimer)
      removeListeners()
    }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.volume = 1
      audio.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/song.mp3" loop preload="auto" />
      <button
        type="button"
        className="sound-toggle"
        role="switch"
        aria-checked={playing}
        aria-label="Toggle background music"
        onClick={toggle}
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="sound-toggle-label">SOUND</span>
        <span className="sound-toggle-track">
          <span className="sound-toggle-thumb" />
        </span>
      </button>
    </>
  )
}

// Ambient background text: every so often it types out a short line, holds
// it for a beat, then fades away. Sits behind the content and never
// captures clicks.
function QuoteWhisper({ quotes }) {
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('idle') // idle | typing | holding | fading

  useEffect(() => {
    if (!quotes || quotes.length === 0) return
    let cancelled = false
    let typeTimer = null
    let phaseTimer = null

    function runCycle() {
      if (cancelled) return
      const quote = quotes[Math.floor(Math.random() * quotes.length)]
      setPhase('typing')
      setText('')
      let i = 0
      typeTimer = setInterval(() => {
        if (cancelled) return
        i += 1
        setText(quote.slice(0, i))
        if (i >= quote.length) {
          clearInterval(typeTimer)
          setPhase('holding')
          phaseTimer = setTimeout(() => {
            if (cancelled) return
            setPhase('fading')
            phaseTimer = setTimeout(() => {
              if (cancelled) return
              setPhase('idle')
              setText('')
              // Not that often — next line shows up in ~18-32s.
              phaseTimer = setTimeout(runCycle, 18000 + Math.random() * 14000)
            }, 900)
          }, 2600)
        }
      }, 45)
    }

    phaseTimer = setTimeout(runCycle, 6000 + Math.random() * 6000)

    return () => {
      cancelled = true
      clearInterval(typeTimer)
      clearTimeout(phaseTimer)
    }
  }, [quotes])

  if (phase === 'idle' || !text) return null

  return (
    <div className={`quote-whisper quote-whisper-${phase}`} aria-hidden="true">
      {text}
    </div>
  )
}

// A loose, hand-drawn squiggle. Used as an underline / divider accent.
function DoodleSquiggle({ className = '' }) {
  return (
    <svg
      className={`doodle doodle-squiggle ${className}`}
      viewBox="0 0 160 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 14C14 4 22 18 34 9C46 0 54 17 66 8C78 -1 86 16 98 7C110 -2 118 15 130 7C138 1 144 10 158 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// A loose, hand-drawn smiley face.
function DoodleSmiley({ className = '' }) {
  return (
    <svg
      className={`doodle doodle-smiley ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="14.5" cy="17" r="1.6" fill="currentColor" />
      <circle cx="25.5" cy="17" r="1.6" fill="currentColor" />
      <path
        d="M12.5 24C15 28.5 25 28.5 27.5 24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// A loose, hand-drawn circle that "draws itself" around the name once the
// skeleton loader finishes, then fades away a couple seconds later.
// Purely decorative, aria-hidden.
function NameCircleDoodle({ trigger }) {
  const [phase, setPhase] = useState('idle') // idle | drawing | gone

  useEffect(() => {
    if (!trigger) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setPhase('drawing')
    const t = setTimeout(() => setPhase('gone'), 3200)
    return () => clearTimeout(t)
  }, [trigger])

  if (phase === 'idle') return null

  return (
    <svg
      className={`doodle name-circle ${phase === 'gone' ? 'is-gone' : ''}`}
      viewBox="0 0 340 160"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 90C22 48 70 18 150 14C230 10 308 34 316 78C324 124 268 148 172 150C78 152 20 132 30 90Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// A couple of loose, hand-drawn curved arrows nudging the visitor to
// keep scrolling.
function ScrollDoodleArrow({ className = '' }) {
  return (
    <svg
      className={`doodle scroll-arrow ${className}`}
      viewBox="0 0 60 96"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 4C21 22 41 34 28 50"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M14 40C19 46 24 50 28 54C33 49 38 45 44 41"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 62C19 68 24 72 28 76C33 71 38 67 44 63"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Solid little card that pulls a random joke from the official-joke-api
// and lets the visitor fetch another one on demand.
function JokeOfTheDay() {
  const [joke, setJoke] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function fetchJoke() {
    setLoading(true)
    setError(false)
    fetch('https://official-joke-api.appspot.com/random_joke')
      .then((res) => res.json())
      .then((data) => setJoke(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJoke()
  }, [])

  return (
    <div className="joke-box">
      <span className="joke-box-label">Joke of the day</span>

      {loading && <p className="joke-box-text joke-box-loading">Loading a joke…</p>}
      {!loading && error && (
        <p className="joke-box-text">Couldn't load a joke — try again.</p>
      )}
      {!loading && !error && joke && (
        <>
          <p className="joke-box-text">{joke.setup}</p>
          <p className="joke-box-punchline">{joke.punchline}</p>
        </>
      )}

      <button type="button" className="joke-box-button" onClick={fetchJoke} disabled={loading}>
        New joke
      </button>
    </div>
  )
}

// Fades a section up into place the first time it scrolls into view.
// IntersectionObserver-based (never a scroll listener) per the site's
// motion guidelines.
function Reveal({ children, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-visible' : ''} ${className}`} {...rest}>
      {children}
    </Tag>
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

// Shown until the custom typefaces (Archivo, Archivo Black, JetBrains
// Mono) finish loading, so visitors get a placeholder shape of the page
// instead of a flash of fallback-font text that then jumps around once
// the real fonts swap in. Fades out once fonts are ready, revealing the
// real content already mid-entrance-animation underneath.
function PageSkeleton({ leaving }) {
  return (
    <div className={`page-skeleton ${leaving ? 'is-leaving' : ''}`} aria-hidden="true">
      <div className="page-skeleton-inner">
        <div className="skeleton-pill skeleton-pulse" />
        <div className="skeleton-line title skeleton-pulse" />
        <div className="skeleton-line title skeleton-pulse" style={{ width: '55%' }} />
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line short skeleton-pulse" />
        <div className="skeleton-row">
          <div className="skeleton-pulse" />
          <div className="skeleton-pulse" />
          <div className="skeleton-pulse" />
          <div className="skeleton-pulse" />
        </div>
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line skeleton-pulse" />
        <div className="skeleton-line short skeleton-pulse" />
      </div>
    </div>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-text">
        Built and designed by Sawyer. By viewing this page you agree to the terms and service.
      </p>
      <nav className="footer-links" aria-label="Quick links">
        <a className="footer-link" href="#" target="_blank" rel="noreferrer">
          Terms and Conditions
        </a>
        <span className="footer-link-sep" aria-hidden="true">·</span>
        <a className="footer-link" href="#" target="_blank" rel="noreferrer">
          Source Code
        </a>
      </nav>
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
  const [show3D, setShow3D] = useState(true)
  const [fontsReady, setFontsReady] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const commentsState = useComments()
  const interactiveRef = useRef(null)

  // Wait for the custom webfonts before showing text content, so nothing
  // renders in a fallback font and then jumps when Archivo/Archivo Black
  // swap in. Falls back to a fixed timeout if the Font Loading API isn't
  // available or just never resolves.
  useEffect(() => {
    let cancelled = false
    const fallback = setTimeout(() => {
      if (!cancelled) setFontsReady(true)
    }, 1500)

    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setFontsReady(true)
      })
    } else {
      setFontsReady(true)
    }

    return () => {
      cancelled = true
      clearTimeout(fallback)
    }
  }, [])

  // Keep the skeleton mounted a beat longer than fontsReady so its
  // fade-out transition has time to play over the top of the real
  // content, which is already mounted and animating in underneath it.
  useEffect(() => {
    if (!fontsReady) return
    const t = setTimeout(() => setShowSkeleton(false), 420)
    return () => clearTimeout(t)
  }, [fontsReady])


  // Mobile fix: background effects like the 3D companion or the dot grid
  // can attach their own touch listeners to the window to support drag
  // gestures, and those can swallow a tap before the browser gets around to
  // opening the keyboard for a real input. Stopping propagation right where
  // the touch actually lands on an interactive element (inputs, buttons,
  // links) keeps it from ever reaching those global listeners, without
  // touching how the effects themselves work.
  useEffect(() => {
    const node = interactiveRef.current
    if (!node) return
    function stopIfInteractive(e) {
      if (e.target.closest('input, textarea, button, a, select, label')) {
        e.stopPropagation()
      }
    }
    node.addEventListener('touchstart', stopIfInteractive, { capture: true, passive: true })
    node.addEventListener('pointerdown', stopIfInteractive, { capture: true })
    return () => {
      node.removeEventListener('touchstart', stopIfInteractive, { capture: true })
      node.removeEventListener('pointerdown', stopIfInteractive, { capture: true })
    }
  }, [])

  return (
    <div className="page">
      <DotGrid />
      <CustomCursor />
      {show3D && <AnimalCompanion />}

      {showSkeleton && <PageSkeleton leaving={fontsReady} />}

      {fontsReady && (
        <>
          <StickyClock />
          <QuoteWhisper quotes={QUOTES} />

          <span className="corner corner-tl">+</span>
          <span className="corner corner-tr">+</span>

          <ViewCounter />
          <div className="fx-controls">
            <SoundToggle />
            <FxToggle enabled={show3D} onToggle={() => setShow3D((v) => !v)} />
          </div>

          <main className="content" ref={interactiveRef}>
            <header className="eyebrow-row">
              <span className="eyebrow">{PROFILE.schools}</span>
            </header>

            <Reveal as="section" className="hero">
              <h1 className="headline">
                <span className="headline-lead">
                  Welcome, I'm
                  <span className="headline-photo-box">
                    <img src="/boxsawyer.png" alt="" className="headline-photo" />
                  </span>
                </span>
                <span className="headline-name">
                  {PROFILE.name}.
                  <NameCircleDoodle trigger={fontsReady} />
                </span>
                <DoodleSquiggle className="headline-squiggle" />
              </h1>
              <p className="bio">{PROFILE.bio}</p>
              <ScrollDoodleArrow className="hero-scroll-arrow" />
            </Reveal>

            <Reveal as="section" className="stats" aria-label="Stats">
              {PROFILE.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </Reveal>

            <Reveal as="section" className="links" aria-label="Social links">
              <p className="links-intro">
                Follow me. <span className="links-intro-soft">or not</span>
                <DoodleSmiley className="links-intro-smiley" />
              </p>
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
            </Reveal>

            <Reveal as="div">
              <CommentsSection state={commentsState} onViewAll={() => setActivePanel('comments')} />
            </Reveal>

            <Reveal as="div">
              <DoodleSquiggle className="cta-squiggle" />
              <section className="cta-row" aria-label="More">
                <button className="cta-button" onClick={() => setActivePanel('races')}>
                  Challenges
                </button>
                <button className="cta-button" onClick={() => setActivePanel('projects')}>
                  Projects
                </button>
              </section>
              <JokeOfTheDay />
            </Reveal>

            <SiteFooter />
          </main>

          <Overlay type={activePanel} onClose={() => setActivePanel(null)} commentsState={commentsState} />
        </>
      )}
    </div>
  )
}
