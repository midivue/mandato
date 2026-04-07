import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../types.js'
import { getClientIP } from '../lib/ip.js'
import { verifyTurnstile } from '../lib/turnstile.js'

/**
 * Hono middleware that verifies a Cloudflare Turnstile token.
 * Reads the token from the X-Turnstile-Token request header.
 * Skips verification when TURNSTILE_SECRET is not configured (local dev).
 */
export const turnstile: MiddlewareHandler<AppEnv> = async (c, next) => {
  const error = await verifyTurnstile(
    c.env.TURNSTILE_SECRET,
    c.req.header('X-Turnstile-Token'),
    getClientIP(c),
  )
  if (error) {
    return c.json({ error }, error === 'Human verification token missing' ? 400 : 403)
  }
  return next()
}
