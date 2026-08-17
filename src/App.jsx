import { useEffect, useMemo, useRef, useState } from 'react'
import CommentsSection, { CommentList, useComments } from './CommentsSection.jsx'
import AnimalCompanion from './AnimalCompanion.jsx'

// ---------------------------------------------------------------------------
// Edit this block to make the page yours. Everything below reads from here.
// ---------------------------------------------------------------------------
const PROFILE = {
  name: 'Sawyer',
  schools: 'Yinghua Academy > Minnetonka High School 2029',
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
    { code: 'IG', label: 'Instagram', href: 'https://www.instagram.com/sawyer.sch1/', icon: '/logos/instagram.jpeg' },
    { code: 'ST', label: 'Strava', href: 'https://www.strava.com/athletes/935277048', icon: '/logos/strava.jpeg' },
    { code: 'BS', label: 'Brawl Stars', href: 'https://brawlace.com/players/%232GG8JC002R', icon: '/logos/brawl.jpeg' },
    { code: 'AN', label: 'Athletic.net', href: 'https://www.athletic.net/athlete/29503644/cross-country/all', icon: '/logos/athletic.jpeg' },
    { code: 'GM', label: 'Gmail', href: 'sawyer11456:you@gmail.com', icon: '/logos/gmail.jpeg' },
  ],
}

// Challenges — this is the part you'll edit most.
// To add a new one, just copy a line and change the values:
//   { name: 'Challenge name', date: 'Mar 14', completed: false, strava: '' }
// - name: shows on the card
// - date: optional — leave as '' to hide it
// - completed: true moves it to the top with a checkmark
// - strava: optional Strava activity link shown as "proof" once completed
const CHALLENGES = [
  { name: '101 Mile Bike', date: '', completed: false, strava: '' },
  { name: '12 mile walk', date: '', completed: true, strava: '' },
  { name: 'triathon', date: '', completed: false, strava: '' },
  { name: '5K Around a Block', date: '', completed: false, strava: '' },
  { name: '5K Around a Tree', date: '', completed: false, strava: '' },
]

// GitHub username the live stats + projects list are pulled from.
// Change this one value and everything below (contribution count,
// repo count, the auto-fetched projects list) updates with it.
const GITHUB_USERNAME = 'NOTAM-bobk'

// Point this at your deployed Cloudflare Worker (see cloudflare-worker/README.md).
// Leave blank to hide the view counter.
const VIEW_COUNTER_URL = 'https://sawyer-view-counter.sawyerbobk563.workers.dev/view'

// Small ambient lines that occasionally type themselves out in the
// background, then fade away. Purely decorative. Add as many as you want —
// just drop another string in the array, nothing else to configure.
const QUOTES = [
  'better luck next time .. :(',
  'Nolan can read this',
  'why not,,.',
  'D1 vibe coder',
  'niko schultz fan',
  'do it scared',
  'progress over perfect',
]

// Scrolling strip of languages/tools shown under the GitHub stats. Drop a
// matching image in /public/languages/ (any square-ish icon works — svg,
// png, whatever) and add a line here. Remove a line to drop one. Nothing
// else needs to change — the strip just loops through whatever's in this
// array.
const LANGUAGES = [
  { name: 'JavaScript', icon: '/languages/javascript.png' },
  { name: 'TypeScript', icon: '/languages/typescript.png' },
  { name: 'Python', icon: '/languages/python.png' },
  { name: 'React', icon: '/languages/react.png' },
  { name: 'HTML', icon: '/languages/html.png' },
  { name: 'CSS', icon: '/languages/css.png' },
  { name: 'Node.js', icon: '/languages/nodejs.png' },
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
    // Slow parallax: the grid drifts a little as the page scrolls, at a
    // fraction of the real scroll speed, so it reads as sitting further
    // back than the content scrolling over it.
    const PARALLAX_FACTOR = 0.06
    let scrollY = window.scrollY || 0

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
        const parallaxOffset = (scrollY * PARALLAX_FACTOR) % SPACING
        const y = d.oy + d.dy - parallaxOffset
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
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(buildGrid, 120)
    }
    let resizeTimer = null

    function handleScroll() {
      scrollY = window.scrollY || 0
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else {
        raf = requestAnimationFrame(step)
      }
    }

    buildGrid()
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('mouseleave', handleLeave)
    window.addEventListener('click', handleClick)
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('mouseleave', handleLeave)
      window.removeEventListener('click', handleClick)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return <canvas ref={canvasRef} className="dot-grid" aria-hidden="true" />
}

