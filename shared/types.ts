export type PartyId = 'mkkp' | 'tisza' | 'mi_hazank' | 'dk' | 'fidesz_kdnp'

export const PARTY_IDS: PartyId[] = ['mkkp', 'tisza', 'mi_hazank', 'dk', 'fidesz_kdnp']

export const TOTAL_ELIGIBLE_VOTERS = 7_618_706

export type PredictionVisibility = 'public' | 'private'
export type PredictionStatus = 'draft' | 'finalized'
export type LocationCountry = 'hu' | 'abroad'

export type Prediction = {
  token: string
  shareToken: string
  displayName: string
  visibility: PredictionVisibility
  status: PredictionStatus
  listWinnerId: PartyId | null
  pctMkkp: number | null
  pctTisza: number | null
  pctMiHazank: number | null
  pctDk: number | null
  pctFideszKdnp: number | null
  pctNationalities: number | null
  pmWinnerId: PartyId | null
  participationRate: number | null
  telexTipId: string | null
  locationCountry: LocationCountry
  locationSettlement: string | null
  locationZip: string | null
  locationPublic: boolean
  createdAt: string
  updatedAt: string
  finalizedAt: string | null
  score: number | null
}

export type PredictionUpdate = {
  displayName?: string
  visibility?: PredictionVisibility
  listWinnerId?: PartyId | null
  pctMkkp?: number | null
  pctTisza?: number | null
  pctMiHazank?: number | null
  pctDk?: number | null
  pctFideszKdnp?: number | null
  pctNationalities?: number | null
  pmWinnerId?: PartyId | null
  participationRate?: number | null
  telexTipId?: string | null
  locationCountry?: LocationCountry
  locationSettlement?: string | null
  locationZip?: string | null
  locationPublic?: boolean
}

export type CreatePredictionRequest = {
  displayName?: string
  visibility?: PredictionVisibility
  listWinnerId?: PartyId | null
  pctMkkp?: number | null
  pctTisza?: number | null
  pctMiHazank?: number | null
  pctDk?: number | null
  pctFideszKdnp?: number | null
  pctNationalities?: number | null
  pmWinnerId?: PartyId | null
  participationRate?: number | null
  telexTipId?: string | null
  locationCountry?: LocationCountry
  locationSettlement?: string | null
  locationZip?: string | null
  locationPublic?: boolean
}

export type SharedPrediction = {
  displayName: string
  visibility: PredictionVisibility
  status: PredictionStatus
  listWinnerId: PartyId | null
  pctMkkp: number | null
  pctTisza: number | null
  pctMiHazank: number | null
  pctDk: number | null
  pctFideszKdnp: number | null
  pctNationalities: number | null
  pmWinnerId: PartyId | null
  participationRate: number | null
  telexTipId: string | null
  locationCountry: LocationCountry
  locationSettlement: string | null
  locationZip: string | null
  finalizedAt: string | null
  score: number | null
  leaderboardRank: number | null
  groups?: { groupToken: string; name: string; memberRank: number | null; memberCount: number }[]
}

export type LeaderboardEntry = {
  rank: number | null
  displayName: string
  shareToken: string
  score: number | null
  listWinnerId: PartyId | null
  pmWinnerId: PartyId | null
  finalizedAt: string | null
  pctMkkp: number | null
  pctTisza: number | null
  pctMiHazank: number | null
  pctDk: number | null
  pctFideszKdnp: number | null
  pctNationalities: number | null
  participationRate: number | null
}

export type GeoBreakdown = {
  byZip: Record<string, number>
  byCountry: Record<string, number>
  noSettlement: number
  abroad: number
}

export type GroupStats = {
  totalGroups: number
  publicGroups: number
  privateGroups: number
  avgGroupSize: number | null
  maxGroupSize: number
  uniqueMembers: number
  totalMemberships: number
}

export type TopScorer = {
  displayName: string
  score: number
  shareToken: string
}

export type StatsResponse = {
  totalPredictions: number
  publicPredictions: number
  privatePredictions: number
  avgScore: number | null
  correctListWinner: number
  correctPm: number
  pmWinnerCounts: Record<string, number>
  listWinnerCounts: Record<string, number>
  averagePercents: Record<PartyId, number | null> & { nationalities: number | null }
  geoBreakdown: GeoBreakdown
  groupStats: GroupStats
  scoreDistribution: Record<string, number>
  avgAbsoluteErrors: Record<PartyId, number | null> & { nationalities: number | null }
  topScorers: TopScorer[]
  averageParticipationRate: number | null
}

export type GroupMember = {
  shareToken: string
  displayName: string
  score: number | null
  listWinnerId: PartyId | null
  pmWinnerId: PartyId | null
  pctMkkp: number | null
  pctTisza: number | null
  pctMiHazank: number | null
  pctDk: number | null
  pctFideszKdnp: number | null
  pctNationalities: number | null
  participationRate: number | null
  finalizedAt: string | null
  groupRank: number
  globalRank: number | null
}

export type GroupDetail = {
  name: string
  groupToken: string
  visibility: 'public' | 'private'
  createdAt: string
  members: GroupMember[]
}

export type BestGroupEntry = {
  groupToken: string
  name: string
  memberCount: number
  avgScore: number | null
}

export const RESULTS_AVAILABLE = false
export const VOTE_PROCESSING_PCT = 80
export const CUTOFF_AT = '2026-04-12T06:00:00+02:00'
export const PARTY_LIST_THRESHOLD = 5

export type ElectionResult = {
  listWinnerId: PartyId
  pmWinnerId: PartyId
  percentages: Record<PartyId, number>
  pctNationalities: number
  participationRate: number
}

export const REFERENCE_RESULT: ElectionResult = {
  listWinnerId: 'tisza' as PartyId,
  pmWinnerId: 'tisza' as PartyId,
  percentages: {
    mkkp: 2.8,
    tisza: 44.6,
    mi_hazank: 6.9,
    dk: 4.3,
    fidesz_kdnp: 35.2,
  },
  pctNationalities: 0.44,
  participationRate: 68.0,
}
