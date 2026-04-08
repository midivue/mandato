import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { Modal, ModalHeader } from '@/components/ui/modal'

type DeleteModalProps = {
  open: boolean
  onClose: () => void
  onDelete: () => Promise<void>
}

export function DeleteModal({ open, onClose, onDelete }: DeleteModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await onDelete()
      onClose()
    } catch {
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={t('flow.deleteTitle')} onClose={onClose} className="text-red-600" />
      <p className="mt-3 text-xs leading-relaxed text-zinc-700"><T i18nKey="flow.deleteWarning" /></p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('flow.deleteCancel')}
        </Button>
        <Button
          size="sm"
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white hover:bg-red-700"
        >
          {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          <Trash2 className="size-3.5" aria-hidden />
          {t('flow.deleteConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
