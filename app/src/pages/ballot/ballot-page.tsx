import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ClipboardList } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { AppInfoBoxes } from '@/components/info-boxes'
import { RestoreSessionModal } from '@/components/restore-session-modal'
import { PageHeader } from '@/components/page-header'
import { T } from '@/components/trans'
import type { VotingDraft, PercentFieldId } from '@/hooks/use-prediction'

import { PartyGrid } from './party-grid'
import { BallotPartyCompact } from './ballot-party-compact'
import { NationalitiesRow } from './nationalities-row'
import { ParticipationRow } from './participation-row'
import { GuideSection } from './guide-section'
import { BallotStatsPreview } from './ballot-stats-preview'
import { SessionPanel } from './session-panel'
import { ActionBar } from './action-bar'
import { PendingJoinBanner } from './pending-join-banner'
import { DeleteModal } from './delete-modal'
import { LeaveSessionModal } from './leave-session-modal'
import { FinalizeModal } from './finalize-modal'
import { LocationSection } from './location-section'
import { TelexMandateSection } from './telex-mandate-section'

export type BallotPageProps = {
  draft: VotingDraft
  finalizeError: string | null
  canEdit: boolean
  finalizeReady: boolean
  isFinalized: boolean
  showFinalizedBadge: boolean
  isDirty: boolean
  lastSavedAt: Date | null
  showSaveReminder: boolean
  percentTotal: number
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  updatePercent: (field: PercentFieldId, value: string) => void
  resetBallot: () => void
  saveDraft: () => void
  finalize: (t: (key: string) => string, turnstileToken?: string) => Promise<string | undefined>
  restoreSession: (token: string) => Promise<void>
  deletePrediction: () => Promise<void>
  leaveSession: () => void
}

export function BallotPage({
  draft, finalizeError, canEdit, finalizeReady,
  isFinalized, showFinalizedBadge, isDirty, lastSavedAt, showSaveReminder,
  percentTotal, updateDraft, updatePercent, resetBallot, saveDraft, finalize,
  restoreSession, deletePrediction, leaveSession,
}: BallotPageProps) {
  const { t } = useTranslation()

  const [showRestore, setShowRestore] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showLeaveSession, setShowLeaveSession] = useState(false)
  const [showFinalize, setShowFinalize] = useState(false)

  const [pendingJoin, setPendingJoin] = useState<{ groupToken: string; groupName: string } | null>(() => {
    try {
      const raw = localStorage.getItem('mandatoto:v1:pending-join')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [savedGroups, setSavedGroups] = useState<{ groupToken: string; name: string }[]>(() => {
    try {
      const raw = localStorage.getItem('mandatoto:v1:groups')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('mandatoto:v1:groups')
        setSavedGroups(raw ? JSON.parse(raw) : [])
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem('mandatoto:v1:pending-join')
        setPendingJoin(raw ? JSON.parse(raw) : null)
      } catch { /* ignore */ }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    window.dispatchEvent(new Event('storage'))
  }, [draft.token])

  function handleLeavePending() {
    localStorage.removeItem('mandatoto:v1:pending-join')
    setPendingJoin(null)
  }

  return (
    <section aria-label={t('main.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader icon={<ClipboardList className="size-5 text-zinc-500" />} title={t('main.title')}>
          <div className="mt-3">
            <AppInfoBoxes />
          </div>
        </PageHeader>
        <CardContent className="space-y-6">
          {pendingJoin && (
            <PendingJoinBanner pendingJoin={pendingJoin} onLeavePending={handleLeavePending} />
          )}

          <div className="space-y-4">
            <div className="@container">
              <div className="@min-[52rem]:hidden">
                <BallotPartyCompact draft={draft} canEdit={canEdit} updateDraft={updateDraft} updatePercent={updatePercent} />
              </div>
              <div className="hidden @min-[52rem]:block">
                <PartyGrid draft={draft} canEdit={canEdit} updateDraft={updateDraft} updatePercent={updatePercent} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <NationalitiesRow draft={draft} canEdit={canEdit} updatePercent={updatePercent} />
              <ParticipationRow draft={draft} canEdit={canEdit} updateDraft={updateDraft} />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap sm:justify-between">
              <button
                type="button"
                disabled={!canEdit}
                onClick={resetBallot}
                className="order-2 flex-1 basis-[calc(50%-0.25rem)] rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50 sm:order-none sm:flex-none sm:basis-auto sm:w-auto"
              >
                {t('flow.resetBallot')}
              </button>

              <span className={[
                'order-1 w-full shrink-0 rounded-full px-3 py-1 text-center text-xs font-semibold tabular-nums sm:order-none sm:w-auto',
                percentTotal > 100.05
                  ? 'bg-red-100 text-red-700'
                  : Math.abs(percentTotal - 100) < 0.1
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700',
              ].join(' ')}>
                {t('flow.percentTotal')}: {percentTotal}%
              </span>

              <button
                type="button"
                disabled={percentTotal > 100.05}
                onClick={() => document.getElementById('ballot-session')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="order-3 inline-flex flex-1 basis-[calc(50%-0.25rem)] items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-50 sm:order-none sm:flex-none sm:basis-auto sm:w-auto"
              >
                {t('flow.continueToToken')}
                <ArrowDown className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>

          <div id="ballot-session" className="space-y-4 border-t border-zinc-200 pt-6">
            <TelexMandateSection key={draft.token} draft={draft} canEdit={canEdit} updateDraft={updateDraft} />

            <SessionPanel
              draft={draft}
              canEdit={canEdit}
              showFinalizedBadge={showFinalizedBadge}
              isDirty={isDirty}
              updateDraft={updateDraft}
              onShowRestore={() => setShowRestore(true)}
              onShowDelete={() => setShowDelete(true)}
              onShowLeaveSession={() => setShowLeaveSession(true)}
              pendingJoin={pendingJoin}
              savedGroups={savedGroups}
            />

            <div className="grid items-stretch gap-4 md:grid-cols-2">
              <LocationSection key={draft.token} draft={draft} canEdit={canEdit} updateDraft={updateDraft} />
              <BallotStatsPreview />
            </div>

            <GuideSection />

            <p className="text-sm leading-relaxed text-zinc-500">
              <span className="md:hidden"><T i18nKey="main.subnoteShort" /></span>
              <span className="hidden md:inline"><T i18nKey="main.subnote" /></span>
            </p>

            <ActionBar
              draft={draft}
              canEdit={canEdit}
              isFinalized={isFinalized}
              showFinalizedBadge={showFinalizedBadge}
              finalizeReady={finalizeReady}
              lastSavedAt={lastSavedAt}
              finalizeError={finalizeError}
              showSaveReminder={showSaveReminder}
              saveDraft={saveDraft}
              onShowFinalize={() => setShowFinalize(true)}
            />
          </div>
        </CardContent>
      </Card>

      <RestoreSessionModal open={showRestore} onClose={() => setShowRestore(false)} onRestore={restoreSession} />
      <DeleteModal open={showDelete} onClose={() => setShowDelete(false)} onDelete={deletePrediction} />
      <LeaveSessionModal open={showLeaveSession} onClose={() => setShowLeaveSession(false)} draft={draft} onLeave={leaveSession} />
      <FinalizeModal open={showFinalize} onClose={() => setShowFinalize(false)} draft={draft} finalize={finalize} finalizeError={finalizeError} />
    </section>
  )
}
