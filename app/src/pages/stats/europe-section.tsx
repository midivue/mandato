import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Map as MapIcon } from 'lucide-react'
import { EuropeMap } from '@/components/europe-map'
import { InfoBox } from '@/components/info-box'
import { RankedList } from '@/components/ranked-list'
import { COUNTRIES } from '@/data/countries'
import { EUROPEAN_ALPHA2 } from '@/data/iso-country-map'
import { TOTAL_EU_COUNTRIES } from './stats-utils'

export function EuropeSection({ countryVotes: allCountryVotes }: { countryVotes: Record<string, number> }) {
  const { t, i18n } = useTranslation()
  const isHu = i18n.language === 'hu'

  const europeanVotes = useMemo(() => {
    const filtered: Record<string, number> = {}
    for (const [code, count] of Object.entries(allCountryVotes)) {
      if (EUROPEAN_ALPHA2.has(code)) filtered[code] = count
    }
    return filtered
  }, [allCountryVotes])

  const rankedCountries = useMemo(() => {
    return Object.entries(europeanVotes)
      .map(([code, count]) => {
        const c = COUNTRIES.find((c) => c.code === code)
        return { key: code, code, label: c ? (isHu ? c.nameHu : c.nameEn) : code, count }
      })
      .sort((a, b) => b.count - a.count)
  }, [europeanVotes, isHu])

  const totalEu = useMemo(() => rankedCountries.reduce((s, c) => s + c.count, 0), [rankedCountries])

  if (Object.keys(europeanVotes).length === 0) return null

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.europeTitle')}</h3>
      <p className="mb-3 text-xs text-zinc-500">{t('stats.europeDescription')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3">
          <EuropeMap countryVotes={europeanVotes} />
        </div>
        <div className="relative">
          <div className="flex flex-col gap-3 md:absolute md:inset-0">
            <RankedList
              title={t('stats.europeTopCountries')}
              items={rankedCountries}
              showCode
              emptyText={t('stats.noData')}
              searchPlaceholder={t('stats.europeSearch')}
            />
            <div className="shrink-0 grid grid-cols-2 gap-3">
              <InfoBox icon={<MapIcon className="size-3.5" />} label={t('stats.europeCovered')} value={`${rankedCountries.length} / ${TOTAL_EU_COUNTRIES}`} />
              <InfoBox icon={<Globe className="size-3.5" />} label={t('stats.europeTotal')} value={totalEu} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
