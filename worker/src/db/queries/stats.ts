import { RESULTS_AVAILABLE, REFERENCE_RESULT } from '@mandatoto/shared/types'

export async function getStatsData(db: D1Database) {
  const ref = REFERENCE_RESULT.percentages

  const stmts = [
    /* 0  */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE status = 'finalized'"),
    /* 1  */ db.prepare('SELECT AVG(score) as avg FROM predictions WHERE score IS NOT NULL'),
    /* 2  */ db.prepare("SELECT pm_winner_id, COUNT(*) as count FROM predictions WHERE pm_winner_id IS NOT NULL AND status = 'finalized' GROUP BY pm_winner_id"),
    /* 3  */ db.prepare("SELECT list_winner_id, COUNT(*) as count FROM predictions WHERE list_winner_id IS NOT NULL AND status = 'finalized' GROUP BY list_winner_id"),
    /* 4  */ db.prepare("SELECT AVG(pct_mkkp) as mkkp, AVG(pct_tisza) as tisza, AVG(pct_mi_hazank) as mi_hazank, AVG(pct_dk) as dk, AVG(pct_fidesz_kdnp) as fidesz_kdnp, AVG(pct_nationalities) as nationalities FROM predictions WHERE status = 'finalized'"),
    /* 5  */ db.prepare("SELECT location_zip, COUNT(*) as count FROM predictions WHERE location_country != 'abroad' AND location_zip IS NOT NULL AND status = 'finalized' AND visibility = 'public' AND location_public = 1 GROUP BY location_zip"),
    /* 6  */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE (location_country = 'hu' OR location_country IS NULL) AND location_zip IS NULL AND status = 'finalized' AND visibility = 'public' AND location_public = 1"),
    /* 7  */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE location_country = 'abroad' AND status = 'finalized' AND visibility = 'public' AND location_public = 1"),
    /* 8  */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE visibility = 'public' AND status = 'finalized'"),
    /* 9  */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE visibility = 'private' AND status = 'finalized'"),
    /* 10 */ db.prepare("SELECT location_zip, COUNT(*) as count FROM predictions WHERE location_country = 'abroad' AND location_zip IS NOT NULL AND status = 'finalized' AND visibility = 'public' AND location_public = 1 GROUP BY location_zip"),
    /* 11 */ db.prepare('SELECT COUNT(*) as count FROM groups'),
    /* 12 */ db.prepare("SELECT COUNT(*) as count FROM groups WHERE visibility = 'public'"),
    /* 13 */ db.prepare("SELECT COUNT(*) as count FROM groups WHERE visibility = 'private'"),
    /* 14 */ db.prepare('SELECT AVG(member_count) as avg FROM (SELECT COUNT(*) as member_count FROM group_members GROUP BY group_id)'),
    /* 15 */ db.prepare('SELECT MAX(member_count) as max FROM (SELECT COUNT(*) as member_count FROM group_members GROUP BY group_id)'),
    /* 16 */ db.prepare('SELECT COUNT(DISTINCT prediction_share_token) as count FROM group_members'),
    /* 17 */ db.prepare('SELECT COUNT(*) as count FROM group_members'),
    /* 18 */ db.prepare("SELECT CAST(score/10 AS INTEGER)*10 as bracket, COUNT(*) as count FROM predictions WHERE score IS NOT NULL GROUP BY bracket ORDER BY bracket"),
    /* 19 */ db.prepare("SELECT AVG(ABS(pct_mkkp - ?)) as mkkp, AVG(ABS(pct_tisza - ?)) as tisza, AVG(ABS(pct_mi_hazank - ?)) as mi_hazank, AVG(ABS(pct_dk - ?)) as dk, AVG(ABS(pct_fidesz_kdnp - ?)) as fidesz_kdnp, AVG(ABS(pct_nationalities - ?)) as nationalities FROM predictions WHERE status = 'finalized'")
      .bind(ref.mkkp, ref.tisza, ref.mi_hazank, ref.dk, ref.fidesz_kdnp, REFERENCE_RESULT.pctNationalities),
    /* 20 */ db.prepare("SELECT display_name, score, share_token FROM predictions WHERE score IS NOT NULL AND visibility = 'public' ORDER BY score DESC LIMIT 3"),
    /* 21 */ db.prepare("SELECT AVG(participation_rate) as avg_pr FROM predictions WHERE status = 'finalized' AND participation_rate IS NOT NULL"),
    /* 22 */ db.prepare("SELECT COUNT(*) as count FROM predictions WHERE status = 'finalized' AND telex_tip_id IS NOT NULL"),
  ]

  const correctStmts = RESULTS_AVAILABLE ? [
    db.prepare("SELECT COUNT(*) as count FROM predictions WHERE status = 'finalized' AND list_winner_id = ?").bind(REFERENCE_RESULT.listWinnerId),
    db.prepare("SELECT COUNT(*) as count FROM predictions WHERE status = 'finalized' AND pm_winner_id = ?").bind(REFERENCE_RESULT.pmWinnerId),
  ] : []

  const allResults = await db.batch([...stmts, ...correctStmts])

  const row = (i: number) => allResults[i].results?.[0] as Record<string, unknown> | undefined
  const rows = (i: number) => allResults[i].results as Record<string, unknown>[]

  const total = row(0)
  const avgScoreRow = row(1)
  const pmCounts = rows(2)
  const listCounts = rows(3)
  const avgPcts = row(4)
  const geoByZip = rows(5)
  const geoNoSettlement = row(6)
  const geoAbroad = row(7)
  const publicCount = row(8)
  const privateCount = row(9)
  const abroadByCountry = rows(10)
  const groupsTotal = row(11)
  const groupsPublic = row(12)
  const groupsPrivate = row(13)
  const groupsAvgSize = row(14)
  const groupsMaxSize = row(15)
  const groupsUniqueMembers = row(16)
  const groupsTotalMembers = row(17)
  const scoreDist = rows(18)
  const absErrors = row(19)
  const topScorerRows = rows(20)
  const avgPrRow = row(21)
  const telexTipRow = row(22)

  let correctListWinner = 0
  let correctPm = 0
  if (RESULTS_AVAILABLE) {
    const correctList = allResults[23].results?.[0] as Record<string, unknown> | undefined
    const correctPmRow = allResults[24].results?.[0] as Record<string, unknown> | undefined
    correctListWinner = (correctList?.['count'] as number) ?? 0
    correctPm = (correctPmRow?.['count'] as number) ?? 0
  }

  return {
    totalPredictions: total?.['count'] ?? 0,
    publicPredictions: (publicCount?.['count'] as number) ?? 0,
    privatePredictions: (privateCount?.['count'] as number) ?? 0,
    avgScore: RESULTS_AVAILABLE ? (avgScoreRow?.['avg'] ?? null) : null,
    correctListWinner,
    correctPm,
    pmWinnerCounts: Object.fromEntries(
      pmCounts.map((r) => [r['pm_winner_id'], r['count']])
    ),
    listWinnerCounts: Object.fromEntries(
      listCounts.map((r) => [r['list_winner_id'], r['count']])
    ),
    averagePercents: {
      mkkp: avgPcts?.['mkkp'] ?? null,
      tisza: avgPcts?.['tisza'] ?? null,
      mi_hazank: avgPcts?.['mi_hazank'] ?? null,
      dk: avgPcts?.['dk'] ?? null,
      fidesz_kdnp: avgPcts?.['fidesz_kdnp'] ?? null,
      nationalities: avgPcts?.['nationalities'] ?? null,
    },
    geoBreakdown: {
      byZip: Object.fromEntries(
        geoByZip.map((r) => [r['location_zip'] as string, r['count'] as number])
      ),
      byCountry: Object.fromEntries(
        abroadByCountry.map((r) => [r['location_zip'] as string, r['count'] as number])
      ),
      noSettlement: (geoNoSettlement?.['count'] as number) ?? 0,
      abroad: (geoAbroad?.['count'] as number) ?? 0,
    },
    groupStats: {
      totalGroups: (groupsTotal?.['count'] as number) ?? 0,
      publicGroups: (groupsPublic?.['count'] as number) ?? 0,
      privateGroups: (groupsPrivate?.['count'] as number) ?? 0,
      avgGroupSize: groupsAvgSize?.['avg'] != null ? Number(groupsAvgSize['avg']) : null,
      maxGroupSize: (groupsMaxSize?.['max'] as number) ?? 0,
      uniqueMembers: (groupsUniqueMembers?.['count'] as number) ?? 0,
      totalMemberships: (groupsTotalMembers?.['count'] as number) ?? 0,
    },
    scoreDistribution: Object.fromEntries(
      scoreDist.map((r) => [String(r['bracket']), r['count'] as number])
    ),
    avgAbsoluteErrors: RESULTS_AVAILABLE ? {
      mkkp: absErrors?.['mkkp'] != null ? Number(absErrors['mkkp']) : null,
      tisza: absErrors?.['tisza'] != null ? Number(absErrors['tisza']) : null,
      mi_hazank: absErrors?.['mi_hazank'] != null ? Number(absErrors['mi_hazank']) : null,
      dk: absErrors?.['dk'] != null ? Number(absErrors['dk']) : null,
      fidesz_kdnp: absErrors?.['fidesz_kdnp'] != null ? Number(absErrors['fidesz_kdnp']) : null,
      nationalities: absErrors?.['nationalities'] != null ? Number(absErrors['nationalities']) : null,
    } : { mkkp: null, tisza: null, mi_hazank: null, dk: null, fidesz_kdnp: null, nationalities: null },
    topScorers: RESULTS_AVAILABLE ? topScorerRows.map((r) => ({
      displayName: r['display_name'] as string,
      score: r['score'] as number,
      shareToken: r['share_token'] as string,
    })) : [],
    averageParticipationRate: avgPrRow?.['avg_pr'] != null ? Number(avgPrRow['avg_pr']) : null,
    telexTipCount: (telexTipRow?.['count'] as number) ?? 0,
  }
}
