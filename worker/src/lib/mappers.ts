import type { PartyId, Prediction } from '@mandatoto/shared/types'

export const PCT_COLUMNS = {
  mkkp: 'pct_mkkp',
  tisza: 'pct_tisza',
  mi_hazank: 'pct_mi_hazank',
  dk: 'pct_dk',
  fidesz_kdnp: 'pct_fidesz_kdnp',
} as const

export function rowToPrediction(row: Record<string, unknown>): Prediction {
  return {
    token: row['token'] as string,
    shareToken: row['share_token'] as string,
    displayName: row['display_name'] as string,
    visibility: row['visibility'] as Prediction['visibility'],
    status: row['status'] as Prediction['status'],
    listWinnerId: (row['list_winner_id'] as PartyId) ?? null,
    pctMkkp: (row['pct_mkkp'] as number) ?? null,
    pctTisza: (row['pct_tisza'] as number) ?? null,
    pctMiHazank: (row['pct_mi_hazank'] as number) ?? null,
    pctDk: (row['pct_dk'] as number) ?? null,
    pctFideszKdnp: (row['pct_fidesz_kdnp'] as number) ?? null,
    pctNationalities: (row['pct_nationalities'] as number) ?? null,
    pmWinnerId: (row['pm_winner_id'] as PartyId) ?? null,
    participationRate: (row['participation_rate'] as number) ?? null,
    telexTipId: (row['telex_tip_id'] as string) ?? null,
    locationCountry: (row['location_country'] as string ?? 'hu') as Prediction['locationCountry'],
    locationSettlement: (row['location_settlement'] as string) ?? null,
    locationZip: (row['location_zip'] as string) ?? null,
    locationPublic: row['location_public'] === 1,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
    finalizedAt: (row['finalized_at'] as string) ?? null,
    score: (row['score'] as number) ?? null,
  }
}
