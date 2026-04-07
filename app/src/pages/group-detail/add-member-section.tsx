import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus } from 'lucide-react'
import * as api from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import type { GroupDetail } from '@mandatoto/shared/types'
import { extractShareToken } from './group-detail-utils'

type AddMemberSectionProps = {
  groupToken: string
  userToken: string
  onGroupUpdate: (data: GroupDetail) => void
}

export function AddMemberSection({ groupToken, userToken, onGroupUpdate }: AddMemberSectionProps) {
  const { t } = useTranslation()
  const [addInput, setAddInput] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addLoading, setAddLoading] = useState(false)

  async function handleAddMember() {
    const shareToken = extractShareToken(addInput)
    if (!shareToken) return
    setAddLoading(true)
    setAddError(null)
    try {
      const data = await api.addGroupMember(groupToken, userToken, shareToken)
      onGroupUpdate(data)
      setAddInput('')
    } catch (err) {
      if (err instanceof api.ApiError) {
        const errKey =
          err.status === 404
            ? 'groups.errors.memberNotFound'
            : err.status === 409
              ? 'groups.errors.alreadyMember'
              : err.status === 403
                ? 'groups.errors.notAMember'
                : null
        setAddError(errKey ? t(errKey) : err.message)
      } else {
        setAddError('Failed')
      }
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        <Plus className="mr-1 inline size-3.5" />
        {t('groups.detail.addMember')}
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={addInput}
          onChange={(e) => {
            setAddInput(e.target.value)
            setAddError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAddMember()
          }}
          placeholder={t('groups.detail.addPlaceholder')}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-zinc-500"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleAddMember()}
          disabled={addLoading || !addInput.trim()}
        >
          {addLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        </Button>
      </div>
      {addError && (
        <p className="mt-2 text-xs font-medium text-red-600">{addError}</p>
      )}
    </div>
  )
}
