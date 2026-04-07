import { useEffect, useRef, useState } from 'react'
import * as api from '@/lib/api-client'
import { storage } from '@/lib/storage'
import type { VotingDraft } from './types'
import { type LegacyDraft, LOCAL_DRAFT_TOKEN } from './types'
import {
  deriveLockedPercents,
  makeLocalDraft,
  migrateLegacyDraft,
  predictionToDraft,
} from './percent-math'

function syncGroups(token: string, cancelled: { current: boolean }) {
  api.getMyGroups(token).then((groups) => {
    if (cancelled.current) return
    if (groups.length > 0) {
      storage.setGroups(groups)
    } else {
      storage.removeGroups()
    }
    window.dispatchEvent(new StorageEvent('storage', { key: 'mandatoto:v1:groups' }))
  }).catch(() => {})
}

function pctToString(val: number | null): string {
  return val === null ? '' : String(val)
}

export function usePredictionInit() {
  const [draft, setDraft] = useState<VotingDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lockedPercentsRef = useRef<Record<string, boolean>>({ nationalities: true })

  useEffect(() => {
    const cancelled = { current: false }

    async function init() {
      try {
        const localDraftRaw = storage.getDraft<VotingDraft>()
        if (localDraftRaw) {
          if (localDraftRaw.token && localDraftRaw.token !== LOCAL_DRAFT_TOKEN) {
            const prediction = await api.getPrediction(localDraftRaw.token)
            if (prediction && !cancelled.current) {
              const d = predictionToDraft(prediction)
              const locked: Record<string, boolean> = { nationalities: true }
              lockedPercentsRef.current = locked
              storage.setDraft(d)
              storage.setLockedPcts(locked)
              setDraft(d)
              setLoading(false)
              syncGroups(localDraftRaw.token, cancelled)
              return
            }
            storage.removeDraft()
            storage.removeLockedPcts()
            storage.removeToken()
          } else if (!cancelled.current) {
            const savedLocked = storage.getLockedPcts()
            lockedPercentsRef.current = savedLocked ?? deriveLockedPercents(localDraftRaw)
            // Migrate drafts saved before participationRate was added
            const migratedDraft = localDraftRaw.participationRate == null
              ? { ...localDraftRaw, participationRate: '70' }
              : localDraftRaw
            if (migratedDraft !== localDraftRaw) storage.setDraft(migratedDraft)
            setDraft(migratedDraft)
            setLoading(false)
            return
          }
        }

        const storedToken = storage.getToken()
        if (storedToken) {
          const prediction = await api.getPrediction(storedToken)
          if (prediction && !cancelled.current) {
            const d = predictionToDraft(prediction)
            const locked: Record<string, boolean> = { nationalities: true }
            lockedPercentsRef.current = locked
            storage.setDraft(d)
            storage.setLockedPcts(locked)
            setDraft(d)
            setLoading(false)
            syncGroups(storedToken, cancelled)
            return
          }
          storage.removeToken()
        }

        const legacyRaw = storage.getLegacyDraft<LegacyDraft>()
        if (legacyRaw) {
          try {
            const migrated = migrateLegacyDraft(legacyRaw)
            const localDraft: VotingDraft = {
              ...makeLocalDraft(),
              displayName: migrated.displayName,
              visibility: migrated.visibility,
              listPartyId: migrated.listWinnerId,
              pmCandidateId: migrated.pmWinnerId,
              listPercents: {
                mkkp: pctToString(migrated.pcts.mkkp),
                tisza: pctToString(migrated.pcts.tisza),
                mi_hazank: pctToString(migrated.pcts.mi_hazank),
                dk: pctToString(migrated.pcts.dk),
                fidesz_kdnp: pctToString(migrated.pcts.fidesz_kdnp),
              },
            }
            storage.removeLegacyDraft()
            const legacyLocked = deriveLockedPercents(localDraft)
            storage.setDraft(localDraft)
            storage.setLockedPcts(legacyLocked)
            if (!cancelled.current) {
              lockedPercentsRef.current = legacyLocked
              setDraft(localDraft)
              setLoading(false)
              return
            }
          } catch {
            // Legacy data corrupt, fall through
          }
        }

        if (!cancelled.current) {
          const fresh = makeLocalDraft()
          const freshLocked = { nationalities: true }
          storage.setDraft(fresh)
          storage.setLockedPcts(freshLocked)
          lockedPercentsRef.current = freshLocked
          setDraft(fresh)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled.current) {
          setError(err instanceof Error ? err.message : 'Failed to initialize')
          setLoading(false)
        }
      }
    }

    init()
    return () => { cancelled.current = true }
  }, [])

  return { draft, setDraft, loading, error, setError, lockedPercentsRef }
}
