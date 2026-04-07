import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Eye, EyeOff, Link2, LogOut, Pencil } from 'lucide-react'
import * as api from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import type { GroupDetail } from '@mandatoto/shared/types'

type GroupHeaderProps = {
  group: GroupDetail
  groupToken: string
  isMember: boolean
  userToken: string | null
  onGroupUpdate: (data: GroupDetail) => void
  onShowLeaveGroup: () => void
}

export function GroupHeader({ group, groupToken, isMember, userToken, onGroupUpdate, onShowLeaveGroup }: GroupHeaderProps) {
  const { t } = useTranslation()

  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [copied, setCopied] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [visibilityLoading, setVisibilityLoading] = useState(false)

  function copyLink() {
    const url = `${window.location.origin}${window.location.pathname}#csoport/${groupToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function copyInviteLink() {
    const url = `${window.location.origin}${window.location.pathname}#meghivo/${groupToken}`
    navigator.clipboard.writeText(url).then(() => {
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    })
  }

  async function toggleVisibility() {
    if (!userToken || !group) return
    const next = group.visibility === 'public' ? 'private' : 'public'
    setVisibilityLoading(true)
    try {
      const data = await api.updateGroup(groupToken, userToken, { visibility: next })
      onGroupUpdate(data)
    } catch { /* silent */ } finally {
      setVisibilityLoading(false)
    }
  }

  function startEditName() {
    if (!group) return
    setNameInput(group.name)
    setEditingName(true)
    setTimeout(() => nameInputRef.current?.focus(), 50)
  }

  async function saveName() {
    if (!userToken || !nameInput.trim()) return
    setEditingName(false)
    try {
      const data = await api.updateGroup(groupToken, userToken, { name: nameInput.trim() })
      onGroupUpdate(data)
    } catch { /* silent */ }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {editingName ? (
          <div className="flex items-center gap-2">
            <input
              ref={nameInputRef}
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              onBlur={() => void saveName()}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold outline-none focus:border-zinc-500"
              maxLength={60}
            />
          </div>
        ) : (
          isMember && (
            <button
              onClick={startEditName}
              className="rounded p-1 text-zinc-400 transition-colors hover:text-zinc-700"
              title={t('groups.detail.editName')}
            >
              <Pencil className="size-3.5" />
            </button>
          )
        )}
        <span className="inline-block rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
          {t('groups.detail.members')}: {group.members.length}
        </span>
        {isMember ? (
          <button
            onClick={() => void toggleVisibility()}
            disabled={visibilityLoading}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
              group.visibility === 'public'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 bg-zinc-50 text-zinc-600'
            }`}
          >
            {group.visibility === 'public' ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {group.visibility === 'public' ? t('groups.detail.visibilityPublic') : t('groups.detail.visibilityPrivate')}
          </button>
        ) : (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            group.visibility === 'public'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-zinc-200 bg-zinc-50 text-zinc-600'
          }`}>
            {group.visibility === 'public' ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {group.visibility === 'public' ? t('groups.detail.visibilityPublic') : t('groups.detail.visibilityPrivate')}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
          {copied ? t('groups.detail.copied') : t('groups.detail.shareLink')}
        </Button>
        {isMember && (
          <Button variant="outline" size="sm" onClick={copyInviteLink}>
            {inviteCopied ? <Check className="size-3.5 text-emerald-600" /> : <Link2 className="size-3.5" />}
            {inviteCopied ? t('groups.detail.inviteCopied') : t('groups.detail.copyInviteLink')}
          </Button>
        )}
        {isMember && (
          <Button
            variant="outline"
            size="sm"
            onClick={onShowLeaveGroup}
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="size-3.5" aria-hidden />
            {t('groups.detail.leaveGroup')}
          </Button>
        )}
      </div>
    </div>
  )
}
