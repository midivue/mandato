import { Hono } from 'hono'
import type { Bindings } from '../types.js'
import {
  RESULTS_AVAILABLE,
  type GroupDetail,
  type GroupMember,
  type BestGroupEntry,
  type PartyId,
} from '@mandatoto/shared/types'
import { cached, invalidate } from '../lib/cache.js'
import { generateToken, generateGroupName } from '../lib/tokens.js'
import { isBeforeCutoff, CUTOFF_MS } from '../lib/cutoff.js'
import { getClientIP } from '../lib/ip.js'
import { verifyTurnstile } from '../lib/turnstile.js'

const app = new Hono<{ Bindings: Bindings }>()

const MAX_MEMBERS = 30

async function resolveUserShareToken(
  db: D1Database,
  userToken: string | undefined,
): Promise<string | null> {
  if (!userToken) return null
  const row = await db
    .prepare('SELECT share_token FROM predictions WHERE token = ?')
    .bind(userToken)
    .first()
  return (row?.['share_token'] as string) ?? null
}

async function verifyMembership(
  db: D1Database,
  groupId: number,
  shareToken: string,
): Promise<boolean> {
  const row = await db
    .prepare(
      'SELECT 1 FROM group_members WHERE group_id = ? AND prediction_share_token = ?',
    )
    .bind(groupId, shareToken)
    .first()
  return row !== null
}

async function buildGroupDetail(
  db: D1Database,
  groupRow: Record<string, unknown>,
  includeGlobalRanks = true,
): Promise<GroupDetail> {
  const groupId = groupRow['id'] as number

  const memberRows = await db
    .prepare(
      `SELECT gm.prediction_share_token, p.display_name, p.score, p.list_winner_id,
              p.pm_winner_id, p.pct_mkkp, p.pct_tisza, p.pct_mi_hazank, p.pct_dk,
              p.pct_fidesz_kdnp, p.pct_nationalities, p.participation_rate, p.finalized_at
       FROM group_members gm
       JOIN predictions p ON p.share_token = gm.prediction_share_token
       WHERE gm.group_id = ?
       ORDER BY p.score DESC NULLS LAST`,
    )
    .bind(groupId)
    .all()

  const globalRanks = new Map<string, number>()
  if (includeGlobalRanks && RESULTS_AVAILABLE && memberRows.results.length > 0) {
    const scored = memberRows.results.filter(
      (r) => r['score'] != null && r['prediction_share_token'],
    )
    if (scored.length > 0) {
      const placeholders = scored.map(() => '?').join(',')
      const shareTokens = scored.map((r) => r['prediction_share_token'] as string)
      const rankRows = await db
        .prepare(
          `SELECT share_token, (SELECT COUNT(*) + 1 FROM predictions p2 WHERE p2.score > p1.score AND p2.visibility = 'public' AND p2.score IS NOT NULL) as rank
           FROM predictions p1
           WHERE p1.share_token IN (${placeholders}) AND p1.visibility = 'public' AND p1.score IS NOT NULL`,
        )
        .bind(...shareTokens)
        .all()
      for (const row of rankRows.results) {
        globalRanks.set(row['share_token'] as string, row['rank'] as number)
      }
    }
  }

  const members: GroupMember[] = memberRows.results.map((row, idx) => ({
    shareToken: row['prediction_share_token'] as string,
    displayName: row['display_name'] as string,
    score: RESULTS_AVAILABLE ? ((row['score'] as number) ?? null) : null,
    listWinnerId: (row['list_winner_id'] as PartyId) ?? null,
    pmWinnerId: (row['pm_winner_id'] as PartyId) ?? null,
    pctMkkp: (row['pct_mkkp'] as number) ?? null,
    pctTisza: (row['pct_tisza'] as number) ?? null,
    pctMiHazank: (row['pct_mi_hazank'] as number) ?? null,
    pctDk: (row['pct_dk'] as number) ?? null,
    pctFideszKdnp: (row['pct_fidesz_kdnp'] as number) ?? null,
    pctNationalities: (row['pct_nationalities'] as number) ?? null,
    participationRate: (row['participation_rate'] as number) ?? null,
    finalizedAt: (row['finalized_at'] as string) ?? null,
    groupRank: idx + 1,
    globalRank:
      globalRanks.get(row['prediction_share_token'] as string) ?? null,
  }))

  return {
    name: groupRow['name'] as string,
    groupToken: groupRow['group_token'] as string,
    visibility: ((groupRow['visibility'] as string) ?? 'public') as 'public' | 'private',
    createdAt: groupRow['created_at'] as string,
    members,
  }
}

