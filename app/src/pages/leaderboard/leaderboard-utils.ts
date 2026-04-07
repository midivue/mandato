import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { computeScoreBreakdown as computeScoreBreakdownShared } from '@mandatoto/shared/scoring'
import { REFERENCE_RESULT } from '@mandatoto/shared/types'
import type { LeaderboardEntry } from '@mandatoto/shared/types'

export const WINNER_PARTY = PARTY_OPTIONS.find((p) => p.id === REFERENCE_RESULT.listWinnerId)
export const WINNER_PM = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === REFERENCE_RESULT.pmWinnerId)

export function computeScoreBreakdown(entry: LeaderboardEntry) {
  return computeScoreBreakdownShared(entry)
}
