import { Hono } from 'hono'
import type { Bindings } from '../types.js'
import { cached } from '../lib/cache.js'
import { getSharedPrediction } from '../db/queries/share.js'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/:shareToken', async (c) => {
  const shareToken = c.req.param('shareToken')

  const data = await cached(
    `share:${shareToken}`,
    60_000,
    () => getSharedPrediction(c.env.DB, shareToken),
    c.executionCtx,
    false,
  )

  if (!data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

export default app