// Animates a number counting up from 0 to `target` once `start` flips true.
// Eased so it starts fast and settles in, like an odometer. Respects
// prefers-reduced-motion by jumping straight to the final value.
function useCountUp(target, { duration = 1400, start = false } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start || target == null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    let raf
    const startTime = performance.now()
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, start, duration])

  return value
}

// Turns a "m:ss" string like "4:28" into total seconds, or null if the
// string isn't in that shape (e.g. the "??" marathon placeholder).
function parseClockValue(str) {
  const match = /^(\d{1,3}):(\d{2})$/.exec(String(str).trim())
  if (!match) return null
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10)
}

function formatClockValue(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.max(0, Math.round(totalSeconds % 60))
  return `${mins}:${String(secs).padStart(2, '0')}`
}

// Plays each top stat as a countdown once `start` flips true: it opens on
// a padded, higher number and counts down to the real time, fast at
// first and then easing into a crawl right as it settles on the real
// value — like a stopwatch winding down. Values that aren't in "m:ss"
// shape (the "??" marathon placeholder) are left untouched.
function useCountdownStat(target, { start = false, duration = 1900 } = {}) {
  const targetSeconds = parseClockValue(target)
  const [display, setDisplay] = useState(target)

  useEffect(() => {
    if (!start || targetSeconds == null) {
      setDisplay(target)
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(target)
      return
    }
    const startSeconds = targetSeconds * 1.6 + 20
    let raf
    const startTime = performance.now()
    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // fast start, slows near the end
      const current = startSeconds - (startSeconds - targetSeconds) * eased
      setDisplay(progress < 1 ? formatClockValue(current) : target)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, targetSeconds, start, duration])

  return display
}

function CountdownStat({ value, label, start }) {
  const display = useCountdownStat(value, { start })
  return (
    <div className="stat">
      <span className="stat-value">{display}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

// Wraps PROFILE.stats, watches for the row scrolling into view, and kicks
// off every CountdownStat's countdown at once.
function StatsRow({ stats }) {
  const [started, setStarted] = useState(false)
  const rowRef = useRef(null)

  useEffect(() => {
    const node = rowRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="stats" ref={rowRef} aria-label="Stats">
      {stats.map((s) => (
        <CountdownStat key={s.label} value={s.value} label={s.label} start={started} />
      ))}
    </div>
  )
}

// Live GitHub stats — lifetime contributions and public repo count for
// GITHUB_USERNAME. Repo count comes straight from the GitHub REST API
// (api.github.com/users/:user). Lifetime contributions aren't exposed by
// that API (it's normally rendered server-side on github.com), so this
// walks every year from the account's creation date to now and sums the
// yearly totals from the public github-contributions-api mirror. The
// numbers count up once this row scrolls into view.
function GitHubStats() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)
  const [started, setStarted] = useState(false)
  const rowRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const userRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`)
        if (!userRes.ok) throw new Error('user fetch failed')
        const user = await userRes.json()

        const joinYear = new Date(user.created_at).getFullYear()
        const currentYear = new Date().getFullYear()
        const years = []
        for (let y = joinYear; y <= currentYear; y++) years.push(y)

        const yearly = await Promise.all(
          years.map((y) =>
            fetch(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USERNAME}?y=${y}`)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null)
          )
        )

        const contributions = yearly.reduce((sum, yearData, i) => {
          if (!yearData || !yearData.total) return sum
          return sum + (yearData.total[years[i]] || 0)
        }, 0)

        if (!cancelled) {
          setData({ contributions, repos: user.public_repos || 0 })
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const node = rowRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStarted(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const contributions = useCountUp(data?.contributions ?? 0, { start: started && !!data })
  const repos = useCountUp(data?.repos ?? 0, { start: started && !!data })

  if (error) return null

  return (
    <div className="stats stats-github" ref={rowRef} aria-label="GitHub stats">
      <div className="stat">
        <span className="stat-value">{data ? contributions.toLocaleString() : '—'}</span>
        <span className="stat-label">LIFETIME CONTRIBUTIONS</span>
      </div>
      <div className="stat">
        <span className="stat-value">{data ? repos.toLocaleString() : '—'}</span>
        <span className="stat-label">REPOSITORIES</span>
      </div>
    </div>
  )
}

// A single icon in the language strip. Quietly disappears if its image
// hasn't been added to /public/languages/ yet, instead of showing a
// broken-image icon. Reports back to the carousel whenever it disappears
// so the strip can re-measure itself.
function LanguageIcon({ src, name, onSettle }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <span className="language-pill" title={name}>
      <img
        src={src}
        alt={name}
        className="language-pill-img"
        onError={() => {
          setFailed(true)
          // Losing an icon changes the width of the set, so re-measure
          // on the next tick once React has removed it from the layout.
          requestAnimationFrame(() => onSettle?.())
        }}
      />
    </span>
  )
}

