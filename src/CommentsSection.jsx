import { useEffect, useRef, useState } from 'react'

// Point this at your deployed Cloudflare Worker's /comments route (see
// cloudflare-worker/README.md). Leave blank to hide the whole feature.
export const COMMENTS_API_URL = 'https://sawyer-view-counter.sawyerbobk563.workers.dev/comments'

const VISIBLE_COUNT = 5

// Raw .lottie file for the little animation next to "Say hi" (same
// animation as before, just pointed at the file directly instead of
// lottie.host's /embed/ page — see EmojiWave below for why). Swap the
// URL here if you re-export or replace the animation on lottie.host.
const EMOJI_LOTTIE_SRC = 'https://lottie.host/007801a2-c03c-47ae-acbe-3d19fa7d13a0/AcwEYzWVLg.lottie'

// CDN build of the <dotlottie-wc> web component. Loaded on demand so we
// don't need an npm install step — just a script tag, injected once.
const DOTLOTTIE_WC_SRC = 'https://unpkg.com/@lottiefiles/dotlottie-wc@latest/dist/dotlottie-wc.js'

let dotlottieScriptPromise = null
function loadDotlottieScript() {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.customElements && window.customElements.get('dotlottie-wc')) return Promise.resolve()
  if (!dotlottieScriptPromise) {
    dotlottieScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = DOTLOTTIE_WC_SRC
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return dotlottieScriptPromise
}

// Small looping animation that sits right next to the "Say hi" heading.
// Previously an iframe pointed at lottie.host's /embed/ page — that page
// renders its own background (which recently started showing white
// instead of transparent) and there's no way to override it from the
// outside since it's a separate document. Loading the .lottie file
// directly through the <dotlottie-wc> web component instead renders
// straight onto a canvas we control, which is transparent by default.
function EmojiWave() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadDotlottieScript()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return <span className="comments-heading-lottie" aria-hidden="true" />
  }

  return (
    <dotlottie-wc
      className="comments-heading-lottie"
      src={EMOJI_LOTTIE_SRC}
      autoplay
      loop
      aria-hidden="true"
    />
  )
}

