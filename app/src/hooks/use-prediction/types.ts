import type { PartyId } from '@/data/election-options'

export type VotingDraft = {
  token: string
  shareToken: string
  displayName: string
  visibility: 'public' | 'private'
  pmCandidateId: PartyId | null
  listPartyId: PartyId | null
  listPercents: Record<PartyId, string>
  nationalitiesPercent: string
  participationRate: string
  status: 'draft' | 'finalized'
  locationCountry: 'hu' | 'abroad'
  locationSettlement: string | null
  locationZip: string | null
  locationPublic: boolean
  updatedAt: string | null
  finalizedAt: string | null
}

export type PercentFieldId = PartyId | 'nationalities'

export type LegacyDraft = {
  token?: string
  displayName?: string
  visibility?: string
  pmCandidateId?: string
  listPartyId?: string
  listPercents?: Record<string, string>
  listWinnerPercent?: string
  status?: string
}

export const LOCAL_DRAFT_TOKEN = ''

export const PARTY_IDS: PartyId[] = ['mkkp', 'tisza', 'mi_hazank', 'dk', 'fidesz_kdnp']
export const ALL_PERCENT_FIELDS: PercentFieldId[] = [...PARTY_IDS, 'nationalities']

export const DEFAULT_LIST_PERCENTS: Record<PartyId, string> = {
  mkkp: '',
  tisza: '',
  mi_hazank: '',
  dk: '',
  fidesz_kdnp: '',
}
