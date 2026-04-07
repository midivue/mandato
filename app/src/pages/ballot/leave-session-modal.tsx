import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Download, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { Modal, ModalHeader } from '@/components/ui/modal'
import { isLocalDraft } from '@/hooks/use-prediction'
import type { VotingDraft } from '@/hooks/use-prediction'
import { downloadDraftData } from './ballot-utils'

type LeaveSessionModalProps = {
  open: boolean
  onClose: () => void
  draft: VotingDraft
  onLeave: () => void
}

export function LeaveSessionModal({ open, onClose, draft, onLeave }: LeaveSessionModalProps) {
  const { t } = useTranslation()
  const [tokenCopied, setTokenCopied] = useState(false)

  function copyToken() {
    navigator.clipboard.writeText(draft.token).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader title={t('flow.leaveSessionTitle')} onClose={onClose} />

      <p className="mt-3 text-xs leading-relaxed text-zinc-700"><T i18nKey="flow.leaveSessionWarning" /></p>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs leading-relaxed text-amber-800"><T i18nKey="flow.leaveSessionDraftNotice" /></p>
      </div>

      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <p className="text-xs leading-relaxed text-blue-800"><T i18nKey="flow.leaveSessionTokenNotice" /></p>
      </div>

      {!isLocalDraft(draft) && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={copyToken}>
            {tokenCopied
              ? <Check className="size-3.5" aria-hidden />
              : <Copy className="size-3.5" aria-hidden />
            }
            {tokenCopied ? t('flow.tokenCopied') : t('flow.copyToken')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadDraftData(draft)}>
            <Download className="size-3.5" aria-hidden />
            {t('flow.downloadData')}
          </Button>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('flow.leaveSessionCancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            onLeave()
            onClose()
          }}
        >
          <LogOut className="size-3.5" aria-hidden />
          {t('flow.leaveSessionConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
