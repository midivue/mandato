import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv } from './types.js'
import { requestId } from './middleware/request-id.js'
import { getClientIP, hashIP } from './lib/ip.js'
import predictions from './routes/predictions.js'
import groups from './routes/groups.js'
import share from './routes/share.js'
import leaderboard from './routes/leaderboard.js'
import stats from './routes/stats.js'

const app = new Hono<AppEnv>()

app.use('/*', requestId)

app.onError((err, c) => {
  const rid = c.get('requestId')
  console.error(JSON.stringify({
    requestId: rid,
    method: c.req.method,
    path: c.req.path,
    error: err.message,
  }))
  return c.json({ error: 'Internal server error' }, 500)
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.use('/*', cors({
  origin: (origin) => {
    if (!origin) return origin as string
    if (origin.startsWith('http://localhost:')) return origin
    if (origin.endsWith('.pages.dev')) return origin
    if (origin.endsWith('.workers.dev')) return origin
    if (origin === 'https://mandato.hu' || origin.endsWith('.mandato.hu')) return origin
    if (origin === 'https://mandatoto.hu' || origin.endsWith('.mandatoto.hu')) return origin
    return ''
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-User-Token', 'X-Turnstile-Token'],
  maxAge: 86400,
}))

app.use('/*', async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  c.header('X-Frame-Options', 'DENY')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "connect-src 'self' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
    ].join('; '),
  )
})

const MAX_BODY_SIZE = 4096
const RATE_LIMIT_READS_PER_MIN = 60
const RATE_LIMIT_WRITES_PER_MIN = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_RATE_LIMIT_ENTRIES = 2000

const rateLimits = new Map<string, { r: number[]; w: number[] }>()

function checkRateLimit(ip: string, isWrite: boolean): boolean {
  const now = Date.now()
  let entry = rateLimits.get(ip)
  if (!entry) {
    if (rateLimits.size >= MAX_RATE_LIMIT_ENTRIES) {
      const oldest = rateLimits.keys().next().value
      if (oldest !== undefined) rateLimits.delete(oldest)
    }
    entry = { r: [], w: [] }
    rateLimits.set(ip, entry)
  }
  entry.r = entry.r.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  entry.w = entry.w.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (isWrite) {
    if (entry.w.length >= RATE_LIMIT_WRITES_PER_MIN) return false
    entry.w.push(now)
  } else {
    if (entry.r.length >= RATE_LIMIT_READS_PER_MIN) return false
    entry.r.push(now)
  }
  return true
}

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next()
  const ip = getClientIP(c)
  const isWrite = c.req.method !== 'GET'
  if (!checkRateLimit(ip, isWrite)) {
    const ipHash = (await hashIP(ip)).slice(0, 12)
    console.warn(JSON.stringify({
      requestId: c.get('requestId'),
      event: 'rate_limit',
      method: c.req.method,
      path: c.req.path,
      ipHash,
    }))
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }
  return next()
})

app.use('/api/*', async (c, next) => {
  if (c.req.method === 'GET' || c.req.method === 'OPTIONS') return next()
  const cl = c.req.header('Content-Length')
  if (cl && parseInt(cl, 10) > MAX_BODY_SIZE) {
    return c.json({ error: 'Request body too large' }, 413)
  }
  return next()
})

app.use('/api/*', async (c, next) => {
  if (c.env.MAINTENANCE_MODE && c.req.method !== 'GET' && c.req.method !== 'OPTIONS') {
    return c.json({ error: 'Service is temporarily unavailable for maintenance' }, 503)
  }
  return next()
})

app.route('/api/v1/predictions', predictions)
app.route('/api/v1/groups', groups)
app.route('/api/v1/share', share)
app.route('/api/v1/leaderboard', leaderboard)
app.route('/api/v1/stats', stats)

export default app
