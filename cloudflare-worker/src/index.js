// Cloudflare Worker: unique-visitor counter + public comments board.
// Backed entirely by Workers KV (free tier). No database needed.
//
// Routes
//   GET  /view                 -> { views: number }               (unchanged)
//   GET  /comments              -> { comments: [...] }  (newest first)
//   POST /comments              -> body { name, message }          -> new comment
//   POST /comments/:id/like     -> increments that comment's likes
//   POST /comments/:id/reply    -> body { name, message }          -> appends a reply
//
// Storage shape (KV binding: COMMENTS, single key "all"):
//   [
//     { id, name, message, createdAt, likes,
//       replies: [ { id, name, message, createdAt } ] }
//   ]
//
// This is intentionally simple (read-modify-write the whole array) rather
// than one KV key per comment — a personal site's comment volume will
// never come close to KV's free-tier write limits, and it keeps the
// worker dead simple to reason about with no computer/CLI required to
// maintain it.

const MAX_NAME_LEN = 40
const MAX_MESSAGE_LEN = 500
const MAX_COMMENTS_RETURNED = 200 // hard ceiling so the payload can't grow forever

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const { pathname } = url

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    try {
      if (pathname === '/view' && request.method === 'GET') {
        return await handleView(request, env)
      }

      if (pathname === '/comments' && request.method === 'GET') {
        return await handleListComments(env)
      }

      if (pathname === '/comments' && request.method === 'POST') {
        return await handleCreateComment(request, env)
      }

      const likeMatch = pathname.match(/^\/comments\/([a-zA-Z0-9-]+)\/like$/)
      if (likeMatch && request.method === 'POST') {
        return await handleLikeComment(env, likeMatch[1])
      }

      const replyMatch = pathname.match(/^\/comments\/([a-zA-Z0-9-]+)\/reply$/)
      if (replyMatch && request.method === 'POST') {
        return await handleReplyComment(request, env, replyMatch[1])
      }

      return jsonResponse({ error: 'Not found' }, 404)
    } catch (err) {
      return jsonResponse({ error: 'Something went wrong' }, 500)
    }
  },
}

// ---------------------------------------------------------------------------
// View counter (unchanged behavior)
// ---------------------------------------------------------------------------

async function handleView(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0'
  const ipHash = await hashValue(ip)
  const seenKey = `seen:${ipHash}`

  let total = parseInt((await env.VIEWS.get('total')) || '0', 10)

  const alreadySeen = await env.VIEWS.get(seenKey)
  if (!alreadySeen) {
    total += 1
    await env.VIEWS.put('total', String(total))
    await env.VIEWS.put(seenKey, '1')
  }

  return jsonResponse({ views: total })
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

async function getComments(env) {
  const raw = await env.COMMENTS.get('all')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveComments(env, comments) {
  // Keep only the newest MAX_COMMENTS_RETURNED so storage can't grow forever.
  const trimmed = comments
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_COMMENTS_RETURNED)
  await env.COMMENTS.put('all', JSON.stringify(trimmed))
  return trimmed
}

async function handleListComments(env) {
  const comments = await getComments(env)
  comments.sort((a, b) => b.createdAt - a.createdAt)
  return jsonResponse({ comments })
}

async function handleCreateComment(request, env) {
  const body = await safeJson(request)
  const name = cleanText(body?.name, MAX_NAME_LEN)
  const message = cleanText(body?.message, MAX_MESSAGE_LEN)

  if (!name || !message) {
    return jsonResponse({ error: 'Name and message are required.' }, 400)
  }

  const comment = {
    id: crypto.randomUUID(),
    name,
    message,
    createdAt: Date.now(),
    likes: 0,
    replies: [],
  }

  const comments = await getComments(env)
  comments.push(comment)
  await saveComments(env, comments)

  return jsonResponse({ comment })
}

async function handleLikeComment(env, id) {
  const comments = await getComments(env)
  const target = comments.find((c) => c.id === id)
  if (!target) return jsonResponse({ error: 'Comment not found.' }, 404)

  target.likes = (target.likes || 0) + 1
  await saveComments(env, comments)

  return jsonResponse({ comment: target })
}

async function handleReplyComment(request, env, id) {
  const body = await safeJson(request)
  const name = cleanText(body?.name, MAX_NAME_LEN)
  const message = cleanText(body?.message, MAX_MESSAGE_LEN)

  if (!name || !message) {
    return jsonResponse({ error: 'Name and message are required.' }, 400)
  }

  const comments = await getComments(env)
  const target = comments.find((c) => c.id === id)
  if (!target) return jsonResponse({ error: 'Comment not found.' }, 404)

  const reply = { id: crypto.randomUUID(), name, message, createdAt: Date.now() }
  target.replies = target.replies || []
  target.replies.push(reply)
  await saveComments(env, comments)

  return jsonResponse({ comment: target })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanText(value, maxLen) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLen)
}

async function safeJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function corsHeaders() {
  return {
    // Tighten this to your real domain once it's deployed, e.g.
    // 'https://sawyer.vercel.app', instead of '*'.
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...corsHeaders(),
    },
  })
}

async function hashValue(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
