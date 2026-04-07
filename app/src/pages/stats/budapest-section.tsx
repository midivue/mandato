import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, MapPin } from 'lucide-react'
import { BudapestMap } from '@/components/budapest-map'
import { InfoBox } from '@/components/info-box'
import { RankedList } from '@/components/ranked-list'
import { TOTAL_DISTRICTS } from './stats-utils'

export function BudapestSection({ districtVotes, totalBudapest }: {
  districtVotes: Record<number, number>
  totalBudapest: number
}) {
  const { t } = useTranslation()

  const rankedDistricts = useMemo(() => {
    return Object.entries(districtVotes)
      .map(([id, count]) => {
        const num = Number(id)
        const roman = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI', 'XXII', 'XXIII'][num] ?? String(num)
        return { key: id, label: `${roman}. kerület`, count }
      })
      .sort((a, b) => b.count - a.count)
  }, [districtVotes])

  const coveredCount = Object.keys(districtVotes).length

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.budapestTitle')}</h3>
      <p className="mb-3 text-xs text-zinc-500">{t('stats.budapestDescription')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
          <BudapestMap districtVotes={districtVotes} />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-3 md:absolute md:inset-0">
            <RankedList
              title={t('stats.budapestTopDistricts')}
              items={rankedDistricts}
              emptyText={t('stats.noData')}
              searchPlaceholder={t('stats.budapestSearch')}
            />
            <div className="shrink-0 grid grid-cols-2 gap-3">
              <InfoBox icon={<BarChart3 className="size-3.5" />} label={t('stats.districtsCovered')} value={`${coveredCount} / ${TOTAL_DISTRICTS}`} />
              <InfoBox icon={<MapPin className="size-3.5" />} label={t('stats.budapestTotal')} value={totalBudapest} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
