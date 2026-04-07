import { useCallback, useMemo, useState, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import { storage } from '@/lib/storage'
import type { VotingDraft, PercentFieldId } from './types'
import { ALL_PERCENT_FIELDS } from './types'
import { getPercentValue, redistributePercents } from './percent-math'

export function usePredictionDraft(
  draft: VotingDraft | null,
  setDraft: Dispatch<SetStateAction<VotingDraft | null>>,
  lockedPercentsRef: MutableRefObject<Record<string, boolean>>,
) {
  const [isDirty, setIsDirty] = useState(false)
  const [changedSinceFinalize, setChangedSinceFinalize] = useState(false)
  const [lastEditAt, setLastEditAt] = useState<Date | null>(null)

  const updateDraft = useCallback(
    (updater: (prev: VotingDraft) => VotingDraft) => {
      setDraft((prev) => {
        if (!prev) return prev
        const next = updater(prev)
        storage.setDraft(next)
        return next
      })
      setIsDirty(true)
      setChangedSinceFinalize(true)
      setLastEditAt(new Date())
    },
    [setDraft],
  )

  const updatePercent = useCallback(
    (field: PercentFieldId, value: string) => {
      const newLocked = { ...lockedPercentsRef.current }
      if (value.trim() === '') {
        delete newLocked[field]
      } else {
        newLocked[field] = true
      }
      lockedPercentsRef.current = newLocked
      storage.setLockedPcts(newLocked)

      updateDraft((prev) => redistributePercents(prev, field, value, newLocked))
    },
    [updateDraft, lockedPercentsRef],
  )

  const resetBallot = useCallback(() => {
    const freshLocked = { nationalities: true }
    lockedPercentsRef.current = freshLocked
    storage.setLockedPcts(freshLocked)
    updateDraft((prev) => ({
      ...prev,
      listPartyId: null,
      pmCandidateId: null,
      listPercents: { mkkp: '19.95', tisza: '19.95', mi_hazank: '19.95', dk: '19.95', fidesz_kdnp: '19.95' },
      nationalitiesPercent: '0.25',
      participationRate: '70',
    }))
  }, [updateDraft, lockedPercentsRef])

  const percentTotal = useMemo(() => {
    if (!draft) return 0
    let sum = 0
    for (const field of ALL_PERCENT_FIELDS) {
      const val = Number(getPercentValue(draft, field))
      if (Number.isFinite(val)) sum += val
    }
    return Math.round(sum * 100) / 100
  }, [draft])

  return {
    updateDraft,
    updatePercent,
    resetBallot,
    isDirty,
    setIsDirty,
    changedSinceFinalize,
    setChangedSinceFinalize,
    lastEditAt,
    percentTotal,
  }
}
