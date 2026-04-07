import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Map as MapIcon } from 'lucide-react'
import { HungaryMap } from '@/components/hungary-map'
import { InfoBox } from '@/components/info-box'
import { RankedList } from '@/components/ranked-list'
import { COUNTIES } from '@/data/settlements'
import { TOTAL_COUNTIES } from './stats-utils'

export function CountySection({ countyVotes }: { countyVotes: Record<number, number> }) {
  const { t } = useTranslation()

  const rankedCounties = useMemo(() => {
    return Object.entries(countyVotes)
      .map(([id, count]) => ({ key: id, label: COUNTIES[Number(id)] ?? '?', count }))
      .sort((a, b) => b.count - a.count)
  }, [countyVotes])

  const coveredCount = Object.keys(countyVotes).length
  const lastCounty = rankedCounties[rankedCounties.length - 1]

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.countyTitle')}</h3>
      <p className="mb-3 text-xs text-zinc-500">{t('stats.countyDescription')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
          <HungaryMap countyVotes={countyVotes} />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-3 md:absolute md:inset-0">
            <RankedList
              title={t('stats.countyTopCounties')}
              items={rankedCounties}
              emptyText={t('stats.noData')}
              searchPlaceholder={t('stats.countySearch')}
            />
            <div className="shrink-0 grid grid-cols-2 gap-3">
              <InfoBox icon={<MapIcon className="size-3.5" />} label={t('stats.countiesCovered')} value={`${coveredCount} / ${TOTAL_COUNTIES}`} />
              <InfoBox icon={<BarChart3 className="size-3.5" />} label={t('stats.fewestTips')} value={lastCounty ? `${lastCounty.label} (${lastCounty.count})` : '—'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
