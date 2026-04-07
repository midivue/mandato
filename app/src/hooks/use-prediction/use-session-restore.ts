import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import * as api from '@/lib/api-client'
import { storage } from '@/lib/storage'
import type { VotingDraft } from './types'
import { isLocalDraft, makeLocalDraft, predictionToDraft } from './percent-math'

type SessionDeps = {
  draft: VotingDraft | null
  setDraft: Dispatch<SetStateAction<VotingDraft | null>>
  setError: (v: string | null) => void
  setFinalizeError: (v: string | null) => void
  setIsDirty: (v: boolean) => void
  setChangedSinceFinalize: (v: boolean) => void
  setLastSavedAt: (v: Date | null) => void
  setShowSaveReminder: (v: boolean) => void
  lockedPercentsRef: MutableRefObject<Record<string, boolean>>
}

function resetToFresh(
  deps: SessionDeps,
  lockedPercentsRef: MutableRefObject<Record<string, boolean>>,
  clearGroups: boolean,
) {
  if (clearGroups) {
    storage.removeGroups()
    storage.removePendingJoin()
  }
  const fresh = makeLocalDraft()
  const freshLocked = { nationalities: true }
  lockedPercentsRef.current = freshLocked
  storage.setDraft(fresh)
  storage.setLockedPcts(freshLocked)
  deps.setDraft(fresh)
  deps.setError(null)
  deps.setFinalizeError(null)
  deps.setIsDirty(false)
  deps.setChangedSinceFinalize(false)
  deps.setLastSavedAt(null)
  deps.setShowSaveReminder(false)
}

export function useSessionRestore(deps: SessionDeps) {
  const { lockedPercentsRef } = deps

  const restoreSession = useCallback(async (token: string) => {
    const prediction = await api.getPrediction(token)
    if (!prediction) throw new Error('Token not found')
    storage.setToken(prediction.token)
    const d = predictionToDraft(prediction)
    const locked: Record<string, boolean> = { nationalities: true }
    lockedPercentsRef.current = locked
    storage.setDraft(d)
    storage.setLockedPcts(locked)
    storage.removePendingJoin()
    const groups = await api.getMyGroups(prediction.token)
    if (groups.length > 0) {
      storage.setGroups(groups)
    } else {
      storage.removeGroups()
    }
    deps.setDraft(d)
    deps.setError(null)
    deps.setFinalizeError(null)
    deps.setIsDirty(false)
    deps.setChangedSinceFinalize(d.status !== 'finalized')
    deps.setLastSavedAt(null)
    deps.setShowSaveReminder(false)
  }, [deps, lockedPercentsRef])

  const deletePrediction = useCallback(async () => {
    if (!deps.draft) return
    if (!isLocalDraft(deps.draft)) {
      await api.deletePrediction(deps.draft.token)
    }
    storage.removeToken()
    resetToFresh(deps, lockedPercentsRef, true)
  }, [deps, lockedPercentsRef])

  const leaveSession = useCallback(() => {
    storage.removeToken()
    storage.removeDraft()
    storage.removeLockedPcts()
    const fresh = makeLocalDraft()
    const freshLocked = { nationalities: true }
    lockedPercentsRef.current = freshLocked
    storage.setDraft(fresh)
    storage.setLockedPcts(freshLocked)
    storage.removeGroups()
    storage.removePendingJoin()
    deps.setDraft(fresh)
    deps.setError(null)
    deps.setFinalizeError(null)
    deps.setIsDirty(false)
    deps.setChangedSinceFinalize(false)
    deps.setLastSavedAt(null)
    deps.setShowSaveReminder(false)
  }, [deps, lockedPercentsRef])

  return { restoreSession, deletePrediction, leaveSession }
}
