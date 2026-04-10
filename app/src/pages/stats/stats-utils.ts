import { PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { SETTLEMENTS } from '@/data/settlements'
import { PARTY_IDS } from '@mandatoto/shared/types'
import type { StatsResponse } from '@mandatoto/shared/types'

export const PM_NAME: Record<string, string> = Object.fromEntries(
  PRIME_MINISTER_OPTIONS.map((pm) => [pm.id, pm.candidateName]),
)

export function pct(n: number, total: number): string {
  if (total === 0) return '0'
  return ((n / total) * 100).toFixed(0)
}

export function deltaClass(delta: number): string {
  const abs = Math.abs(delta)
  if (abs <= 2) return 'text-emerald-600'
  if (abs <= 5) return 'text-amber-600'
  return 'text-red-600'
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}`
}

export const ZIP_TO_COUNTY = new Map<string, number>()
export const ZIP_TO_SETTLEMENT = new Map<string, string>()
for (const s of SETTLEMENTS) {
  if (!ZIP_TO_COUNTY.has(s.zip)) ZIP_TO_COUNTY.set(s.zip, s.countyId)
  if (!ZIP_TO_SETTLEMENT.has(s.zip)) ZIP_TO_SETTLEMENT.set(s.zip, s.name)
}

export const TOTAL_SETTLEMENTS = 3155
export const TOTAL_COUNTIES = 20
export const TOTAL_DISTRICTS = 23
export const TOTAL_EU_COUNTRIES = 43
export const TOTAL_WORLD_COUNTRIES = 196

export const TAG_CLOUD_LIMIT = 50
export const REST_MIN_FONT = 11
export const REST_MAX_FONT = 22

export const EMPTY_STATS: StatsResponse = {
  totalPredictions: 0,
  publicPredictions: 0,
  privatePredictions: 0,
  avgScore: null,
  correctListWinner: 0,
  correctPm: 0,
  pmWinnerCounts: {},
  listWinnerCounts: {},
  averagePercents: { ...Object.fromEntries(PARTY_IDS.map((id) => [id, null])), nationalities: null } as StatsResponse['averagePercents'],
  geoBreakdown: { byZip: {}, byCountry: {}, noSettlement: 0, abroad: 0 },
  groupStats: { totalGroups: 0, publicGroups: 0, privateGroups: 0, avgGroupSize: null, maxGroupSize: 0, uniqueMembers: 0, totalMemberships: 0 },
  scoreDistribution: {},
  avgAbsoluteErrors: { ...Object.fromEntries(PARTY_IDS.map((id) => [id, null])), nationalities: null } as StatsResponse['avgAbsoluteErrors'],
  topScorers: [],
  averageParticipationRate: null,
  telexTipCount: 0,
}

export function zipToCounty(zip: string): number | undefined {
  const direct = ZIP_TO_COUNTY.get(zip)
  if (direct !== undefined) return direct
  if (zip.length === 4 && zip.startsWith('1')) return 1
  return undefined
}

export function zipToDistrict(zip: string): number | undefined {
  if (zip.length === 4 && zip.startsWith('1')) {
    const district = parseInt(zip.substring(1, 3), 10)
    if (district >= 1 && district <= 23) return district
  }
  return undefined
}
