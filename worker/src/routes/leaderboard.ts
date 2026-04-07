import { Hono } from 'hono'
import type { Bindings } from '../types.js'
import { cached } from '../lib/cache.js'
import { getLeaderboardEntries } from '../db/queries/leaderboard.js'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const rawQ = c.req.query('q')?.trim()
  const isSearch = rawQ && rawQ.length >= 2
  const normalizedQ = rawQ?.toLowerCase().slice(0, 30)
  const cacheKey = isSearch ? `leaderboard:q:${normalizedQ}` : 'leaderboard:top100'
  const ttl = isSearch ? 60_000 : 120_000

  const data = await cached(
    cacheKey,
    ttl,
    () => getLeaderboardEntries(c.env.DB, rawQ),
    c.executionCtx,
    !isSearch,
  )

  return c.json(data)
})

export default app
