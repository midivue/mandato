import { useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import { Modal, ModalHeader } from '@/components/ui/modal'

type RestoreSessionModalProps = {
  open: boolean
  onClose: () => void
  onRestore: (token: string) => Promise<void>
}

export function RestoreSessionModal({ open, onClose, onRestore }: RestoreSessionModalProps) {
  const { t } = useTranslation()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!open) {
      setToken('')
      setError(null)
      setLoading(false)
    }
  }, [open])

  async function handleSubmit() {
    const trimmed = token.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      await onRestore(trimmed)
      onClose()
    } catch {
      setError(t('flow.restoreError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title={t('flow.restoreSession')} onClose={onClose} />
      <p className="mt-2 text-xs leading-relaxed text-zinc-500"><T i18nKey="flow.restoreDescription" /></p>
      <input
        ref={inputRef}
        type="text"
        value={token}
        onChange={(e) => { setToken(e.target.value); setError(null) }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        placeholder={t('flow.restoreTokenPlaceholder')}
        className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500"
      />
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('flow.restoreCancel')}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={loading || !token.trim()}>
          {loading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
          {t('flow.restoreSubmit')}
        </Button>
      </div>
    </Modal>
  )
}
