import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import type { UsePredictionReturn } from '@/hooks/use-prediction'
import { BallotPage } from '@/pages/ballot'
import { ProfilePage } from '@/pages/profile-page'

const StatsPage = lazy(() => import('@/pages/stats').then(m => ({ default: m.StatsPage })))
const InfoPage = lazy(() => import('@/pages/info-page').then(m => ({ default: m.InfoPage })))
const GroupsPage = lazy(() => import('@/pages/groups-page').then(m => ({ default: m.GroupsPage })))
const GroupDetailPage = lazy(() => import('@/pages/group-detail').then(m => ({ default: m.GroupDetailPage })))
const InvitePage = lazy(() => import('@/pages/invite-page').then(m => ({ default: m.InvitePage })))
const LeaderboardPage = lazy(() => import('@/pages/leaderboard').then(m => ({ default: m.LeaderboardPage })))

function LazyFallback() {
  return (
    <section>
      <div className="rounded-2xl border border-zinc-200/90 bg-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        </div>
      </div>
    </section>
  )
}

type AppRouterProps = {
  page: string
  prediction: UsePredictionReturn
}

export function AppRouter({ page, prediction }: AppRouterProps) {
  const {
    draft, loading, saving, error, finalizeError, canEdit, finalizeReady,
    isFinalized, showFinalizedBadge, isDirty, lastSavedAt, showSaveReminder,
    percentTotal, updateDraft, updatePercent, resetBallot, saveDraft, finalize,
    restoreSession, deletePrediction, leaveSession,
  } = prediction

  if (page.startsWith('tipp/')) {
    return <ProfilePage shareToken={page.slice(5)} restoreSession={restoreSession} />
  }
  if (page === 'stats') {
    return <Suspense fallback={<LazyFallback />}><StatsPage /></Suspense>
  }
  if (page === 'info') {
    return <Suspense fallback={<LazyFallback />}><InfoPage /></Suspense>
  }
  if (page === 'csoportok') {
    return <Suspense fallback={<LazyFallback />}><GroupsPage userToken={draft?.token ?? null} userShareToken={draft?.shareToken ?? null} /></Suspense>
  }
  if (page.startsWith('csoport/')) {
    return <Suspense fallback={<LazyFallback />}><GroupDetailPage key={page.slice(8)} groupToken={page.slice(8)} userToken={draft?.token ?? null} userShareToken={draft?.shareToken ?? null} /></Suspense>
  }
  if (page.startsWith('meghivo/')) {
    return <Suspense fallback={<LazyFallback />}><InvitePage groupToken={page.slice(8)} userToken={draft?.token ?? null} userShareToken={draft?.shareToken ?? null} /></Suspense>
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-zinc-400" />
      </div>
    )
  }
  if (error || !draft) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-sm text-red-600">{error ?? 'Something went wrong'}</p>
      </div>
    )
  }
  if (page === 'board') {
    return <Suspense fallback={<LazyFallback />}><LeaderboardPage currentToken={draft.token} /></Suspense>
  }

  return (
    <BallotPage
      draft={draft}
      saving={saving}
      finalizeError={finalizeError}
      canEdit={canEdit}
      finalizeReady={finalizeReady}
      isFinalized={isFinalized}
      showFinalizedBadge={showFinalizedBadge}
      isDirty={isDirty}
      lastSavedAt={lastSavedAt}
      showSaveReminder={showSaveReminder}
      percentTotal={percentTotal}
      updateDraft={updateDraft}
      updatePercent={updatePercent}
      resetBallot={resetBallot}
      saveDraft={saveDraft}
      finalize={finalize}
      restoreSession={restoreSession}
      deletePrediction={deletePrediction}
      leaveSession={leaveSession}
    />
  )
}
