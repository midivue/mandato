import { useEffect, useMemo, useState } from 'react'
import { CUTOFF_AT } from '@mandatoto/shared/types'
import { ALL_PERCENT_FIELDS } from './types'
import { getPercentValue, isBelowThreshold, isValidPercent } from './percent-math'
import { usePredictionInit } from './use-prediction-init'
import { usePredictionDraft } from './use-prediction-draft'
import { useSaveReminder } from './use-save-reminder'
import { usePredictionPersist } from './use-prediction-persist'
import { useSessionRestore } from './use-session-restore'

export type { VotingDraft, PercentFieldId } from './types'
export { isLocalDraft, isBelowThreshold, isValidPercent } from './percent-math'

const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

export function usePrediction() {
  const { draft, setDraft, loading, error, setError, lockedPercentsRef } = usePredictionInit()

  const [nowTs, setNowTs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  const canEdit = useMemo(() => nowTs < CUTOFF_MS, [nowTs])

  const {
    updateDraft,
    updatePercent,
    resetBallot,
    isDirty,
    setIsDirty,
    changedSinceFinalize,
    setChangedSinceFinalize,
    lastEditAt,
    percentTotal,
  } = usePredictionDraft(draft, setDraft, lockedPercentsRef)

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const { showSaveReminder, setShowSaveReminder } = useSaveReminder(isDirty, lastEditAt)

  const { saveDraft, finalize, finalizeError, lastSavedAt, setLastSavedAt, setFinalizeError } =
    usePredictionPersist({
      draft,
      setDraft,
      canEdit,
      setIsDirty,
      setChangedSinceFinalize,
      setShowSaveReminder,
    })

  const { restoreSession, deletePrediction, leaveSession } = useSessionRestore({
    draft,
    setDraft,
    setError,
    setFinalizeError,
    setIsDirty,
    setChangedSinceFinalize,
    setLastSavedAt,
    setShowSaveReminder,
    lockedPercentsRef,
  })

  const allPercentsValid = draft
    ? ALL_PERCENT_FIELDS.every((field) => {
        const v = getPercentValue(draft, field)
        return v.trim() !== '' && isValidPercent(v)
      })
    : false
  const percentSumValid = Math.abs(percentTotal - 100) < 0.1
  const listWinnerSelected = Boolean(draft?.listPartyId)
  const pmPartyAboveThreshold = draft?.pmCandidateId
    ? !isBelowThreshold(getPercentValue(draft, draft.pmCandidateId))
    : true
  const pmStepValid = Boolean(draft?.pmCandidateId) && pmPartyAboveThreshold
  const finalizeReady =
    pmStepValid && listWinnerSelected && allPercentsValid && percentSumValid && canEdit
  const isFinalized = draft?.status === 'finalized'

  return {
    draft,
    loading,
    error,
    finalizeError,
    canEdit,
    finalizeReady,
    isFinalized,
    showFinalizedBadge: isFinalized && !changedSinceFinalize,
    percentTotal,
    isDirty,
    lastSavedAt,
    showSaveReminder,
    updateDraft,
    updatePercent,
    resetBallot,
    saveDraft,
    finalize,
    restoreSession,
    deletePrediction,
    leaveSession,
    setDraft,
  }
}

export type UsePredictionReturn = ReturnType<typeof usePrediction>
