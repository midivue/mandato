import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Modal, ModalHeader } from '@/components/ui/modal'

type PendingJoinBannerProps = {
  pendingJoin: { groupToken: string; groupName: string }
  onLeavePending: () => void
}

export function PendingJoinBanner({ pendingJoin, onLeavePending }: PendingJoinBannerProps) {
  const { t } = useTranslation()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50/60 px-4 py-3">
        <div className="flex-1">
          <p className="text-xs leading-relaxed text-indigo-800">
            <Trans
              i18nKey="groups.ballot.pendingBanner"
              values={{ groupName: pendingJoin.groupName }}
              components={{ b: <strong className="font-semibold" /> }}
            />
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowLeaveConfirm(true)}
          className="shrink-0 rounded-md border border-indigo-300 bg-white px-2.5 py-1 text-[11px] font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          {t('groups.ballot.leaveGroup')}
        </button>
      </div>

      <Modal open={showLeaveConfirm} onClose={() => setShowLeaveConfirm(false)}>
        <ModalHeader title={t('groups.ballot.leaveTitle')} onClose={() => setShowLeaveConfirm(false)} />
        <p className="mt-3 text-sm text-zinc-600">{t('groups.ballot.leaveBody')}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLeaveConfirm(false)}>
            {t('groups.ballot.leaveCancel')}
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              onLeavePending()
              setShowLeaveConfirm(false)
            }}
          >
            {t('groups.ballot.leaveConfirm')}
          </Button>
        </div>
      </Modal>
    </>
  )
}
