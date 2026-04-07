import { Hono } from 'hono'
import type { Bindings } from '../types.js'
import { cached } from '../lib/cache.js'
import { getStatsData } from '../db/queries/stats.js'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const data = await cached('stats:v1', 300_000, () => getStatsData(c.env.DB), c.executionCtx)
  return c.json(data)
})

export default app
