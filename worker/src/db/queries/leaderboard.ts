import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'

const COLS = 'display_name, share_token, score, list_winner_id, pm_winner_id, finalized_at, pct_mkkp, pct_tisza, pct_mi_hazank, pct_dk, pct_fidesz_kdnp, pct_nationalities, participation_rate'

function mapRow(row: Record<string, unknown>, rank: number | null) {
  return {
    rank,
    displayName: row['display_name'],
    shareToken: row['share_token'],
    score: RESULTS_AVAILABLE ? (row['score'] ?? null) : null,
    listWinnerId: row['list_winner_id'] ?? null,
    pmWinnerId: row['pm_winner_id'] ?? null,
    finalizedAt: row['finalized_at'] ?? null,
    pctMkkp: (row['pct_mkkp'] as number) ?? null,
    pctTisza: (row['pct_tisza'] as number) ?? null,
    pctMiHazank: (row['pct_mi_hazank'] as number) ?? null,
    pctDk: (row['pct_dk'] as number) ?? null,
    pctFideszKdnp: (row['pct_fidesz_kdnp'] as number) ?? null,
    pctNationalities: (row['pct_nationalities'] as number) ?? null,
    participationRate: (row['participation_rate'] as number) ?? null,
  }
}

export async function getLeaderboardEntries(db: D1Database, searchQuery?: string) {
  const isSearch = searchQuery && searchQuery.length >= 2
  const escaped = searchQuery ? searchQuery.replace(/[%_]/g, '\\$&') : undefined

  if (RESULTS_AVAILABLE) {
    if (escaped && isSearch) {
      const rows = await db.prepare(
        `SELECT ${COLS},
           (SELECT COUNT(*) + 1 FROM predictions p2
            WHERE p2.score > p.score AND p2.visibility = 'public'
            AND p2.status = 'finalized' AND p2.score IS NOT NULL) as rank
         FROM predictions p
         WHERE p.visibility = 'public' AND p.status = 'finalized' AND p.score IS NOT NULL
           AND p.display_name LIKE ? ESCAPE '\\'
         ORDER BY p.score DESC LIMIT 20`,
      ).bind(`%${escaped}%`).all()
      return rows.results.map((r) => mapRow(r, (r['rank'] as number) ?? null))
    }
    const rows = await db.prepare(
      `SELECT ${COLS} FROM predictions
       WHERE visibility = 'public' AND status = 'finalized' AND score IS NOT NULL
       ORDER BY score DESC LIMIT 100`,
    ).all()
    return rows.results.map((r, i) => mapRow(r, i + 1))
  }

  if (escaped && isSearch) {
    const rows = await db.prepare(
      `SELECT ${COLS} FROM predictions
       WHERE visibility = 'public' AND status = 'finalized'
         AND display_name LIKE ? ESCAPE '\\'
       ORDER BY finalized_at DESC LIMIT 20`,
    ).bind(`%${escaped}%`).all()
    return rows.results.map((r) => mapRow(r, null))
  }
  const rows = await db.prepare(
    `SELECT ${COLS} FROM predictions
     WHERE visibility = 'public' AND status = 'finalized'
     ORDER BY finalized_at DESC LIMIT 100`,
  ).all()
  return rows.results.map((r) => mapRow(r, null))
}
