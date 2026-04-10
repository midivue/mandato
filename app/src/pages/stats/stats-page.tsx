import { useTranslation } from 'react-i18next'
import { BarChart3, ExternalLink, Globe, HelpCircle, Map as MapIcon, MapPin, Users } from 'lucide-react'
import { getStats } from '@/lib/api-client'
import { useApiQuery } from '@/hooks/use-api-query'

import { T } from '@/components/trans'
import { TopThreePodium } from '@/components/top-three-podium'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { InfoBox } from '@/components/info-box'
import { REFERENCE_RESULT, RESULTS_AVAILABLE } from '@mandatoto/shared/types'

import { EMPTY_STATS } from './stats-utils'
import { useGeoAggregates } from './use-geo-aggregates'
import { ConsensusTable } from './consensus-table'
import { WinnerDistributions } from './winner-distributions'
import { PartyAccuracy } from './party-accuracy'
import { ScoreDistribution } from './score-distribution'
import { AccuracyRates } from './accuracy-rates'
import { CitiesSection } from './cities-section'
import { CountySection } from './county-section'
import { BudapestSection } from './budapest-section'
import { EuropeSection } from './europe-section'
import { WorldSection } from './world-section'

export function StatsPage() {
  const { t } = useTranslation()
  const { data: fetchedStats } = useApiQuery(getStats, [])
  const stats = fetchedStats ?? EMPTY_STATS
  const finalizedCount = stats.totalPredictions

  const geo = useGeoAggregates(stats)
  const gs = stats.groupStats

  return (
    <section aria-label={t('stats.title')}>
      <Card className="border-zinc-200/90 bg-white/90">
        <PageHeader icon={<BarChart3 className="size-5 text-zinc-500" />} title={t('stats.title')}>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            <T i18nKey={RESULTS_AVAILABLE ? 'stats.description' : 'stats.descriptionPreResult'} />
          </p>
        </PageHeader>
        <CardContent className="space-y-6">
          {/* Participation overview */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {t('stats.totalPredictions')}
              </p>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">{stats.totalPredictions}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <Users className="size-3 text-zinc-400" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {t('stats.totalGroups')}
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">{gs.totalGroups}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <ExternalLink className="size-3 text-zinc-400" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  {t('stats.telexTipCount')}
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">{stats.telexTipCount}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {t('stats.avgScore')}
              </p>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">
                {stats.avgScore !== null ? (stats.avgScore as number).toFixed(1) : '—'}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {t('stats.avgParticipationRate')}
              </p>
              <p className="text-2xl font-bold tabular-nums text-zinc-900">
                {stats.averageParticipationRate != null
                  ? `${(stats.averageParticipationRate as number).toFixed(1)}%`
                  : '—'}
              </p>
              {RESULTS_AVAILABLE && stats.averageParticipationRate != null && (
                <p className="text-[10px] text-zinc-400">
                  {t('stats.actual')}: {REFERENCE_RESULT.participationRate}%
                </p>
              )}
            </div>
          </div>

          {gs.totalGroups > 0 && (
            <div className="space-y-3">
              <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.groupStatsTitle')}</h3>
              <p className="mb-3 text-[11px] text-zinc-400">{t('stats.groupStatsDesc')}</p>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <InfoBox icon={<Users className="size-3.5" />} label={t('stats.totalGroups')} value={gs.totalGroups} />
                <InfoBox icon={<Users className="size-3.5" />} label={t('stats.usersInGroups')} value={gs.uniqueMembers} />
                <InfoBox icon={<Users className="size-3.5" />} label={t('stats.avgGroupSize')} value={gs.avgGroupSize !== null ? gs.avgGroupSize.toFixed(1) : '—'} />
                <InfoBox icon={<Users className="size-3.5" />} label={t('stats.maxGroupSize')} value={gs.maxGroupSize} />
              </div>
            </div>
          )}

          <ConsensusTable stats={stats} />

          {RESULTS_AVAILABLE && finalizedCount > 0 && <PartyAccuracy stats={stats} />}

          <WinnerDistributions stats={stats} />

          {RESULTS_AVAILABLE && Object.keys(stats.scoreDistribution).length > 0 && (
            <ScoreDistribution stats={stats} />
          )}

          {RESULTS_AVAILABLE && stats.topScorers.length > 0 && (
            <TopThreePodium items={stats.topScorers} />
          )}

          {RESULTS_AVAILABLE && finalizedCount > 0 && <AccuracyRates stats={stats} />}

          <div className="border-t border-zinc-200 pt-6">
            <h3 className="text-sm font-semibold text-zinc-900">{t('stats.geoTitle')}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{t('stats.geoDescription')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
            <InfoBox icon={<MapPin className="size-3.5" />} label={t('stats.geoBudapest')} value={geo.budapestVotes} />
            <InfoBox icon={<MapIcon className="size-3.5" />} label={t('stats.geoCountryside')} value={geo.countrysideVotes} />
            <InfoBox icon={<Globe className="size-3.5" />} label={t('stats.geoEurope')} value={geo.euVotes} />
            <InfoBox icon={<Globe className="size-3.5" />} label={t('stats.geoWorld')} value={stats.geoBreakdown.abroad} />
            <InfoBox icon={<HelpCircle className="size-3.5" />} label={t('stats.geoNoAnswer')} value={stats.geoBreakdown.noSettlement} />
          </div>
          <p className="text-[11px] italic text-zinc-400">{t('stats.geoNote')}</p>

          <CitiesSection cityCounts={geo.cityCounts} noSettlement={stats.geoBreakdown.noSettlement} />
          <CountySection countyVotes={geo.countyVotes} />
          <BudapestSection districtVotes={geo.districtVotes} totalBudapest={geo.budapestVotes} />
          <EuropeSection countryVotes={geo.countryVotes} />
          <WorldSection abroadTotal={stats.geoBreakdown.abroad} countryVotes={geo.countryVotes} />
        </CardContent>
      </Card>
    </section>
  )
}