// POST / — create a new group
app.post('/', async (c) => {
  const turnstileError = await verifyTurnstile(c.env.TURNSTILE_SECRET, c.req.header('X-Turnstile-Token'), getClientIP(c))
  if (turnstileError) return c.json({ error: turnstileError }, turnstileError === 'Human verification token missing' ? 400 : 403)

  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  let body: { name?: string; visibility?: string }
  try { body = await c.req.json<{ name?: string; visibility?: string }>() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

  const groupToken = generateToken()
  if (typeof body.name === 'string' && body.name.length > 100) {
    return c.json({ error: 'Group name must be 100 characters or fewer' }, 400)
  }
  const name = body.name?.trim() || generateGroupName()
  const visibility = body.visibility === 'private' ? 'private' : 'public'

  await c.env.DB.prepare(
    'INSERT INTO groups (group_token, name, visibility) VALUES (?, ?, ?)',
  )
    .bind(groupToken, name, visibility)
    .run()

  const groupRow = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  if (!groupRow) return c.json({ error: 'Failed to create group' }, 500)

  await c.env.DB.prepare(
    'INSERT INTO group_members (group_id, prediction_share_token) VALUES (?, ?)',
  )
    .bind(groupRow['id'], userShareToken)
    .run()

  const detail = await buildGroupDetail(
    c.env.DB,
    groupRow as Record<string, unknown>,
    false,
  )
  invalidate('groups:best:v1', c.executionCtx)
  return c.json(detail, 201)
})

// GET /best — top groups by average score (post-results) or latest groups (pre-results)
app.get('/best', async (c) => {
  const data = await cached('groups:best:v1', 300_000, async () => {
    let rows
    if (RESULTS_AVAILABLE) {
      const cutoffISO = new Date(CUTOFF_MS).toISOString().replace('T', ' ').slice(0, 19)
      rows = await c.env.DB.prepare(
        `SELECT g.group_token, g.name,
                COUNT(gm.id) as member_count,
                AVG(p.score) as avg_score
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
         JOIN predictions p ON p.share_token = gm.prediction_share_token
         WHERE g.created_at < ?
           AND g.visibility = 'public'
           AND p.score IS NOT NULL
         GROUP BY g.id
         HAVING COUNT(gm.id) >= 2
         ORDER BY avg_score DESC
         LIMIT 12`,
      )
        .bind(cutoffISO)
        .all()
    } else {
      rows = await c.env.DB.prepare(
        `SELECT g.group_token, g.name,
                COUNT(gm.id) as member_count
         FROM groups g
         JOIN group_members gm ON gm.group_id = g.id
         WHERE g.visibility = 'public'
         GROUP BY g.id
         HAVING COUNT(gm.id) >= 2
         ORDER BY g.created_at DESC
         LIMIT 12`,
      ).all()
    }

    const entries: BestGroupEntry[] = rows.results.map((row) => ({
      groupToken: row['group_token'] as string,
      name: row['name'] as string,
      memberCount: row['member_count'] as number,
      avgScore: row['avg_score'] != null ? Math.round(((row['avg_score'] as number)) * 10) / 10 : null,
    }))
    return entries
  }, c.executionCtx)

  return c.json(data)
})

// GET /my-groups — groups the authenticated user belongs to (must be before /:groupToken)
app.get('/my-groups', async (c) => {
  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  const rows = await c.env.DB.prepare(
    `SELECT g.group_token, g.name
     FROM groups g
     JOIN group_members gm ON gm.group_id = g.id
     WHERE gm.prediction_share_token = ?
     ORDER BY gm.added_at DESC`,
  )
    .bind(userShareToken)
    .all()

  const groups = rows.results.map((row) => ({
    groupToken: row['group_token'] as string,
    name: row['name'] as string,
  }))

  return c.json(groups)
})

// GET /:groupToken — fetch group detail
app.get('/:groupToken', async (c) => {
  const groupToken = c.req.param('groupToken')

  const detail = await cached(
    `group:${groupToken}`,
    120_000,
    async () => {
      const groupRow = await c.env.DB.prepare(
        'SELECT * FROM groups WHERE group_token = ?',
      )
        .bind(groupToken)
        .first()

      if (!groupRow) return null

      return buildGroupDetail(
        c.env.DB,
        groupRow as Record<string, unknown>,
      )
    },
    c.executionCtx,
    false,
  )

  if (!detail) return c.json({ error: 'Not found' }, 404)
  return c.json(detail)
})

// PUT /:groupToken — update group name
app.put('/:groupToken', async (c) => {
  const groupToken = c.req.param('groupToken')
  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  const groupRow = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  if (!groupRow) return c.json({ error: 'Not found' }, 404)

  const isMember = await verifyMembership(
    c.env.DB,
    groupRow['id'] as number,
    userShareToken,
  )
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  let body: { name?: string; visibility?: string }
  try { body = await c.req.json<{ name?: string; visibility?: string }>() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }

  if (typeof body.name === 'string' && body.name.length > 100) {
    return c.json({ error: 'Group name must be 100 characters or fewer' }, 400)
  }
  const name = body.name?.trim()
  const visibility = body.visibility

  if (!name && !visibility) return c.json({ error: 'Name or visibility is required' }, 400)

  if (visibility) {
    const currentVisibility = groupRow['visibility'] as string
    if (currentVisibility === 'public' && visibility === 'private' && !isBeforeCutoff()) {
      return c.json({ error: 'Cannot switch to private after cutoff' }, 403)
    }
  }

  const updates: string[] = []
  const bindings: unknown[] = []
  if (name) {
    updates.push('name = ?')
    bindings.push(name)
  }
  if (visibility === 'public' || visibility === 'private') {
    updates.push('visibility = ?')
    bindings.push(visibility)
  }
  updates.push("updated_at = datetime('now')")
  bindings.push(groupToken)

  await c.env.DB.prepare(
    `UPDATE groups SET ${updates.join(', ')} WHERE group_token = ?`,
  )
    .bind(...bindings)
    .run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  const detail = await buildGroupDetail(
    c.env.DB,
    updated as Record<string, unknown>,
    false,
  )
  invalidate(`group:${groupToken}`, c.executionCtx)
  invalidate('groups:best:v1', c.executionCtx)
  return c.json(detail)
})

// POST /:groupToken/join — self-join (invite link flow)
app.post('/:groupToken/join', async (c) => {
  const turnstileError = await verifyTurnstile(c.env.TURNSTILE_SECRET, c.req.header('X-Turnstile-Token'), getClientIP(c))
  if (turnstileError) return c.json({ error: turnstileError }, turnstileError === 'Human verification token missing' ? 400 : 403)

  const groupToken = c.req.param('groupToken')
  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  const groupRow = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  if (!groupRow) return c.json({ error: 'Not found' }, 404)

  const groupId = groupRow['id'] as number

  const existing = await c.env.DB.prepare(
    'SELECT 1 FROM group_members WHERE group_id = ? AND prediction_share_token = ?',
  )
    .bind(groupId, userShareToken)
    .first()

  if (existing) {
    const detail = await buildGroupDetail(c.env.DB, groupRow as Record<string, unknown>, false)
    return c.json(detail)
  }

  const memberCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
  )
    .bind(groupId)
    .first()
  if ((memberCount?.['count'] as number) >= MAX_MEMBERS) {
    return c.json({ error: 'Group is full' }, 400)
  }

  await c.env.DB.prepare(
    'INSERT INTO group_members (group_id, prediction_share_token) VALUES (?, ?)',
  )
    .bind(groupId, userShareToken)
    .run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  const detail = await buildGroupDetail(c.env.DB, updated as Record<string, unknown>, false)
  invalidate(`group:${groupToken}`, c.executionCtx)
  invalidate('groups:best:v1', c.executionCtx)
  return c.json(detail)
})

