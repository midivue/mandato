import type { SharedPrediction, PartyId } from '@mandatoto/shared/types'
import { TOTAL_ELIGIBLE_VOTERS } from '@mandatoto/shared/types'

export function pctDisplay(val: number | null): string {
  if (val === null) return '—'
  return `${val}%`
}

export function voteEstimate(pct: number | null, participationRate: number | null): number | null {
  if (pct === null || participationRate === null || pct <= 0 || participationRate <= 0) return null
  return Math.round(TOTAL_ELIGIBLE_VOTERS * participationRate / 100 * pct / 100)
}

export const PCT_KEYS: Record<PartyId, keyof SharedPrediction> = {
  mkkp: 'pctMkkp',
  tisza: 'pctTisza',
  mi_hazank: 'pctMiHazank',
  dk: 'pctDk',
  fidesz_kdnp: 'pctFideszKdnp',
}
