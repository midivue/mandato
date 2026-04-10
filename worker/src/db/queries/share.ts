import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'

export async function getSharedPrediction(db: D1Database, shareToken: string) {
  const row = await db.prepare(
    'SELECT display_name, visibility, status, list_winner_id, pct_mkkp, pct_tisza, pct_mi_hazank, pct_dk, pct_fidesz_kdnp, pct_nationalities, participation_rate, telex_tip_id, pm_winner_id, location_country, location_settlement, location_zip, location_public, finalized_at, score FROM predictions WHERE share_token = ?'
  )
    .bind(shareToken)
    .first()

  if (!row) return null

  const locationIsPublic = row['location_public'] === 1
  const score = row['score'] as number | null
  const isPublicScored = RESULTS_AVAILABLE && row['visibility'] === 'public' && score != null

  const stmts: D1PreparedStatement[] = []

  // Batch: leaderboard rank (only if public + scored)
  if (isPublicScored) {
    stmts.push(
      db.prepare(
        "SELECT COUNT(*) + 1 as rank FROM predictions WHERE score > ? AND visibility = 'public' AND score IS NOT NULL"
      ).bind(score)
    )
  }

  // Batch: groups with member count + member rank in one query
  stmts.push(
    isPublicScored
      ? db.prepare(
          `SELECT g.group_token, g.name,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
            (SELECT COUNT(*) + 1 FROM group_members gm2
             JOIN predictions p ON p.share_token = gm2.prediction_share_token
             WHERE gm2.group_id = g.id AND p.score > ?) as member_rank
          FROM group_members gm
          JOIN groups g ON g.id = gm.group_id
          WHERE gm.prediction_share_token = ?`
        ).bind(score, shareToken)
      : db.prepare(
          `SELECT g.group_token, g.name,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
          FROM group_members gm
          JOIN groups g ON g.id = gm.group_id
          WHERE gm.prediction_share_token = ?`
        ).bind(shareToken)
  )

  const batchResults = await db.batch(stmts)

  let leaderboardRank: number | null = null
  let groupResultIdx: number
  if (isPublicScored) {
    const rankRow = batchResults[0].results?.[0] as Record<string, unknown> | undefined
    leaderboardRank = (rankRow?.['rank'] as number) ?? null
    groupResultIdx = 1
  } else {
    groupResultIdx = 0
  }

  const groupRows = batchResults[groupResultIdx].results as Record<string, unknown>[]
  const groups = groupRows.map((gr) => ({
    groupToken: gr['group_token'] as string,
    name: gr['name'] as string,
    memberRank: isPublicScored ? ((gr['member_rank'] as number) ?? null) : null,
    memberCount: gr['member_count'] as number,
  }))

  return {
    displayName: row['display_name'],
    visibility: row['visibility'],
    status: row['status'],
    listWinnerId: row['list_winner_id'] ?? null,
    pctMkkp: row['pct_mkkp'] ?? null,
    pctTisza: row['pct_tisza'] ?? null,
    pctMiHazank: row['pct_mi_hazank'] ?? null,
    pctDk: row['pct_dk'] ?? null,
    pctFideszKdnp: row['pct_fidesz_kdnp'] ?? null,
    pctNationalities: row['pct_nationalities'] ?? null,
    pmWinnerId: row['pm_winner_id'] ?? null,
    participationRate: (row['participation_rate'] as number) ?? null,
    telexTipId: (row['telex_tip_id'] as string) ?? null,
    locationCountry: (row['location_country'] as string) ?? 'hu',
    locationSettlement: locationIsPublic ? (row['location_settlement'] ?? null) : null,
    locationZip: locationIsPublic ? (row['location_zip'] ?? null) : null,
    finalizedAt: row['finalized_at'] ?? null,
    score: RESULTS_AVAILABLE ? (score ?? null) : null,
    leaderboardRank,
    groups,
  }
}
