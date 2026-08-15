import { useEffect, useState } from 'react'

// Point this at your deployed Cloudflare Worker's /comments route (see
// cloudflare-worker/README.md). Leave blank to hide the whole feature.
export const COMMENTS_API_URL = ''

const VISIBLE_COUNT = 5

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
      <h2 className="comments-heading">Say hi</h2>

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