// Endless-scrolling strip of language/tool icons, sat right under the
// GitHub stats. Rather than assuming a fixed number of copies loops
// seamlessly, this measures the real rendered width of one full set of
// icons plus the visible track width, then renders exactly as many
// copies as needed to always cover at least twice the viewport — so
// there's never a gap, no matter how many icons are in the list or how
// wide the screen is. It moves at a constant pixel-per-second pace (the
// animation duration scales with the measured width instead of being a
// fixed number of seconds) and it never pauses, even on hover.
const CAROUSEL_SPEED_PX_PER_SEC = 26

function LanguageCarousel({ languages }) {
  const containerRef = useRef(null)
  const setRef = useRef(null)
  const [repeat, setRepeat] = useState(2)
  const [setWidth, setSetWidth] = useState(0)

  function measure() {
    const setEl = setRef.current
    const containerEl = containerRef.current
    if (!setEl || !containerEl) return
    const width = setEl.getBoundingClientRect().width
    const containerWidth = containerEl.getBoundingClientRect().width
    if (width <= 0) return
    // Enough copies so the track always spans at least 2x the visible
    // width — the strip can never run out of icons before the loop
    // resets, so no blank space ever shows up mid-scroll.
    const needed = Math.max(2, Math.ceil((containerWidth * 2) / width) + 1)
    setSetWidth(width)
    setRepeat(needed)
  }

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languages])

  if (!languages || languages.length === 0) return null

  const duration = setWidth > 0 ? setWidth / CAROUSEL_SPEED_PX_PER_SEC : 24

  return (
    <div className="language-carousel" ref={containerRef} aria-label="Languages I use">
      <div
        className="language-carousel-track"
        style={{
          animationDuration: `${duration}s`,
          '--carousel-set-width': setWidth ? `${setWidth}px` : '50%',
        }}
      >
        {Array.from({ length: repeat }).map((_, copyIndex) => (
          <div
            className="language-carousel-set"
            key={copyIndex}
            ref={copyIndex === 0 ? setRef : undefined}
          >
            {languages.map((l, i) => (
              <LanguageIcon key={`${l.name}-${i}`} src={l.icon} name={l.name} onSettle={measure} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
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

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else {
        raf = requestAnimationFrame(loop)
      }
    }

    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)
    document.addEventListener('visibilitychange', handleVisibility)
    document.body.classList.add('cursor-none')

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
      document.removeEventListener('visibilitychange', handleVisibility)
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
              // Ambient, but a bit more frequent — next line shows up in ~11-20s.
              phaseTimer = setTimeout(runCycle, 11000 + Math.random() * 9000)
            }, 900)
          }, 2600)
        }
      }, 45)
    }

    phaseTimer = setTimeout(runCycle, 4000 + Math.random() * 4000)

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

