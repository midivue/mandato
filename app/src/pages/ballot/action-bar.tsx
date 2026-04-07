import { useTranslation } from 'react-i18next'
import { AlertTriangle, CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, Lock, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isLocalDraft } from '@/hooks/use-prediction'
import type { VotingDraft } from '@/hooks/use-prediction'
import { CUTOFF_AT } from '@mandatoto/shared/types'
import { formatDateTimeBudapest } from '@/lib/date-format'

const CUTOFF_DATE = new Date(CUTOFF_AT)

type ActionBarProps = {
  draft: VotingDraft
  canEdit: boolean
  saving: boolean
  isFinalized: boolean
  showFinalizedBadge: boolean
  finalizeReady: boolean
  lastSavedAt: Date | null
  finalizeError: string | null
  showSaveReminder: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  saveDraft: () => void
  onShowFinalize: () => void
}

export function ActionBar({
  draft, canEdit, saving, isFinalized, showFinalizedBadge,
  finalizeReady, lastSavedAt, finalizeError, showSaveReminder,
  updateDraft, saveDraft, onShowFinalize,
}: ActionBarProps) {
  const { t } = useTranslation()

  return (
    <>
      {showSaveReminder && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          {t('flow.saveReminder')}
        </div>
      )}

      {/* Mobile: full-width column stack. Desktop: flex-row layout */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:justify-between">

        {/* Left group: save + visibility toggle */}
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <Button variant="outline" className="w-full md:w-auto" onClick={saveDraft} disabled={!canEdit || saving}>
            {saving
              ? <Loader2 className="size-4 animate-spin" aria-hidden />
              : <Save className="size-4" aria-hidden />
            }
            {t('flow.saveDraft')}
          </Button>

          {/* 50/50 visibility switcher */}
          <div className="grid grid-cols-2 gap-2 md:flex md:gap-2">
            <Button
              variant={draft.visibility === 'public' ? 'default' : 'outline'}
              disabled={!canEdit}
              onClick={() => updateDraft((prev) => ({ ...prev, visibility: 'public' }))}
            >
              <Eye className="size-4" aria-hidden />
              {t('flow.visibilityPublic')}
            </Button>
            <Button
              variant={draft.visibility === 'private' ? 'default' : 'outline'}
              disabled={!canEdit}
              onClick={() => updateDraft((prev) => ({ ...prev, visibility: 'private' }))}
            >
              <EyeOff className="size-4" aria-hidden />
              {t('flow.visibilityPrivate')}
            </Button>
          </div>

          {saving && (
            <span className="text-xs text-zinc-400">{t('flow.saving')}</span>
          )}
        </div>

        {/* Right group: view tip + finalize */}
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
          <Button
            variant="outline"
            className="w-full md:w-auto"
            disabled={!draft.shareToken}
            onClick={() => { window.location.hash = `tipp/${draft.shareToken}` }}
          >
            <ExternalLink className="size-4" aria-hidden />
            {t('flow.viewProfile')}
          </Button>

          {showFinalizedBadge ? (
            <Button className="w-full bg-emerald-600 text-white opacity-100 hover:bg-emerald-600 md:w-auto" disabled>
              <CheckCircle2 className="size-4" aria-hidden />
              {t('flow.stateFinalized')}
            </Button>
          ) : (
            <div className="flex flex-col gap-1">
              <Button
                className="w-full min-h-14 py-3 text-base font-semibold md:w-auto md:min-h-9 md:h-9 md:py-2 md:text-sm md:font-medium"
                onClick={onShowFinalize}
                disabled={!finalizeReady}
              >
                <CheckCircle2 className="size-5 md:size-4" aria-hidden />
                {t('flow.finalize')}
              </Button>
              {/* Inline hint on mobile when finalize is disabled */}
              {!finalizeReady && (
                <p className="text-center text-xs text-zinc-400 md:hidden">
                  {t('flow.finalizeDisabledHintShort')}
                </p>
              )}
              {/* Tooltip on desktop */}
              {!finalizeReady && (
                <span className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 hidden w-80 rounded-lg bg-zinc-900 px-3 py-1.5 text-center text-[11px] leading-snug text-white md:group-hover:block">
                  {t('flow.finalizeDisabledHint')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-xs text-zinc-500 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-4 sm:gap-y-1">
        <div className="space-y-0.5 text-center sm:text-left">
          <p>
            {lastSavedAt
              ? `${t('flow.lastSaved')} ${formatDateTimeBudapest(lastSavedAt)}`
              : isFinalized && draft.finalizedAt
                ? `${t('flow.lastFinalized')} ${formatDateTimeBudapest(draft.finalizedAt)}`
                : !isLocalDraft(draft) && draft.updatedAt
                  ? `${t('flow.lastSaved')} ${formatDateTimeBudapest(draft.updatedAt)}`
                  : t('flow.notSavedYet')
            }
          </p>
          {!canEdit && (
            <p className="inline-flex items-center justify-center gap-1 font-medium text-zinc-700 sm:justify-start">
              <Lock className="size-3.5" aria-hidden />
              {t('flow.locked')}
            </p>
          )}
          {finalizeError && <p className="font-medium text-red-600">{finalizeError}</p>}
        </div>
        <p className="text-center sm:text-right">
          {t('flow.cutoffLabel')} {formatDateTimeBudapest(CUTOFF_DATE)}
        </p>
      </div>
    </>
  )
}
