import { storage } from '@/lib/storage'
import { CUTOFF_AT } from '@mandatoto/shared/types'
import type { GroupMember, PartyId } from '@mandatoto/shared/types'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'

export const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

export const PCT_KEYS: { id: PartyId; key: keyof GroupMember }[] = [
  { id: 'mkkp', key: 'pctMkkp' },
  { id: 'tisza', key: 'pctTisza' },
  { id: 'mi_hazank', key: 'pctMiHazank' },
  { id: 'dk', key: 'pctDk' },
  { id: 'fidesz_kdnp', key: 'pctFideszKdnp' },
]

export function sortMembersByGroupScore(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => {
    const sa = a.score
    const sb = b.score
    if (sa != null && sb != null && sa !== sb) return sb - sa
    if (sa != null && sb == null) return -1
    if (sa == null && sb != null) return 1
    return a.groupRank - b.groupRank
  })
}

export function pctDeviationClass(guess: number | null, actual: number): string {
  if (!RESULTS_AVAILABLE || guess === null) return ''
  const abs = Math.abs(guess - actual)
  if (abs <= 1) return 'text-emerald-700 bg-emerald-50'
  if (abs <= 3) return 'text-blue-700 bg-blue-50'
  if (abs <= 5) return 'text-orange-700 bg-orange-50'
  return 'text-red-700 bg-red-50'
}

export function extractShareToken(input: string): string {
  const trimmed = input.trim()
  const tippMatch = trimmed.match(/#tipp\/(.+)/)
  if (tippMatch) return tippMatch[1]
  const urlMatch = trimmed.match(/tipp\/([a-f0-9]+)/i)
  if (urlMatch) return urlMatch[1]
  return trimmed
}

export function removeGroupFromLocalStorage(groupToken: string) {
  const groups = storage.getGroups()
  storage.setGroups(groups.filter(g => g.groupToken !== groupToken))
}