// Small hand-drawn squiggle that sits directly above "Say hi" — mirrors
// the one above "Follow me." on the main page so both section headings
// share the same "squiggle, then heading" rhythm. Kept as a local copy
// for the same reason as HeadingUnderline (see below).
function HeadingSquiggle({ className = '' }) {
  return (
    <svg
      className={`doodle comments-heading-squiggle ${className}`}
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

// Hand-drawn underline that draws itself under "Say hi" — same effect
// as the one under "Follow me." on the main page (kept as a local copy
// here rather than a shared import, since App.jsx already imports this
// file and a reverse import would create a circular dependency). Only
// draws in the first time it scrolls into view while scrolling DOWN.
function HeadingUnderline({ className = '' }) {
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

function timeAgo(ts) {
  const seconds = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  const units = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ]
  for (const [label, secs] of units) {
    const val = Math.floor(seconds / secs)
    if (val >= 1) return `${val}${label} ago`
  }
  return 'just now'
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Request failed')
  return res.json()
}

function shareComment(comment) {
  const text = `"${comment.message}" — ${comment.name}`
  if (navigator.share) {
    navigator.share({ text, url: window.location.href }).catch(() => {})
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text} ${window.location.href}`).catch(() => {})
  }
}

// -----------------------------------------------------------------------
// Shared state — lifted so both the inline preview (bottom of the page)
// and the "view all" full-screen overlay read/write the same data.
// -----------------------------------------------------------------------
export function useComments() {
  const [comments, setComments] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!COMMENTS_API_URL) return
    let cancelled = false
    fetch(COMMENTS_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.comments)) setComments(data.comments)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [])

  async function addComment(name, message) {
    const { comment } = await postJson(COMMENTS_API_URL, { name, message })
    setComments((prev) => [comment, ...prev])
  }

  async function likeComment(id) {
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: (c.likes || 0) + 1 } : c)))
    try {
      await postJson(`${COMMENTS_API_URL}/${id}/like`, {})
    } catch {
      // optimistic update stays even if the network call fails
    }
  }

  async function replyToComment(id, name, message) {
    const { comment } = await postJson(`${COMMENTS_API_URL}/${id}/reply`, { name, message })
    setComments((prev) => prev.map((c) => (c.id === id ? comment : c)))
  }

  const sorted = [...comments].sort((a, b) => b.createdAt - a.createdAt)

  return { comments: sorted, loaded, addComment, likeComment, replyToComment }
}

// -----------------------------------------------------------------------
// UI pieces
// -----------------------------------------------------------------------
function CommentComposer({ onSubmit, placeholder = 'Say something…', compact }) {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !message.trim() || sending) return
    setSending(true)
    try {
      await onSubmit(name.trim(), message.trim())
      setMessage('')
      if (!compact) setName('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form className={compact ? 'reply-form' : 'comment-form'} onSubmit={handleSubmit}>
      {!compact && (
        <input
          className="comment-input comment-input-name"
          type="text"
          placeholder="Your name"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}
      <div className="comment-form-row">
        <input
          className="comment-input comment-input-message"
          type="text"
          placeholder={placeholder}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="comment-send"
          type="submit"
          disabled={!message.trim() || (!compact && !name.trim()) || sending}
        >
          Send
        </button>
      </div>
    </form>
  )
}

function CommentItem({ comment, onLike, onReply }) {
  const [replying, setReplying] = useState(false)

  return (
    <div className="comment-item">
      <div className="comment-head">
        <span className="comment-name">{comment.name}</span>
        <span className="comment-time">{timeAgo(comment.createdAt)}</span>
      </div>
      <p className="comment-message">{comment.message}</p>
      <div className="comment-actions">
        <button className="comment-action" onClick={() => onLike(comment.id)}>
          ♥ {comment.likes || 0}
        </button>
        <button className="comment-action" onClick={() => setReplying((r) => !r)}>
          reply
        </button>
        <button className="comment-action" onClick={() => shareComment(comment)}>
          share ↗
        </button>
      </div>

      {comment.replies?.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((r) => (
            <div className="comment-reply" key={r.id}>
              <span className="comment-name">{r.name}</span>
              <span className="comment-message">{r.message}</span>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <CommentComposer
          compact
          placeholder={`Reply to ${comment.name}…`}
          onSubmit={async (name, message) => {
            await onReply(comment.id, name, message)
            setReplying(false)
          }}
        />
      )}
    </div>
  )
}

// Used both inline (sliced to 5) and in the full-screen overlay (all of them).
export function CommentList({ comments, onLike, onReply }) {
  if (comments.length === 0) {
    return <p className="comment-empty">No comments yet — be the first.</p>
  }
  return (
    <div className="comment-list">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} onLike={onLike} onReply={onReply} />
      ))}
    </div>
  )
}

// Inline preview: composer + 5 most recent + "view all" trigger.
export default function CommentsSection({ state, onViewAll }) {
  if (!COMMENTS_API_URL) return null
  const { comments, loaded, addComment, likeComment, replyToComment } = state
  const visible = comments.slice(0, VISIBLE_COUNT)

  return (
    <section className="comments-section" aria-label="Comments">
      <HeadingSquiggle />
      <h2 className="comments-heading">
        <span className="comments-heading-photo-box">
          <img src="/sawyerhi.png" alt="" className="comments-heading-photo" />
        </span>
        <span className="comments-heading-text">
          Say hi
          <HeadingUnderline />
        </span>
        <EmojiWave />
      </h2>

      <CommentComposer onSubmit={addComment} />

      {loaded && <CommentList comments={visible} onLike={likeComment} onReply={replyToComment} />}

      {comments.length > VISIBLE_COUNT && (
        <button className="comments-view-all" onClick={onViewAll}>
          View all {comments.length} comments ↗
        </button>
      )}
    </section>
  )
}