// Hand-drawn underline that sits under "Follow me." and draws itself in
// the first time it scrolls into view — but ONLY if the visitor is
// scrolling down when it arrives. If they scroll back up to it later
// (having already passed it), it stays put once drawn; if they hit it
// by scrolling up before ever seeing it scrolling down, it waits.
function ScrollUnderline({ className = '' }) {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const lastYRef = useRef(0)
  const directionRef = useRef('down')

  useEffect(() => {
    lastYRef.current = window.scrollY || 0
    function onScroll() {
      const y = window.scrollY || 0
      if (y > lastYRef.current + 1) directionRef.current = 'down'
      else if (y < lastYRef.current - 1) directionRef.current = 'up'
      lastYRef.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && directionRef.current === 'down') {
            setActive(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.7 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <svg
      ref={ref}
      className={`doodle underline-doodle ${active ? 'is-active' : ''} ${className}`}
      viewBox="0 0 200 20"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        pathLength="1"
        d="M3 12C24 4 40 17 58 9C76 1 92 15 110 8C128 1 144 14 162 8C174 4 184 9 197 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
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

// Auto-fetches GITHUB_USERNAME's repos from the GitHub API, most recently
// updated first, and renders them as project cards. A sentinel div at the
// bottom is watched with an IntersectionObserver — scrolling it into view
// loads the next page, so the list keeps growing as the user scrolls.
function ProjectsList() {
  const PER_PAGE = 10
  const [repos, setRepos] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(false)
  const sentinelRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('repo fetch failed')
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setRepos((prev) => [...prev, ...data])
        if (!Array.isArray(data) || data.length < PER_PAGE) setDone(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || done || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setPage((p) => p + 1)
          }
        })
      },
      { rootMargin: '300px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [done, error])

  return (
    <>
      <div className="project-list">
        {repos.map((r) => (
          <a className="project-card" key={r.id} href={r.html_url} target="_blank" rel="noreferrer">
            <div className="project-head">
              <span className="project-name">{r.name}</span>
              <span className="project-arrow">↗</span>
            </div>
            <p className="project-desc">{r.description || 'No description yet.'}</p>
            <span className="project-link">
              {r.language ? `${r.language} · ` : ''}★ {r.stargazers_count} · github ↗
            </span>
          </a>
        ))}
      </div>

      {error && <p className="overlay-sub">Couldn't load repositories from GitHub right now.</p>}
      {!error && loading && <p className="overlay-sub project-list-status">Loading repos…</p>}
      {!error && !done && <div ref={sentinelRef} className="project-list-sentinel" aria-hidden="true" />}
      {!error && done && repos.length === 0 && !loading && (
        <p className="overlay-sub">No public repositories found.</p>
      )}
    </>
  )
}

// A small polaroid-style photo box. Drop the named file in /public and
// it shows up here; caption is optional.
function PhotoSticker({ src, caption, className = '' }) {
  return (
    <figure className={`photo-sticker ${className}`}>
      <img src={src} alt="" className="photo-sticker-img" />
      {caption && <figcaption className="photo-sticker-caption">{caption}</figcaption>}
    </figure>
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

// -----------------------------------------------------------------------
// Emoji rain — a one-time "you made it to the bottom" moment. A stack of
// emoji falls in from the top, spreads out until it fills the screen,
// holds there for a beat, then the whole stack falls away and the
// overlay unmounts itself.
// -----------------------------------------------------------------------
const RAIN_EMOJIS = ['🎉', '✨', '🙌', '🔥', '💯', '🎈', '🌟', '💫', '⭐️', '😄', '🙏', '👏']
const RAIN_COUNT = 42
// Matches the animation-duration in .emoji-rain-piece — fall in, hold,
// fall away — plus a little headroom before the overlay unmounts.
const RAIN_LIFETIME_MS = 3000

function EmojiRain({ active }) {
  // Re-rolled fresh only when the rain actually fires, so re-renders
  // while it's playing don't reshuffle everything mid-animation.
  const particles = useMemo(() => {
    if (!active) return []
    return Array.from({ length: RAIN_COUNT }, (_, i) => ({
      id: i,
      emoji: RAIN_EMOJIS[Math.floor(Math.random() * RAIN_EMOJIS.length)],
      left: Math.random() * 94 + 2,
      restY: Math.random() * 84 + 4,
      delay: Math.random() * 0.4,
      size: 18 + Math.random() * 20,
      rotate: Math.random() * 50 - 25,
    }))
  }, [active])

  if (!active) return null

  return (
    <>
      <div className="emoji-rain-backdrop" aria-hidden="true" />
      <div className="emoji-rain" aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.id}
            className="emoji-rain-piece"
            style={{
              left: `${p.left}vw`,
              '--rest-y': `${p.restY}vh`,
              '--rotate': `${p.rotate}deg`,
              animationDelay: `${p.delay}s`,
              fontSize: `${p.size}px`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>
    </>
  )
}

// Invisible tripwire placed at the very bottom of the page. Fires the
// emoji rain once, the first time it's scrolled into view.
function EmojiRainTrigger() {
  const ref = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setActive(false), RAIN_LIFETIME_MS)
    return () => clearTimeout(t)
  }, [active])

  return (
    <>
      <div ref={ref} className="emoji-rain-sentinel" aria-hidden="true" />
      <EmojiRain active={active} />
    </>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p className="site-footer-text">
       Built and Designed By "SAWYER INC CORP" By viewing this page you agree to the{' '}
        <a className="footer-link" href="https://www.gdprprivacynotice.com/sample-terms-conditions/" target="_blank" rel="noreferrer">
          terms and service
        </a>
        . <a className="footer-link" href="https://github.com/NOTAM-bobk/sawyer.sch1/tree/main" target="_blank" rel="noreferrer">
          Source code
        </a>
      </p>
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

  const lined = type === 'challenges' || type === 'projects'

  return (
    <div className={`overlay ${lined ? 'overlay-lined' : ''}`} role="dialog" aria-modal="true">
      <div className="overlay-bar">
        <button className="overlay-back" onClick={onClose}>
          <span aria-hidden="true">←</span> Back
        </button>
      </div>

      <div className="overlay-body">
        {type === 'challenges' && (
          <>
            <h2 className="overlay-title">Challenges</h2>
            <p className="overlay-sub">
              (just some)
            </p>
            <div className="challenge-grid">
              {[...CHALLENGES]
                .sort((a, b) => Number(b.completed) - Number(a.completed))
                .map((c) => (
                  <div className={`challenge-card ${c.completed ? 'is-completed' : ''}`} key={c.name}>
                    <div className="challenge-head">
                      <span className="challenge-name">{c.name}</span>
                      {c.completed && (
                        <span className="challenge-check" aria-hidden="true">✓</span>
                      )}
                    </div>
                    {c.date && <span className="challenge-date">{c.date}</span>}
                    {c.completed && c.strava && (
                      <a
                        className="challenge-strava"
                        href={c.strava}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Proof on Strava ↗
                      </a>
                    )}
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
            <p className="overlay-sub">Live from GitHub — most recently updated first. Scroll for more.</p>
            <ProjectsList />
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
            <FxToggle enabled={show3D} onToggle={() => setShow3D((v) => !v)} />
            <SoundToggle />
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

            <Reveal as="section">
              <p className="section-kicker">PRs</p>
              <StatsRow stats={PROFILE.stats} />
            </Reveal>

            <Reveal as="div" className="github-block">
              <p className="section-kicker">GitHub</p>
              <GitHubStats />
              <LanguageCarousel languages={LANGUAGES} />
            </Reveal>

            <Reveal as="section" className="links" aria-label="Social links">
              <DoodleSquiggle className="links-top-squiggle" />
              <p className="links-intro">
                <span className="links-intro-photo-box">
                  <img src="/sawyerstats.png" alt="" className="links-intro-photo" />
                </span>
                <span className="links-intro-text">
                  Follow me.
                  <ScrollUnderline />
                </span>
                <span className="links-intro-soft">or not</span>
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

            <Reveal as="div" className="comments-row">
              <CommentsSection state={commentsState} onViewAll={() => setActivePanel('comments')} />
            </Reveal>

            <Reveal as="div">
              <DoodleSquiggle className="cta-squiggle" />
              <section className="cta-row" aria-label="More">
                <button className="cta-button" onClick={() => setActivePanel('challenges')}>
                  <span>Challenges</span>
                  <span className="cta-button-arrow" aria-hidden="true">→</span>
                </button>
                <div className="cta-button-wrap">
                  <button className="cta-button" onClick={() => setActivePanel('projects')}>
                    <span>Projects</span>
                    <span className="cta-button-arrow" aria-hidden="true">→</span>
                  </button>
                  <PhotoSticker src="/sawyerprojects.png" className="photo-sticker-sm rotate-right cta-photo-badge" />
                </div>
              </section>
              <JokeOfTheDay />
              <a href="/resume.pdf" download className="resume-download">
                Download Résumé
              </a>
            </Reveal>

            <SiteFooter />
            <EmojiRainTrigger />
          </main>

          <Overlay type={activePanel} onClose={() => setActivePanel(null)} commentsState={commentsState} />
        </>
      )}
    </div>
  )
}
