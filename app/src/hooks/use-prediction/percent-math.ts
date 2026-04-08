import type { Prediction, PredictionUpdate } from '@mandatoto/shared/types'
import { PARTY_LIST_THRESHOLD, TOTAL_ELIGIBLE_VOTERS } from '@mandatoto/shared/types'
import type { PartyId } from '@/data/election-options'
import {
  type VotingDraft,
  type PercentFieldId,
  type LegacyDraft,
  LOCAL_DRAFT_TOKEN,
  ALL_PERCENT_FIELDS,
  DEFAULT_LIST_PERCENTS,
} from './types'

export function getPercentValue(draft: VotingDraft, field: PercentFieldId): string {
  return field === 'nationalities' ? draft.nationalitiesPercent : draft.listPercents[field]
}

export function deriveLockedPercents(draft: VotingDraft): Record<string, boolean> {
  const locked: Record<string, boolean> = {}
  for (const field of ALL_PERCENT_FIELDS) {
    if (getPercentValue(draft, field).trim() !== '') {
      locked[field] = true
    }
  }
  return locked
}

export function isBelowThreshold(value: string): boolean {
  if (value.trim() === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed < PARTY_LIST_THRESHOLD
}

export function isValidPercent(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100
}

export function isLocalDraft(draft: VotingDraft): boolean {
  return draft.token === LOCAL_DRAFT_TOKEN
}

export function redistributePercents(
  draft: VotingDraft,
  changedField: PercentFieldId,
  newValue: string,
  locked: Record<string, boolean>,
): VotingDraft {
  let lockedSum = 0
  for (const field of ALL_PERCENT_FIELDS) {
    if (locked[field]) {
      const str = field === changedField ? newValue : getPercentValue(draft, field)
      const num = Number(str)
      if (Number.isFinite(num)) lockedSum += num
    }
  }

  const autoFields = ALL_PERCENT_FIELDS.filter((f) => !locked[f])
  const remaining = Math.max(0, 100 - lockedSum)

  const newListPercents = { ...draft.listPercents }
  let newNatPercent = draft.nationalitiesPercent

  if (changedField === 'nationalities') {
    newNatPercent = newValue
  } else {
    newListPercents[changedField] = newValue
  }

  if (autoFields.length > 0) {
    // Use current values as proportional weights so ratios are preserved.
    // If all auto fields are empty/zero, fall back to equal distribution.
    const autoWeights = autoFields.map((f) => {
      const str = f === 'nationalities' ? newNatPercent : newListPercents[f]
      const n = Number(str)
      return Number.isFinite(n) && n > 0 ? n : 0
    })
    const weightSum = autoWeights.reduce((a, b) => a + b, 0)

    let assigned = 0
    for (let i = 0; i < autoFields.length; i++) {
      const field = autoFields[i]
      let val: number
      if (i === autoFields.length - 1) {
        val = Math.round((remaining - assigned) * 100) / 100
      } else if (weightSum > 0) {
        val = Math.round(remaining * (autoWeights[i] / weightSum) * 100) / 100
      } else {
        val = Math.floor((remaining / autoFields.length) * 100) / 100
      }
      assigned += val
      const strVal = String(val)
      if (field === 'nationalities') {
        newNatPercent = strVal
      } else {
        newListPercents[field] = strVal
      }
    }
  }

  return {
    ...draft,
    listPercents: newListPercents,
    nationalitiesPercent: newNatPercent,
  }
}

export function computeVoterCount(participationRate: string): number | null {
  const pct = Number(participationRate)
  if (!Number.isFinite(pct) || pct <= 0) return null
  return Math.round(TOTAL_ELIGIBLE_VOTERS * pct / 100)
}

export function computeVoteCount(pct: string, participationRate: string): number | null {
  const p = Number(pct)
  const r = Number(participationRate)
  if (!Number.isFinite(p) || p < 0 || !Number.isFinite(r) || r <= 0) return null
  return Math.round(TOTAL_ELIGIBLE_VOTERS * r / 100 * p / 100)
}

export function makeLocalDraft(): VotingDraft {
  return {
    token: LOCAL_DRAFT_TOKEN,
    shareToken: '',
    displayName: `Anonymous${Math.floor(1000 + Math.random() * 9000)}`,
    visibility: 'public',
    pmCandidateId: null,
    listPartyId: null,
    listPercents: {
      mkkp: '19.95',
      tisza: '19.95',
      mi_hazank: '19.95',
      dk: '19.95',
      fidesz_kdnp: '19.95',
    },
    nationalitiesPercent: '0.25',
    participationRate: '70',
    status: 'draft',
    locationCountry: 'hu',
    locationSettlement: null,
    locationZip: null,
    locationPublic: true,
    updatedAt: null,
    finalizedAt: null,
  }
}

function pctToString(val: number | null): string {
  return val === null ? '' : String(val)
}

export function stringToPct(val: string): number | null {
  if (val.trim() === '') return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
}

export function predictionToDraft(p: Prediction): VotingDraft {
  return {
    token: p.token,
    shareToken: p.shareToken,
    displayName: p.displayName,
    visibility: p.visibility,
    pmCandidateId: p.pmWinnerId,
    listPartyId: p.listWinnerId,
    listPercents: {
      mkkp: pctToString(p.pctMkkp),
      tisza: pctToString(p.pctTisza),
      mi_hazank: pctToString(p.pctMiHazank),
      dk: pctToString(p.pctDk),
      fidesz_kdnp: pctToString(p.pctFideszKdnp),
    },
    nationalitiesPercent: pctToString(p.pctNationalities),
    participationRate: p.participationRate != null ? String(p.participationRate) : '70',
    status: p.status,
    locationCountry: p.locationCountry ?? 'hu',
    locationSettlement: p.locationSettlement ?? null,
    locationZip: p.locationZip ?? null,
    locationPublic: p.locationPublic ?? false,
    updatedAt: p.updatedAt ?? null,
    finalizedAt: p.finalizedAt ?? null,
  }
}

export function draftToUpdate(draft: VotingDraft): PredictionUpdate {
  return {
    displayName: draft.displayName,
    visibility: draft.visibility,
    listWinnerId: draft.listPartyId,
    pctMkkp: stringToPct(draft.listPercents.mkkp),
    pctTisza: stringToPct(draft.listPercents.tisza),
    pctMiHazank: stringToPct(draft.listPercents.mi_hazank),
    pctDk: stringToPct(draft.listPercents.dk),
    pctFideszKdnp: stringToPct(draft.listPercents.fidesz_kdnp),
    pctNationalities: stringToPct(draft.nationalitiesPercent),
    participationRate: stringToPct(draft.participationRate),
    pmWinnerId: draft.pmCandidateId,
    locationCountry: draft.locationCountry,
    locationSettlement: draft.locationSettlement,
    locationZip: draft.locationZip,
    locationPublic: draft.locationPublic,
  }
}

export function migrateLegacyDraft(raw: LegacyDraft): {
  displayName: string
  visibility: 'public' | 'private'
  listWinnerId: PartyId | null
  pmWinnerId: PartyId | null
  pcts: Record<PartyId, number | null>
} {
  const percents = { ...DEFAULT_LIST_PERCENTS, ...(raw.listPercents ?? {}) }
  if (raw.listPartyId && raw.listWinnerPercent && !percents[raw.listPartyId as PartyId]) {
    percents[raw.listPartyId as PartyId] = raw.listWinnerPercent
  }

  return {
    displayName: raw.displayName || `Anonymous${Math.floor(1000 + Math.random() * 9000)}`,
    visibility: raw.visibility === 'private' ? 'private' : 'public',
    listWinnerId: (raw.listPartyId as PartyId) ?? null,
    pmWinnerId: (raw.pmCandidateId as PartyId) ?? null,
    pcts: {
      mkkp: stringToPct(percents.mkkp),
      tisza: stringToPct(percents.tisza),
      mi_hazank: stringToPct(percents.mi_hazank),
      dk: stringToPct(percents.dk),
      fidesz_kdnp: stringToPct(percents.fidesz_kdnp),
    },
  }
}
