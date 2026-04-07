import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Loader2, Users, ArrowRight, Check } from 'lucide-react'
import { useApiQuery } from '@/hooks/use-api-query'
import * as api from '@/lib/api-client'
import { useTurnstile } from '@/hooks/use-turnstile'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { storage, type SavedGroup } from '@/lib/storage'

function saveGroupToLocalStorage(group: SavedGroup) {
  const existing = storage.getGroups()
  if (existing.some((g) => g.groupToken === group.groupToken)) return
  storage.setGroups([group, ...existing])
}

type InvitePageProps = {
  groupToken: string
  userToken: string | null
  userShareToken: string | null
}

export function InvitePage({ groupToken, userToken, userShareToken }: InvitePageProps) {
  const { t } = useTranslation()
  const { containerRef: turnstileRef, getToken: getTurnstileToken } = useTurnstile()
  const { data: group, loading, error } = useApiQuery(
    () => api.getGroupDetail(groupToken),
    [groupToken],
  )
  const notFound = !loading && (error !== null || group === null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)

  const hasServer = !!userToken && !userToken.startsWith('local-')
  const isMember = hasServer && group !== null && userShareToken !== null &&
    group.members.some((m) => m.shareToken === userShareToken)

  async function handleJoin() {
    if (!userToken || !group) return
    setJoining(true)
    try {
      const turnstileToken = await getTurnstileToken()
      await api.joinGroup(groupToken, userToken, turnstileToken || undefined)
      saveGroupToLocalStorage({ groupToken, name: group.name })
      setJoined(true)
      setTimeout(() => {
        window.location.hash = `csoport/${groupToken}`
      }, 600)
    } catch { /* silent */ } finally {
      setJoining(false)
    }
  }

  function handleCreateToJoin() {
    if (!group) return
    storage.setPendingJoin({ groupToken, groupName: group.name })
    window.location.hash = 'jatek'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  if (notFound || !group) {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <p className="text-sm text-zinc-500">{t('groups.errors.notFound')}</p>
        <a
          href="#csoportok"
          className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
        >
          {t('groups.title')}
        </a>
      </div>
    )
  }

  return (
    <section aria-label={t('groups.invite.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader
          icon={<Users className="size-5 text-zinc-500" />}
          title={t('groups.invite.title')}
        >
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            <Trans
              i18nKey="groups.invite.description"
              values={{ groupName: group.name }}
              components={{ b: <strong className="font-semibold text-zinc-900" /> }}
            />
          </p>
        </PageHeader>

        <CardContent className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
            <p className="text-xs leading-relaxed text-zinc-500">
              {t('groups.invite.whatIs')}
            </p>
          </div>

          {isMember ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-600">{t('groups.invite.alreadyMember')}</p>
              <Button onClick={() => { window.location.hash = `csoport/${groupToken}` }}>
                <ArrowRight className="size-4" />
                {t('groups.invite.goToGroup')}
              </Button>
            </div>
          ) : hasServer ? (
            <div className="flex flex-col items-start gap-3">
              <Button
                onClick={() => void handleJoin()}
                disabled={joining || joined}
              >
                {joining ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : joined ? (
                  <Check className="size-4" />
                ) : (
                  <Users className="size-4" />
                )}
                {joining
                  ? t('groups.invite.joining')
                  : joined
                    ? t('groups.invite.goToGroup')
                    : t('groups.invite.joinButton')}
              </Button>
              <div ref={turnstileRef} />
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleCreateToJoin}>
                <ArrowRight className="size-4" />
                {t('groups.invite.createToJoin')}
              </Button>
            </div>
          )}

          <div className="rounded-lg border border-zinc-200 bg-zinc-50/30 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {group.name}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {t('groups.detail.members')}: {group.members.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
