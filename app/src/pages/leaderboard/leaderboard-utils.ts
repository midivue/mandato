import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { REFERENCE_RESULT } from '@mandatoto/shared/types'
import type { LeaderboardEntry, PartyId } from '@mandatoto/shared/types'

export const WINNER_PARTY = PARTY_OPTIONS.find((p) => p.id === REFERENCE_RESULT.listWinnerId)
export const WINNER_PM = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === REFERENCE_RESULT.pmWinnerId)

export function computeScoreBreakdown(entry: LeaderboardEntry) {
  // List winner: 5 pts
  const listPts = entry.listWinnerId === REFERENCE_RESULT.listWinnerId ? 5 : 0

  // PM winner: 10 pts
  const pmPts = entry.pmWinnerId === REFERENCE_RESULT.pmWinnerId ? 10 : 0

  // 5-party MAE: 70 pts (nationalities excluded)
  const pctFields: [keyof LeaderboardEntry, PartyId][] = [
    ['pctMkkp', 'mkkp'],
    ['pctTisza', 'tisza'],
    ['pctMiHazank', 'mi_hazank'],
    ['pctDk', 'dk'],
    ['pctFideszKdnp', 'fidesz_kdnp'],
  ]
  let sumAbsErr = 0
  let count = 0
  for (const [key, partyId] of pctFields) {
    const predicted = entry[key] as number | null
    if (predicted == null) continue
    sumAbsErr += Math.abs(predicted - REFERENCE_RESULT.percentages[partyId])
    count++
  }
  const mae = count > 0 ? sumAbsErr / count : 30
  const pctPts = Math.max(0, 70 * (1 - mae / 30))

  // Nationalities: 5 pts (separate, tight 0.5pp cap)
  let natPts = 0
  if (entry.pctNationalities != null) {
    const natErr = Math.abs(entry.pctNationalities - REFERENCE_RESULT.pctNationalities)
    natPts = Math.max(0, 5 * (1 - natErr / 0.5))
  }

  // Attendance: 10 pts (20pp cap)
  let attPts = 0
  if (entry.participationRate != null) {
    const attErr = Math.abs(entry.participationRate - REFERENCE_RESULT.participationRate)
    attPts = Math.max(0, 10 * (1 - attErr / 20))
  }

  const total = listPts + pmPts + pctPts + natPts + attPts
  return {
    listPts,
    pmPts,
    pctPts: Math.round(pctPts * 10) / 10,
    natPts: Math.round(natPts * 10) / 10,
    attPts: Math.round(attPts * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}
