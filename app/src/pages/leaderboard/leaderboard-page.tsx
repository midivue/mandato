import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy } from 'lucide-react'
import { useApiQuery } from '@/hooks/use-api-query'
import * as api from '@/lib/api-client'

import { TopThreePodium } from '@/components/top-three-podium'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'

import { ResultsSummary } from './results-summary'
import { BestGroupsSection } from './best-groups-section'
import { LeaderboardTable } from './leaderboard-table'

type LeaderboardPageProps = {
  currentToken: string | null
}

export function LeaderboardPage({ currentToken }: LeaderboardPageProps) {
  const { t } = useTranslation()
  const { data: fetchedEntries, loading } = useApiQuery(() => api.getLeaderboard(), [])
  const { data: fetchedBestGroups } = useApiQuery(() => api.getBestGroups(), [])
  const entries = useMemo(() => fetchedEntries ?? [], [fetchedEntries])
  const bestGroups = useMemo(() => fetchedBestGroups ?? [], [fetchedBestGroups])

  return (
    <section aria-label={t('leaderboard.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader icon={<Trophy className="size-5 text-zinc-500" />} title={t('leaderboard.title')}>
          {!RESULTS_AVAILABLE && (
            <p className={`mt-1.5 text-xs font-medium text-zinc-400 ${loading || (entries.length === 0 && bestGroups.length === 0) ? 'invisible' : ''}`}>
              {t('leaderboard.preResultsSummary', { tips: entries.length, groups: bestGroups.length })}
            </p>
          )}
        </PageHeader>
        <CardContent className="space-y-5">
          <ResultsSummary />

          {RESULTS_AVAILABLE && entries.length > 0 && entries[0].score != null && (
            <TopThreePodium
              items={entries
                .slice(0, 3)
                .filter((e) => e.score != null)
                .map((e) => ({
                  displayName: e.displayName,
                  score: e.score!,
                  shareToken: e.shareToken,
                }))}
            />
          )}

          <BestGroupsSection bestGroups={bestGroups} />

          <LeaderboardTable entries={entries} loading={loading} currentToken={currentToken} />
        </CardContent>
      </Card>
    </section>
  )
}
