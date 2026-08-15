# View counter + comments — Cloudflare Worker + KV (free tier, no computer needed)

This worker powers two things on the site:
- a unique-visitor counter (hashes IP, never stores the raw IP)
- a public comments board (name + message, with likes and replies)

Everything below is done from the Cloudflare dashboard in your phone's
browser — no terminal, no `npm install`, no `wrangler` CLI. You don't even
need this repo folder to deploy; the code is pasted straight into
Cloudflare's online editor. Keep this folder in your GitHub repo anyway —
it's the source of truth if you ever want to copy/paste it again.

## 1. Create a free Cloudflare account

Go to https://dash.cloudflare.com/sign-up in your phone's browser and
sign up (no credit card required for the free plan).

## 2. Create the two KV namespaces

In the dashboard: **Storage & Databases → KV → Create namespace**.

Create two namespaces:
- `sawyer-views`
- `sawyer-comments`

You don't need to note the IDs down — the next step binds them by name
inside the dashboard UI directly.

## 3. Create the Worker

**Workers & Pages → Create → Workers → Create Worker.** Give it a name
like `sawyer-view-counter`, then **Deploy** (it'll deploy a placeholder
first — that's fine).

## 4. Paste in the real code

On the Worker's page, tap **Edit code** (this opens Cloudflare's
in-browser code editor — works fine on mobile). Delete the placeholder
code and paste in the entire contents of `src/index.js` from this folder.
Tap **Deploy** (or **Save and deploy**) in the top right.

## 5. Bind the KV namespaces to the Worker

Back on the Worker's overview page: **Settings → Variables and Bindings →
Add binding → KV Namespace.**

Add two bindings — the binding **name** must match exactly what the code
expects:

| Variable name | KV namespace       |
|----------------|---------------------|
| `VIEWS`         | sawyer-views        |
| `COMMENTS`      | sawyer-comments      |

Save. Cloudflare will redeploy automatically.

## 6. Get the live URL

The Worker's overview page shows a URL like:

```
https://sawyer-view-counter.<your-subdomain>.workers.dev
```

That's your API base. The endpoints are `/view` and `/comments`.

## 7. Point the frontend at it

In the main project, open `src/App.jsx` on your phone (GitHub's mobile
web editor, or the GitHub app, works for this — tap the file, tap the
pencil icon) and set both of these near the top:

```js
const VIEW_COUNTER_URL = 'https://sawyer-view-counter.<your-subdomain>.workers.dev/view'
const COMMENTS_API_URL = 'https://sawyer-view-counter.<your-subdomain>.workers.dev/comments'
```

Commit the change directly from GitHub's editor. Vercel picks up the push
automatically and redeploys — no local build step needed. Both the view
counter pill and the comments section stay hidden until these are set.

## Optional: lock down CORS

Right now the worker sends `Access-Control-Allow-Origin: '*'`, so any
site could call your counter/comments API. Once your Vercel domain is
live, open `src/index.js` in the Cloudflare dashboard's **Edit code**
view, find the `corsHeaders()` function, change `'*'` to your real domain
(e.g. `'https://sawyer.vercel.app'`), and hit **Deploy** again.

## How moderation works (there isn't any, yet)

Anyone can post a comment — there's no login and no profanity filter.
For a personal bio page that's usually fine, but if it becomes a problem,
the easiest fix from the dashboard is: **Storage & Databases → KV →
sawyer-comments → the `all` key → Edit** and delete/trim the JSON array
by hand. No redeploy needed.

## How the view-counter dedup works

- The visitor's IP is hashed with SHA-256 before anything is stored — the
  raw IP is never written to KV.
- `seen:<hash>` is stored permanently (no expiry), so a given device only
  ever increments the counter once, even across different days.
