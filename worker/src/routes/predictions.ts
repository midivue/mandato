import { Hono } from 'hono'
import type { Bindings } from '../types.js'
import {
  PARTY_IDS,
  PARTY_LIST_THRESHOLD,
  type CreatePredictionRequest,
  type Prediction,
  type PredictionUpdate,
} from '@mandatoto/shared/types'
import { generateToken, generateAnonymousName } from '../lib/tokens.js'
import { isBeforeCutoff } from '../lib/cutoff.js'
import { getClientIP, hashIP } from '../lib/ip.js'
import { isValidPartyId, isValidPercent } from '../lib/validation.js'
import { rowToPrediction, PCT_COLUMNS } from '../lib/mappers.js'
import { invalidate, invalidatePrefix } from '../lib/cache.js'
import { verifyTurnstile } from '../lib/turnstile.js'

const app = new Hono<{ Bindings: Bindings }>()

const RATE_LIMIT_CREATE = 10
const RATE_LIMIT_FINALIZE = 5
const RATE_LIMIT_WINDOW = '-1 hour'

// POST /predictions — create a new prediction
// No Turnstile here: the token is single-use and will be consumed by /finalize.
// IP-based rate limiting provides sufficient protection for this step.
app.post('/', async (c) => {
  if (!isBeforeCutoff()) {
    return c.json({ error: 'Cutoff time has passed' }, 403)
  }

  const ipHash = await hashIP(getClientIP(c))

  const recentCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM predictions WHERE ip_hash = ? AND created_at > datetime('now', '${RATE_LIMIT_WINDOW}')`
  ).bind(ipHash).first()
  if ((recentCount?.['count'] as number) >= RATE_LIMIT_CREATE) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }

  let body: CreatePredictionRequest
  try { body = await c.req.json<CreatePredictionRequest>() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

  const token = generateToken()
  const shareToken = generateToken()

  if (typeof body.displayName === 'string' && body.displayName.length > 50) {
    return c.json({ error: 'Display name must be 50 characters or fewer' }, 400)
  }
  if (typeof body.locationSettlement === 'string' && body.locationSettlement.length > 100) {
    return c.json({ error: 'Location settlement must be 100 characters or fewer' }, 400)
  }
  if (typeof body.locationZip === 'string' && body.locationZip.length > 100) {
    return c.json({ error: 'Location zip must be 100 characters or fewer' }, 400)
  }

  const displayName = body.displayName || generateAnonymousName()

  const pctValues: Record<string, number | null> = {}
  for (const id of PARTY_IDS) {
    const key = `pct${id.charAt(0).toUpperCase()}${id.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as keyof CreatePredictionRequest
    const val = body[key]
    pctValues[PCT_COLUMNS[id]] = typeof val === 'number' && isValidPercent(val) ? val : null
  }

  const pctNationalities = typeof body.pctNationalities === 'number' && isValidPercent(body.pctNationalities) ? body.pctNationalities : null
  const participationRate = typeof body.participationRate === 'number' && isValidPercent(body.participationRate) ? body.participationRate : null

  const locationCountry = body.locationCountry === 'abroad' ? 'abroad' : 'hu'
  const locationSettlement = typeof body.locationSettlement === 'string' ? body.locationSettlement : null
  const locationZip = typeof body.locationZip === 'string' ? body.locationZip : null
  const locationPublic = body.locationPublic ? 1 : 0

  const insertResult = await c.env.DB.prepare(
    `INSERT INTO predictions (token, share_token, display_name, visibility, list_winner_id, pct_mkkp, pct_tisza, pct_mi_hazank, pct_dk, pct_fidesz_kdnp, pct_nationalities, participation_rate, pm_winner_id, ip_hash, location_country, location_settlement, location_zip, location_public)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      token,
      shareToken,
      displayName,
      body.visibility === 'private' ? 'private' : 'public',
      body.listWinnerId && isValidPartyId(body.listWinnerId) ? body.listWinnerId : null,
      pctValues['pct_mkkp'],
      pctValues['pct_tisza'],
      pctValues['pct_mi_hazank'],
      pctValues['pct_dk'],
      pctValues['pct_fidesz_kdnp'],
      pctNationalities,
      participationRate,
      body.pmWinnerId && isValidPartyId(body.pmWinnerId) ? body.pmWinnerId : null,
      ipHash,
      locationCountry,
      locationSettlement,
      locationZip,
      locationPublic,
    )
    .first()

  if (!insertResult) return c.json({ error: 'Failed to create prediction' }, 500)

  return c.json(rowToPrediction(insertResult as Record<string, unknown>), 201)
})

// GET /predictions/:token
app.get('/:token', async (c) => {
  const token = c.req.param('token')
  const row = await c.env.DB.prepare('SELECT * FROM predictions WHERE token = ?').bind(token).first()
  if (!row) return c.json({ error: 'Not found' }, 404)

  return c.json(rowToPrediction(row as Record<string, unknown>))
})

// PUT /predictions/:token — update metadata (post-finalize: display_name, visibility only)
app.put('/:token', async (c) => {
  const token = c.req.param('token')
  const existing = await c.env.DB.prepare('SELECT * FROM predictions WHERE token = ?').bind(token).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  let body: PredictionUpdate
  try { body = await c.req.json<PredictionUpdate>() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

  if (typeof body.displayName === 'string' && body.displayName.length > 50) {
    return c.json({ error: 'Display name must be 50 characters or fewer' }, 400)
  }
  if (typeof body.locationSettlement === 'string' && body.locationSettlement.length > 100) {
    return c.json({ error: 'Location settlement must be 100 characters or fewer' }, 400)
  }
  if (typeof body.locationZip === 'string' && body.locationZip.length > 100) {
    return c.json({ error: 'Location zip must be 100 characters or fewer' }, 400)
  }

  if (!isBeforeCutoff()) {
    const onlyMetadata = Object.keys(body).every((k) => k === 'displayName' || k === 'visibility')
    if (!onlyMetadata) {
      return c.json({ error: 'Cutoff time has passed — only display name and visibility changes allowed' }, 403)
    }
    if (body.visibility === 'private') {
      return c.json({ error: 'Cannot switch to private after cutoff' }, 403)
    }
  }

  const sets: string[] = []
  const binds: unknown[] = []

  if (body.displayName !== undefined) {
    sets.push('display_name = ?')
    binds.push(body.displayName)
  }

  if (body.visibility !== undefined) {
    const currentVis = existing['visibility'] as string
    if (currentVis === 'public' && body.visibility === 'private' && !isBeforeCutoff()) {
      return c.json({ error: 'Cannot switch to private after cutoff' }, 403)
    }
    sets.push('visibility = ?')
    binds.push(body.visibility === 'private' ? 'private' : 'public')
  }

  if (body.listWinnerId !== undefined) {
    sets.push('list_winner_id = ?')
    binds.push(body.listWinnerId && isValidPartyId(body.listWinnerId) ? body.listWinnerId : null)
  }

  for (const id of PARTY_IDS) {
    const key = `pct${id.charAt(0).toUpperCase()}${id.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as keyof PredictionUpdate
    if (body[key] !== undefined) {
      const val = body[key]
      sets.push(`${PCT_COLUMNS[id]} = ?`)
      binds.push(typeof val === 'number' && isValidPercent(val) ? val : null)
    }
  }

  if (body.pctNationalities !== undefined) {
    sets.push('pct_nationalities = ?')
    binds.push(typeof body.pctNationalities === 'number' && isValidPercent(body.pctNationalities) ? body.pctNationalities : null)
  }

  if (body.pmWinnerId !== undefined) {
    sets.push('pm_winner_id = ?')
    binds.push(body.pmWinnerId && isValidPartyId(body.pmWinnerId) ? body.pmWinnerId : null)
  }

  if (body.participationRate !== undefined) {
    sets.push('participation_rate = ?')
    binds.push(typeof body.participationRate === 'number' && isValidPercent(body.participationRate) ? body.participationRate : null)
  }

  if (body.locationCountry !== undefined) {
    sets.push('location_country = ?')
    binds.push(body.locationCountry === 'abroad' ? 'abroad' : 'hu')
  }

  if (body.locationSettlement !== undefined) {
    sets.push('location_settlement = ?')
    binds.push(typeof body.locationSettlement === 'string' ? body.locationSettlement : null)
  }

  if (body.locationZip !== undefined) {
    sets.push('location_zip = ?')
    binds.push(typeof body.locationZip === 'string' ? body.locationZip : null)
  }

  if (body.locationPublic !== undefined) {
    sets.push('location_public = ?')
    binds.push(body.locationPublic ? 1 : 0)
  }

  if (sets.length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  sets.push("updated_at = datetime('now')")

  const row = await c.env.DB.prepare(`UPDATE predictions SET ${sets.join(', ')} WHERE token = ? RETURNING *`)
    .bind(...binds, token)
    .first()

  const shareToken = existing['share_token'] as string
  invalidate(`share:${shareToken}`, c.executionCtx)
  invalidate('leaderboard:top100', c.executionCtx)
  invalidatePrefix('leaderboard:q:')

  return c.json(rowToPrediction(row as Record<string, unknown>))
})

// POST /predictions/:token/finalize
app.post('/:token/finalize', async (c) => {
  const turnstileError = await verifyTurnstile(c.env.TURNSTILE_SECRET, c.req.header('X-Turnstile-Token'), getClientIP(c))
  if (turnstileError) return c.json({ error: turnstileError }, turnstileError === 'Human verification token missing' ? 400 : 403)

  if (!isBeforeCutoff()) {
    return c.json({ error: 'Cutoff time has passed' }, 403)
  }

  const ipHash = await hashIP(getClientIP(c))
  const recentFinalizes = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM predictions WHERE ip_hash = ? AND finalized_at > datetime('now', '${RATE_LIMIT_WINDOW}')`
  ).bind(ipHash).first()
  if ((recentFinalizes?.['count'] as number) >= RATE_LIMIT_FINALIZE) {
    return c.json({ error: 'Rate limit exceeded' }, 429)
  }

  const token = c.req.param('token')
  const row = await c.env.DB.prepare('SELECT * FROM predictions WHERE token = ?').bind(token).first()
  if (!row) return c.json({ error: 'Not found' }, 404)

  const prediction = rowToPrediction(row as Record<string, unknown>)

  if (!prediction.pmWinnerId) {
    return c.json({ error: 'PM candidate selection is required' }, 400)
  }
  if (!prediction.listWinnerId) {
    return c.json({ error: 'Winner party list selection is required' }, 400)
  }

  const allPcts = [
    prediction.pctMkkp,
    prediction.pctTisza,
    prediction.pctMiHazank,
    prediction.pctDk,
    prediction.pctFideszKdnp,
    prediction.pctNationalities,
  ]

  if (allPcts.some((v) => v === null || !Number.isFinite(v) || v < 0 || v > 100)) {
    return c.json({ error: 'All percentage fields must be filled with valid values' }, 400)
  }

  const pctSum = allPcts.reduce((sum, v) => (sum ?? 0) + (v as number), 0) ?? 0
  if (Math.abs(pctSum - 100) >= 0.1) {
    return c.json({ error: 'All percentages must add up to 100%' }, 400)
  }

  if (prediction.pmWinnerId) {
    const pmPctKey = `pct${prediction.pmWinnerId.charAt(0).toUpperCase()}${prediction.pmWinnerId.slice(1).replace(/_([a-z])/g, (_, l: string) => l.toUpperCase())}` as keyof Prediction
    const pmPct = prediction[pmPctKey] as number | null
    if (pmPct !== null && pmPct < PARTY_LIST_THRESHOLD) {
      return c.json({ error: 'PM candidate party is below the 5% threshold' }, 400)
    }
  }

  const updated = await c.env.DB.prepare(
    "UPDATE predictions SET status = 'finalized', finalized_at = datetime('now'), updated_at = datetime('now') WHERE token = ? RETURNING *"
  )
    .bind(token)
    .first()

  const shareToken = row['share_token'] as string
  invalidate(`share:${shareToken}`, c.executionCtx)
  invalidate('stats:v1', c.executionCtx)
  invalidate('leaderboard:top100', c.executionCtx)
  invalidatePrefix('leaderboard:q:')
  invalidate('groups:best:v1', c.executionCtx)

  return c.json(rowToPrediction(updated as Record<string, unknown>))
})

// DELETE /predictions/:token — permanently delete a prediction and its group memberships
app.delete('/:token', async (c) => {
  const token = c.req.param('token')
  const existing = await c.env.DB.prepare('SELECT token, share_token FROM predictions WHERE token = ?').bind(token).first()
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const shareToken = existing['share_token'] as string
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM group_members WHERE prediction_share_token = ?').bind(shareToken),
    c.env.DB.prepare('DELETE FROM predictions WHERE token = ?').bind(token),
  ])
  invalidate(`share:${shareToken}`, c.executionCtx)
  invalidate('stats:v1', c.executionCtx)
  invalidate('leaderboard:top100', c.executionCtx)
  invalidatePrefix('leaderboard:q:')
  invalidate('groups:best:v1', c.executionCtx)
  return c.json({ deleted: true })
})

export default app
