import { REFERENCE_RESULT } from './types'
import type { LeaderboardEntry, PartyId } from './types'

/** Fields required to compute the v2 score (same formula as the live app breakdown). */
export type ScoreBreakdownInput = Pick<
  LeaderboardEntry,
  | 'listWinnerId'
  | 'pmWinnerId'
  | 'pctMkkp'
  | 'pctTisza'
  | 'pctMiHazank'
  | 'pctDk'
  | 'pctFideszKdnp'
  | 'pctNationalities'
  | 'participationRate'
>

export type ScoreBreakdownResult = {
  listPts: number
  pmPts: number
  pctPts: number
  natPts: number
  attPts: number
  total: number
}

export function computeScoreBreakdown(entry: ScoreBreakdownInput): ScoreBreakdownResult {
  const listPts = entry.listWinnerId === REFERENCE_RESULT.listWinnerId ? 5 : 0
  const pmPts = entry.pmWinnerId === REFERENCE_RESULT.pmWinnerId ? 10 : 0

  const pctFields: [keyof ScoreBreakdownInput, PartyId][] = [
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
  const pctPtsRaw = Math.max(0, 70 * (1 - mae / 30))

  let natPts = 0
  if (entry.pctNationalities != null) {
    const natErr = Math.abs(entry.pctNationalities - REFERENCE_RESULT.pctNationalities)
    natPts = Math.max(0, 5 * (1 - natErr / 0.5))
  }

  let attPts = 0
  if (entry.participationRate != null) {
    const attErr = Math.abs(entry.participationRate - REFERENCE_RESULT.participationRate)
    attPts = Math.max(0, 10 * (1 - attErr / 20))
  }

  const total = listPts + pmPts + pctPtsRaw + natPts + attPts
  return {
    listPts,
    pmPts,
    pctPts: Math.round(pctPtsRaw * 10) / 10,
    natPts: Math.round(natPts * 10) / 10,
    attPts: Math.round(attPts * 10) / 10,
    total: Math.round(total * 10) / 10,
  }
}
