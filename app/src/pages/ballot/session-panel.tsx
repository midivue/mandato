import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCircle2, ChevronDown, ChevronUp, Copy, Download, ExternalLink, KeyRound, LogOut, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { isLocalDraft } from '@/hooks/use-prediction'
import type { VotingDraft } from '@/hooks/use-prediction'
import { downloadDraftData } from './ballot-utils'
import { DisplayNameSection } from './display-name-section'

type SessionPanelProps = {
  draft: VotingDraft
  canEdit: boolean
  showFinalizedBadge: boolean
  isDirty: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  onShowRestore: () => void
  onShowDelete: () => void
  onShowLeaveSession: () => void
  pendingJoin: { groupToken: string; groupName: string } | null
  savedGroups: { groupToken: string; name: string }[]
}

export function SessionPanel({
  draft, canEdit, showFinalizedBadge, isDirty,
  updateDraft, onShowRestore, onShowDelete, onShowLeaveSession,
  pendingJoin, savedGroups,
}: SessionPanelProps) {
  const { t } = useTranslation()
  const [tokenCopied, setTokenCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)

  function copyToken() {
    navigator.clipboard.writeText(draft.token).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#tipp/${draft.shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  const statusBadge = showFinalizedBadge ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="size-3" aria-hidden />
      {t('flow.stateFinalized')}
    </span>
  ) : isLocalDraft(draft) ? (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-500">
      {t('flow.stateUnsaved')}
    </span>
  ) : isDirty ? (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
      {t('flow.unsavedChanges')}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600">
      {t('flow.stateSavedDraft')}
    </span>
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      {/* Mobile: tappable toggle header */}
      <button
        type="button"
        onClick={() => setSessionOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left md:hidden"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-zinc-900">{t('flow.sessionTitle')}</span>
          {statusBadge}
        </div>
        {sessionOpen
          ? <ChevronUp className="size-4 shrink-0 text-zinc-400" aria-hidden />
          : <ChevronDown className="size-4 shrink-0 text-zinc-400" aria-hidden />
        }
      </button>

      {/* Desktop: static header */}
      <div className="hidden items-center justify-between gap-2 md:flex md:flex-wrap">
        <h3 className="text-sm font-semibold text-zinc-900">{t('flow.sessionTitle')}</h3>
        {statusBadge}
      </div>

      {/* Panel body: always visible on desktop, toggled on mobile */}
      <div className={`md:block ${sessionOpen ? '' : 'max-md:hidden'}`}>
        <p className="mt-1 text-xs leading-relaxed text-zinc-600">
          <T i18nKey="flow.sessionDescription" />
        </p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          {/* Left column: token */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
              {t('flow.sessionToken')}
            </p>
            {isLocalDraft(draft) ? (
              <p className="break-words rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
                {t('flow.sessionNotSaved')}
              </p>
            ) : (
              <>
                <code className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[10px] text-zinc-800 sm:text-xs">
                  <span className="truncate">{draft.token}</span>
                  <button
                    type="button"
                    onClick={copyToken}
                    className="ml-2 shrink-0 text-zinc-400 transition hover:text-zinc-700 active:scale-90"
                  >
                    {tokenCopied
                      ? <Check className="size-3.5 text-emerald-600" />
                      : <Copy className="size-3.5" />
                    }
                  </button>
                </code>
                <p className="text-xs text-zinc-500"><T i18nKey="flow.sessionTokenHint" /></p>
              </>
            )}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {!isLocalDraft(draft) && (
                <>
                  <Button variant="outline" onClick={copyShareLink}>
                    {shareCopied
                      ? <Check className="size-4 text-emerald-600" aria-hidden />
                      : <Copy className="size-4" aria-hidden />
                    }
                    {shareCopied ? t('profile.copied') : t('profile.share')}
                  </Button>
                  <Button variant="outline" onClick={() => downloadDraftData(draft)}>
                    <Download className="size-4" aria-hidden />
                    {t('flow.downloadData')}
                  </Button>
                  <Button onClick={copyToken}>
                    {tokenCopied
                      ? <Check className="size-4" aria-hidden />
                      : <Copy className="size-4" aria-hidden />
                    }
                    {tokenCopied ? t('flow.tokenCopied') : t('flow.copyToken')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={onShowDelete}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="size-4" aria-hidden />
                    {t('flow.deleteData')}
                  </Button>
                </>
              )}
              <Button variant="outline" className="whitespace-normal" onClick={onShowRestore}>
                <KeyRound className="size-4 shrink-0" aria-hidden />
                {t('flow.restoreSession')}
              </Button>
              <Button variant="outline" className="whitespace-normal" onClick={onShowLeaveSession}>
                <LogOut className="size-4 shrink-0" aria-hidden />
                {t('flow.leaveSession')}
              </Button>
            </div>
          </div>

          {/* Right column: display name + groups */}
          <div className="space-y-5">
            <DisplayNameSection draft={draft} canEdit={canEdit} updateDraft={updateDraft} />

            {(pendingJoin || savedGroups.length > 0) && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  <Users className="mr-1 inline size-3.5" />
                  {t('groups.ballot.yourGroups')}
                </p>
                {pendingJoin && (
                  <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2">
                    <span className="text-xs text-indigo-700">
                      <strong className="font-semibold">{pendingJoin.groupName}</strong>
                    </span>
                    <span className="text-[10px] text-indigo-500">{t('groups.ballot.pendingGroupNote')}</span>
                  </div>
                )}
                {savedGroups.map((g) => (
                  <a
                    key={g.groupToken}
                    href={`#csoport/${g.groupToken}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    {g.name}
                    <ExternalLink className="size-3 text-zinc-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
