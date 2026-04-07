import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/trans'
import type { VotingDraft } from '@/hooks/use-prediction'

const ANON_PATTERN = /^(Anonymous|Anonim)\d*$/

type DisplayNameSectionProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
}

export function DisplayNameSection({ draft, canEdit, updateDraft }: DisplayNameSectionProps) {
  const { t } = useTranslation()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [forcedMode, setForcedMode] = useState<'custom' | 'anon' | null>(null)
  const [prevDisplayName, setPrevDisplayName] = useState(draft.displayName)

  if (draft.displayName !== prevDisplayName) {
    setPrevDisplayName(draft.displayName)
    setForcedMode(null)
  }

  const derivedAnon = draft.displayName === '' || ANON_PATTERN.test(draft.displayName)
  const isAnonymous = forcedMode !== null ? forcedMode === 'anon' : derivedAnon

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
        {t('flow.displayName')}
      </p>
      {isAnonymous ? (
        <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
          {draft.displayName || t('flow.nameAnonymousPlaceholder')}
        </div>
      ) : (
        <input
          ref={nameInputRef}
          value={draft.displayName}
          disabled={!canEdit}
          placeholder={t('flow.nameCustomPlaceholder')}
          onChange={(event) =>
            updateDraft((prev) => ({ ...prev, displayName: event.target.value }))
          }
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-zinc-500"
        />
      )}
      <p className="text-xs text-zinc-500"><T i18nKey="flow.displayNameDescription" /></p>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-start">
        <Button
          variant={isAnonymous ? 'default' : 'outline'}
          disabled={!canEdit}
          onClick={() => {
            setForcedMode('anon')
            if (!ANON_PATTERN.test(draft.displayName)) {
              const anonName = `Anonymous${Math.floor(1000 + Math.random() * 9000)}`
              updateDraft((prev) => ({ ...prev, displayName: anonName }))
            }
          }}
        >
          <UserX className="size-4" aria-hidden />
          {t('flow.nameAnonymous')}
        </Button>
        <Button
          variant={!isAnonymous ? 'default' : 'outline'}
          disabled={!canEdit}
          onClick={() => {
            setForcedMode('custom')
            setTimeout(() => {
              nameInputRef.current?.focus()
              nameInputRef.current?.select()
            }, 50)
          }}
        >
          <User className="size-4" aria-hidden />
          {t('flow.nameCustom')}
        </Button>
      </div>
    </div>
  )
}
