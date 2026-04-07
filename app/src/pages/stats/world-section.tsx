import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Map as MapIcon } from 'lucide-react'
import { WorldMap } from '@/components/world-map'
import { InfoBox } from '@/components/info-box'
import { RankedList } from '@/components/ranked-list'
import { COUNTRIES } from '@/data/countries'
import { TOTAL_WORLD_COUNTRIES } from './stats-utils'

export function WorldSection({ abroadTotal, countryVotes: allCountryVotes }: {
  abroadTotal: number
  countryVotes: Record<string, number>
}) {
  const { t, i18n } = useTranslation()
  const isHu = i18n.language === 'hu'

  const worldVotes = allCountryVotes

  const rankedCountries = useMemo(() => {
    return Object.entries(worldVotes)
      .map(([code, count]) => {
        const c = COUNTRIES.find((c) => c.code === code)
        return { key: code, code, label: c ? (isHu ? c.nameHu : c.nameEn) : code, count }
      })
      .sort((a, b) => b.count - a.count)
  }, [worldVotes, isHu])

  if (Object.keys(worldVotes).length === 0) return null

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.worldTitle')}</h3>
      <p className="mb-3 text-xs text-zinc-500">{t('stats.worldDescription')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
          <WorldMap countryVotes={worldVotes} />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-3 md:absolute md:inset-0">
            <RankedList
              title={t('stats.worldTopCountries')}
              items={rankedCountries}
              showCode
              emptyText={t('stats.noData')}
              searchPlaceholder={t('stats.worldSearch')}
            />
            <div className="shrink-0 grid grid-cols-2 gap-3">
              <InfoBox icon={<MapIcon className="size-3.5" />} label={t('stats.worldCovered')} value={`${rankedCountries.length} / ${TOTAL_WORLD_COUNTRIES}`} />
              <InfoBox icon={<Globe className="size-3.5" />} label={t('stats.abroadTotal')} value={abroadTotal} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
