import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import * as api from '@/lib/api-client'
import { Modal, ModalHeader } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import type { GroupDetail, GroupMember } from '@mandatoto/shared/types'
import { removeGroupFromLocalStorage } from './group-detail-utils'

type RemoveMemberModalProps = {
  open: boolean
  member: GroupMember | null
  groupToken: string
  userToken: string | null
  userShareToken: string | null
  onClose: () => void
  onGroupUpdate: (data: GroupDetail) => void
}

export function RemoveMemberModal({ open, member, groupToken, userToken, userShareToken, onClose, onGroupUpdate }: RemoveMemberModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!userToken || !member) return
    setLoading(true)
    try {
      const data = await api.removeGroupMember(groupToken, userToken, member.shareToken)
      if ('deleted' in data && data.deleted === true) {
        removeGroupFromLocalStorage(groupToken)
        window.location.hash = 'csoportok'
        return
      }
      onGroupUpdate(data as GroupDetail)
      if (member.shareToken === userShareToken) {
        removeGroupFromLocalStorage(groupToken)
      }
    } catch { /* silent */ } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={t('groups.detail.removeButton')} onClose={onClose} />
      <p className="mt-3 text-sm text-zinc-600">
        {member && t('groups.detail.confirmRemove', { name: member.displayName })}
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('flow.restoreCancel')}
        </Button>
        <Button
          size="sm"
          onClick={() => void handleRemove()}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          {t('groups.detail.removeButton')}
        </Button>
      </div>
    </Modal>
  )
}
