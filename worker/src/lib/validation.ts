import { PARTY_IDS, type PartyId } from '@mandatoto/shared/types'

export function isValidPartyId(value: unknown): value is PartyId {
  return typeof value === 'string' && (PARTY_IDS as string[]).includes(value)
}

export function isValidPercent(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
}
