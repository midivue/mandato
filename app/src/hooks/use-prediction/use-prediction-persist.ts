import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import * as api from '@/lib/api-client'
import { storage } from '@/lib/storage'
import type { VotingDraft, PercentFieldId } from './types'
import { ALL_PERCENT_FIELDS } from './types'
import { draftToUpdate, getPercentValue, isLocalDraft, isValidPercent, predictionToDraft } from './percent-math'

type PersistDeps = {
  draft: VotingDraft | null
  setDraft: Dispatch<SetStateAction<VotingDraft | null>>
  canEdit: boolean
  setIsDirty: (v: boolean) => void
  setChangedSinceFinalize: (v: boolean) => void
  setShowSaveReminder: (v: boolean) => void
}

export function usePredictionPersist({
  draft,
  setDraft,
  canEdit,
  setIsDirty,
  setChangedSinceFinalize,
  setShowSaveReminder,
}: PersistDeps) {
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const ensureServerRecord = useCallback(async (draftToSync: VotingDraft): Promise<VotingDraft> => {
    if (!isLocalDraft(draftToSync)) return draftToSync

    // No Turnstile token here — POST /predictions does not require it.
    // The token is single-use and must be reserved for POST /finalize.
    const prediction = await api.createPrediction(draftToUpdate(draftToSync))
    storage.setToken(prediction.token)
    const serverDraft = predictionToDraft(prediction)
    setDraft(serverDraft)
    storage.setDraft(serverDraft)
    return serverDraft
  }, [setDraft])

  const saveDraft = useCallback(() => {
    if (!draft) return
    storage.setDraft(draft)
    setIsDirty(false)
    setLastSavedAt(new Date())
    setShowSaveReminder(false)
  }, [draft, setIsDirty, setShowSaveReminder])

  const finalize = useCallback(
    async (t: (key: string) => string, turnstileToken?: string): Promise<string | undefined> => {
      if (!draft) return undefined
      setFinalizeError(null)

      if (!draft.pmCandidateId) {
        setFinalizeError(t('flow.errors.pmRequired'))
        return undefined
      }
      if (!draft.listPartyId) {
        setFinalizeError(t('flow.errors.listInvalid'))
        return undefined
      }

      const allValid = ALL_PERCENT_FIELDS.every((field: PercentFieldId) => {
        const v = getPercentValue(draft, field)
        return v.trim() !== '' && isValidPercent(v)
      })
      if (!allValid) {
        setFinalizeError(t('flow.errors.percentsInvalid'))
        return undefined
      }

      let pctSum = 0
      for (const field of ALL_PERCENT_FIELDS) {
        pctSum += Number(getPercentValue(draft, field))
      }
      if (Math.abs(pctSum - 100) >= 0.1) {
        setFinalizeError(t('flow.errors.percentSum'))
        return undefined
      }

      if (!canEdit) {
        setFinalizeError(t('flow.errors.cutoffPassed'))
        return undefined
      }

      try {
        const serverDraft = await ensureServerRecord(draft)
        await api.updatePrediction(serverDraft.token, draftToUpdate(serverDraft))
        const result = await api.finalizePrediction(serverDraft.token, turnstileToken)
        const finalizedDraft = predictionToDraft(result)
        setDraft(finalizedDraft)
        storage.setDraft(finalizedDraft)
        setIsDirty(false)
        setChangedSinceFinalize(false)
        setLastSavedAt(new Date())
        setShowSaveReminder(false)
        return finalizedDraft.shareToken
      } catch (err) {
        setFinalizeError(err instanceof Error ? err.message : 'Finalization failed')
        return undefined
      }
    },
    [draft, canEdit, ensureServerRecord, setDraft, setIsDirty, setChangedSinceFinalize, setShowSaveReminder],
  )

  return { saveDraft, finalize, finalizeError, lastSavedAt, setLastSavedAt, setFinalizeError }
}
