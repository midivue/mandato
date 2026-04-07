import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Link2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { Modal, ModalHeader } from '@/components/ui/modal'
import { useTurnstile } from '@/hooks/use-turnstile'
import type { VotingDraft } from '@/hooks/use-prediction'
import { downloadDraftData } from './ballot-utils'

type FinalizeModalProps = {
  open: boolean
  onClose: () => void
  draft: VotingDraft
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  finalize: (t: (key: string) => string, turnstileToken?: string) => Promise<string | undefined>
  finalizeError?: string | null
}

// 'confirming' = awaiting Turnstile token (button shows spinner, modal not yet in full loading state)
type Phase = 'confirm' | 'confirming' | 'loading' | 'success'

export function FinalizeModal({ open, onClose, draft, updateDraft, finalize, finalizeError }: FinalizeModalProps) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<Phase>('confirm')
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  // Turnstile widget lives inside the modal so any interactive challenge is visible
  // during the confirm phase rather than hidden behind the loading overlay.
  const { containerRef: turnstileRef, getToken, reset: resetTurnstile } = useTurnstile()

  function handleClose() {
    if (phase === 'loading' || phase === 'confirming') return
    onClose()
    setTimeout(() => {
      setPhase('confirm')
      setShareToken(null)
      setTokenCopied(false)
      setShareCopied(false)
    }, 300)
  }

  async function handleConfirm() {
    setPhase('confirming')

    const turnstileToken = await getToken()

    setPhase('loading')
    const result = await finalize(t, turnstileToken || undefined)

    if (result) {
      setShareToken(result)
      setPhase('success')
    } else {
      resetTurnstile()
      setPhase('confirm')
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(draft.token).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  function copyShareLink() {
    const token = shareToken ?? draft.shareToken
    if (!token) return
    const url = `${window.location.origin}${window.location.pathname}#tipp/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  function viewProfile() {
    const token = shareToken ?? draft.shareToken
    if (token) window.location.hash = `tipp/${token}`
    handleClose()
  }

  function getFriendlyError(error: string | null | undefined): string | null {
    if (!error) return null
    const lower = error.toLowerCase()
    if (lower.includes('rate limit')) return t('flow.finalizeErrorRateLimit')
    if (lower.includes('verification') || lower.includes('human')) {
      const bracketMatch = error.match(/\[(.+)]/)
      const codes = bracketMatch ? ` (${bracketMatch[1]})` : ''
      return t('flow.finalizeErrorVerification') + codes
    }
    return error
  }

  const friendlyError = getFriendlyError(finalizeError)
  const isConfirmPhase = phase === 'confirm' || phase === 'confirming'

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-lg">
      {isConfirmPhase && (
        <>
          <ModalHeader title={t('flow.finalizeTitle')} onClose={handleClose} />

          <p className="mt-3 text-xs leading-relaxed text-zinc-700">
            <T i18nKey="flow.finalizeDescription" />
          </p>

          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs leading-relaxed text-amber-800">
              <T i18nKey="flow.finalizeDraftNotice" />
            </p>
          </div>

          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <p className="text-xs leading-relaxed text-blue-800">
              <T i18nKey="flow.finalizeTokenNotice" />
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-zinc-700">
              {t('flow.finalizeVisibilityLabel')}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button
                variant={draft.visibility === 'public' ? 'default' : 'outline'}
                disabled={phase === 'confirming'}
                onClick={() => updateDraft((prev) => ({ ...prev, visibility: 'public' }))}
              >
                <Eye className="size-4" aria-hidden />
                {t('flow.visibilityPublic')}
              </Button>
              <Button
                variant={draft.visibility === 'private' ? 'default' : 'outline'}
                disabled={phase === 'confirming'}
                onClick={() => updateDraft((prev) => ({ ...prev, visibility: 'private' }))}
              >
                <EyeOff className="size-4" aria-hidden />
                {t('flow.visibilityPrivate')}
              </Button>
            </div>
          </div>

          {/* Error feedback from a previous failed attempt */}
          {friendlyError && phase === 'confirm' && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" aria-hidden />
              <p className="text-xs leading-relaxed text-red-700">{friendlyError}</p>
            </div>
          )}

          {/* Turnstile widget — only visible if an interactive challenge is triggered */}
          <div ref={turnstileRef} className="mt-3" />

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose} disabled={phase === 'confirming'}>
              {t('flow.finalizeCancel')}
            </Button>
            <Button
              size="touch"
              className="w-full sm:w-auto"
              onClick={handleConfirm}
              disabled={phase === 'confirming'}
            >
              {phase === 'confirming'
                ? <Loader2 className="size-4 animate-spin" aria-hidden />
                : <CheckCircle2 className="size-4" aria-hidden />
              }
              {t('flow.finalizeConfirm')}
            </Button>
          </div>
        </>
      )}

      {phase === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="size-8 animate-spin text-zinc-400" aria-hidden />
          <p className="text-sm text-zinc-600">{t('flow.finalizing')}</p>
        </div>
      )}

      {phase === 'success' && (
        <>
          <ModalHeader title={t('flow.finalizeSuccessTitle')} onClose={handleClose} />

          <div className="mt-3 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden />
            <p className="text-xs leading-relaxed text-emerald-800">
              <T i18nKey="flow.finalizeSuccessMessage" />
            </p>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-[0.08em]">
              {t('flow.sessionToken')}
            </p>
            <code className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-800 sm:text-xs">
              <span className="truncate">{draft.token}</span>
              <button
                type="button"
                onClick={copyToken}
                className="ml-2 shrink-0 text-zinc-400 transition hover:text-zinc-700 active:scale-90"
                aria-label={t('flow.copyToken')}
              >
                {tokenCopied
                  ? <Check className="size-3.5 text-emerald-600" />
                  : <Copy className="size-3.5" />
                }
              </button>
            </code>
            <p className="mt-1 text-xs text-zinc-500">
              <T i18nKey="flow.sessionTokenHint" />
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button onClick={copyToken}>
              {tokenCopied
                ? <Check className="size-4" aria-hidden />
                : <Copy className="size-4" aria-hidden />
              }
              {tokenCopied ? t('flow.tokenCopied') : t('flow.copyToken')}
            </Button>
            <Button variant="outline" onClick={() => downloadDraftData(draft)}>
              <Download className="size-4" aria-hidden />
              {t('flow.downloadData')}
            </Button>
            <Button variant="outline" className="col-span-2 sm:col-span-1" onClick={copyShareLink}>
              {shareCopied
                ? <Check className="size-4 text-emerald-600" aria-hidden />
                : <Link2 className="size-4" aria-hidden />
              }
              {shareCopied ? t('flow.finalizeShareCopied') : t('flow.finalizeShareLink')}
            </Button>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="w-full sm:w-auto" onClick={handleClose}>
              {t('flow.finalizeCancel')}
            </Button>
            <Button className="w-full sm:w-auto" onClick={viewProfile}>
              <ExternalLink className="size-4" aria-hidden />
              {t('flow.viewProfile')}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
