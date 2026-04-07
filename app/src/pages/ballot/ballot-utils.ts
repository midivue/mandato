import { PARTY_OPTIONS } from '@/data/election-options'
import type { VotingDraft } from '@/hooks/use-prediction'

export function downloadDraftData(draft: VotingDraft) {
  const data = {
    token: draft.token,
    displayName: draft.displayName,
    predictions: {
      listWinner: draft.listPartyId,
      pmWinner: draft.pmCandidateId,
      percentages: {
        ...Object.fromEntries(
          PARTY_OPTIONS.map((p) => [
            p.shortName,
            draft.listPercents[p.id] === '' ? null : Number(draft.listPercents[p.id]),
          ]),
        ),
        nationalities: draft.nationalitiesPercent === '' ? null : Number(draft.nationalitiesPercent),
      },
    },
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mandatoto-${draft.displayName || 'export'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function strip(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
