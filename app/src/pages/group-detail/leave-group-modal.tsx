import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, LogOut } from 'lucide-react'
import * as api from '@/lib/api-client'
import { Modal, ModalHeader } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { GroupDetail } from '@mandatoto/shared/types'
import { removeGroupFromLocalStorage } from './group-detail-utils'

type LeaveGroupModalProps = {
  open: boolean
  group: GroupDetail
  groupToken: string
  userToken: string | null
  userShareToken: string | null
  onClose: () => void
}

export function LeaveGroupModal({ open, group, groupToken, userToken, userShareToken, onClose }: LeaveGroupModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleLeave() {
    if (!userToken || !userShareToken) return
    setLoading(true)
    try {
      await api.removeGroupMember(groupToken, userToken, userShareToken)
      removeGroupFromLocalStorage(groupToken)
      window.location.hash = 'csoportok'
    } catch { /* silent */ } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={t('groups.detail.leaveGroupTitle')} onClose={onClose} className="text-red-600" />
      <p className="mt-3 text-sm text-zinc-600">
        {t('groups.detail.leaveGroupWarning', { name: group.name })}
      </p>
      {group.members.length === 1 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs leading-relaxed text-amber-800">
            {t('groups.detail.leaveGroupLastMember')}
          </p>
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('flow.restoreCancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => void handleLeave()}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          <LogOut className="size-3.5" aria-hidden />
          {t('groups.detail.leaveGroupConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
