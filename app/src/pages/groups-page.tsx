import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trophy, Users, ExternalLink, ArrowRight } from 'lucide-react'
import * as api from '@/lib/api-client'
import { useApiQuery } from '@/hooks/use-api-query'
import { useTurnstile } from '@/hooks/use-turnstile'

import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GroupInfoBoxes } from '@/components/info-boxes'
import { storage, type SavedGroup } from '@/lib/storage'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'

function loadSavedGroups(): SavedGroup[] {
  return storage.getGroups()
}

function saveGroup(group: SavedGroup) {
  const existing = loadSavedGroups()
  if (existing.some((g) => g.groupToken === group.groupToken)) return
  storage.setGroups([group, ...existing])
}

type GroupsPageProps = {
  userToken: string | null
  userShareToken: string | null
}

export function GroupsPage({ userToken }: GroupsPageProps) {
  const { t } = useTranslation()
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [savedGroups, setSavedGroups] = useState(loadSavedGroups)
  const { containerRef: turnstileRef, getToken: getTurnstileToken } = useTurnstile()
  const { data: fetchedTopGroups, loading: topGroupsLoading } = useApiQuery(
    RESULTS_AVAILABLE ? () => api.getBestGroups() : null,
    [],
  )
  const topGroups = fetchedTopGroups?.slice(0, 5) ?? []

  useEffect(() => {
    setSavedGroups(loadSavedGroups())
    const handler = () => setSavedGroups(loadSavedGroups())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const hasPrediction = userToken !== null

  async function handleCreate() {
    if (!userToken) return
    setCreating(true)
    setCreateError(null)
    try {
      const turnstileToken = await getTurnstileToken()
      const data = await api.createGroup(userToken, groupName.trim() || undefined, turnstileToken || undefined)
      saveGroup({ groupToken: data.groupToken, name: data.name })
      window.location.hash = `csoport/${data.groupToken}`
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section aria-label={t('groups.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader
          icon={<Users className="size-5 text-zinc-500" />}
          title={t('groups.title')}
        >
          <div className="mt-3">
            <GroupInfoBoxes />
          </div>
        </PageHeader>

        <CardContent className="space-y-6">
          {/* My groups */}
          {savedGroups.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-900">
                {t('groups.myGroups')}
              </h3>
              <div className="space-y-2">
                {savedGroups.map((g) => (
                  <a
                    key={g.groupToken}
                    href={`#csoport/${g.groupToken}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <span className="text-sm font-medium text-zinc-900">
                      {g.name}
                    </span>
                    <ExternalLink className="size-3.5 text-zinc-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Create group */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              <Plus className="mr-1.5 inline size-4 text-zinc-500" />
              {t('groups.createTitle')}
            </h3>

            {hasPrediction ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                    {t('groups.createNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
                    placeholder={t('groups.createNamePlaceholder')}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    maxLength={60}
                  />
                </div>
                {createError && (
                  <p className="text-xs font-medium text-red-600">{createError}</p>
                )}
                <Button onClick={() => void handleCreate()} disabled={creating} className="w-full">
                  <Plus className="size-4" />
                  {t('groups.createButton')}
                </Button>
                <div ref={turnstileRef} />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">
                  {t('groups.createRequiresPrediction')}
                </p>
                <a
                  href="#jatek"
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-950"
                >
                  {t('groups.createRequiresPredictionLink')}
                  <ArrowRight className="size-3" />
                </a>
              </div>
            )}
          </div>

          {/* Top groups */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Trophy className="size-4 text-zinc-500" />
              {t('groups.topGroupsTitle')}
            </h3>
            {topGroupsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-zinc-400" />
              </div>
            ) : topGroups.length === 0 ? (
              <p className="text-xs text-zinc-400">{t('groups.topGroupsEmpty')}</p>
            ) : (
              <div className="space-y-2">
                {topGroups.map((group, idx) => (
                  <a
                    key={group.groupToken}
                    href={`#csoport/${group.groupToken}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700'
                          : idx === 1
                            ? 'bg-zinc-200 text-zinc-600'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {group.name}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {t('leaderboard.bestGroupsMembers', { count: group.memberCount })}
                        {group.avgScore != null && (
                          <>
                            {' '}&middot;{' '}
                            {t('leaderboard.bestGroupsAvgScore')}:{' '}
                            <span className="font-semibold tabular-nums">{group.avgScore.toFixed(1)}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <ExternalLink className="size-3.5 shrink-0 text-zinc-400" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