// POST /:groupToken/members — add a member
app.post('/:groupToken/members', async (c) => {
  if (!isBeforeCutoff()) {
    return c.json({ error: 'Cutoff time has passed' }, 403)
  }

  const groupToken = c.req.param('groupToken')
  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  const groupRow = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  if (!groupRow) return c.json({ error: 'Not found' }, 404)

  const groupId = groupRow['id'] as number
  const isMember = await verifyMembership(c.env.DB, groupId, userShareToken)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  let body: { shareToken: string }
  try { body = await c.req.json<{ shareToken: string }>() } catch { return c.json({ error: 'Invalid JSON body' }, 400) }
  const targetShareToken = body.shareToken?.trim()
  if (!targetShareToken) {
    return c.json({ error: 'Share token is required' }, 400)
  }

  const prediction = await c.env.DB.prepare(
    'SELECT share_token FROM predictions WHERE share_token = ?',
  )
    .bind(targetShareToken)
    .first()
  if (!prediction) {
    return c.json({ error: 'Profile not found' }, 404)
  }

  const memberCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
  )
    .bind(groupId)
    .first()
  if ((memberCount?.['count'] as number) >= MAX_MEMBERS) {
    return c.json({ error: 'Group is full' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT 1 FROM group_members WHERE group_id = ? AND prediction_share_token = ?',
  )
    .bind(groupId, targetShareToken)
    .first()
  if (existing) {
    return c.json({ error: 'Already a member' }, 409)
  }

  await c.env.DB.prepare(
    'INSERT INTO group_members (group_id, prediction_share_token) VALUES (?, ?)',
  )
    .bind(groupId, targetShareToken)
    .run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  const detail = await buildGroupDetail(
    c.env.DB,
    updated as Record<string, unknown>,
    false,
  )
  invalidate(`group:${groupToken}`, c.executionCtx)
  return c.json(detail)
})

// DELETE /:groupToken/members/:shareToken — remove a member
app.delete('/:groupToken/members/:shareToken', async (c) => {
  if (!isBeforeCutoff()) {
    return c.json({ error: 'Cutoff time has passed' }, 403)
  }

  const groupToken = c.req.param('groupToken')
  const targetShareToken = c.req.param('shareToken')
  const userToken = c.req.header('X-User-Token')
  const userShareToken = await resolveUserShareToken(c.env.DB, userToken)
  if (!userShareToken) {
    return c.json({ error: 'Valid prediction token required' }, 401)
  }

  const groupRow = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  if (!groupRow) return c.json({ error: 'Not found' }, 404)

  const groupId = groupRow['id'] as number
  const isMember = await verifyMembership(c.env.DB, groupId, userShareToken)
  if (!isMember) return c.json({ error: 'Not a member of this group' }, 403)

  await c.env.DB.prepare(
    'DELETE FROM group_members WHERE group_id = ? AND prediction_share_token = ?',
  )
    .bind(groupId, targetShareToken)
    .run()

  const remainingCount = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM group_members WHERE group_id = ?',
  )
    .bind(groupId)
    .first()

  if ((remainingCount?.['count'] as number) === 0) {
    await c.env.DB.prepare('DELETE FROM groups WHERE id = ?').bind(groupId).run()
    invalidate(`group:${groupToken}`, c.executionCtx)
    invalidate('groups:best:v1', c.executionCtx)
    invalidate(`share:${targetShareToken}`, c.executionCtx)
    return c.json({ deleted: true })
  }

  const updated = await c.env.DB.prepare(
    'SELECT * FROM groups WHERE group_token = ?',
  )
    .bind(groupToken)
    .first()
  const detail = await buildGroupDetail(
    c.env.DB,
    updated as Record<string, unknown>,
    false,
  )
  invalidate(`group:${groupToken}`, c.executionCtx)
  invalidate('groups:best:v1', c.executionCtx)
  invalidate(`share:${targetShareToken}`, c.executionCtx)
  return c.json(detail)
})

export default app
