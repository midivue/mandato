import { useState, useMemo, useCallback, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, MapPin, Search } from 'lucide-react'
import { getMapColor } from '@/lib/map-utils'
import { InfoBox } from '@/components/info-box'
import { TAG_CLOUD_LIMIT, REST_MIN_FONT, REST_MAX_FONT, TOTAL_SETTLEMENTS } from './stats-utils'

const MOBILE_LIMIT = 5
const SM_BREAKPOINT = 640
const MOBILE_MQ = `(max-width: ${SM_BREAKPOINT - 1}px)`

function subscribeToMobile(cb: () => void) {
  const mql = window.matchMedia(MOBILE_MQ)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

export function CitiesSection({ cityCounts, noSettlement }: {
  cityCounts: Record<string, number>
  noSettlement: number
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_MQ).matches,
    () => false,
  )

  const sorted = useMemo(() => {
    return Object.entries(cityCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }, [cityCounts])

  const { heroItem, restItems } = useMemo(() => {
    const items = sorted.slice(0, TAG_CLOUD_LIMIT)
    if (items.length === 0) return { heroItem: null, restItems: [] }
    const hero = items[0]
    const rest = items.slice(1)
    const restMax = rest[0]?.count ?? 1
    const restMin = rest[rest.length - 1]?.count ?? 1
    const logMax = Math.log(restMax + 1)
    const logMin = Math.log(restMin + 1)
    const logRange = Math.max(logMax - logMin, 0.01)
    const total = rest.length
    return {
      heroItem: hero,
      restItems: rest.map((item, i) => {
        const logRatio = (Math.log(item.count + 1) - logMin) / logRange
        const rankRatio = total > 1 ? 1 - i / (total - 1) : 1
        return {
          ...item,
          fontSize: REST_MIN_FONT + logRatio * (REST_MAX_FONT - REST_MIN_FONT),
          color: getMapColor(rankRatio * 100, 100),
        }
      }),
    }
  }, [sorted])

  const rankMap = useMemo(() => {
    const m = new Map<string, number>()
    sorted.forEach((item, i) => m.set(item.name, i + 1))
    return m
  }, [sorted])

  const filtered = useMemo(() => {
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter((c) => c.name.toLowerCase().includes(q))
  }, [sorted, search])

  const onSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const uniqueCount = sorted.length

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.citiesTitle')}</h3>
      <p className="mb-3 text-xs text-zinc-500">{t('stats.citiesDescription')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex min-h-44 flex-col justify-center rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 md:min-h-64">
          {heroItem && (
            <div className="mb-2 text-center">
              <span
                className="cursor-default font-bold leading-tight text-[#103d8f] transition-opacity hover:opacity-70"
                style={{ fontSize: 34 }}
                title={`${heroItem.name}: ${heroItem.count}`}
              >
                {heroItem.name}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
            {restItems.map((item) => (
              <span
                key={item.name}
                className="cursor-default whitespace-nowrap leading-tight font-medium transition-opacity hover:opacity-70"
                style={{ fontSize: item.fontSize, color: item.color }}
                title={`${item.name}: ${item.count}`}
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="flex flex-col gap-3 md:absolute md:inset-0">
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 flex flex-col">
              <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/60 px-3 py-2 flex items-center gap-2">
                <Search className="size-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={onSearch}
                  placeholder={t('stats.citiesSearch')}
                  className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                {(() => {
                  const shouldLimit = isMobile && !expanded && !search.trim() && filtered.length > MOBILE_LIMIT
                  const visible = shouldLimit ? filtered.slice(0, MOBILE_LIMIT) : filtered
                  return visible.map((item) => {
                    const pct = sorted[0]?.count ? (item.count / sorted[0].count) * 100 : 0
                    return (
                      <div key={item.name} className="flex items-center gap-2.5 px-3 py-1.5">
                        <span className="w-7 text-right text-[11px] font-medium tabular-nums text-zinc-400">
                          {rankMap.get(item.name)}.
                        </span>
                        <span className="flex-1 truncate text-xs font-medium text-zinc-900">
                          {item.name}
                        </span>
                        <span className="text-xs tabular-nums text-zinc-500">{item.count}</span>
                        <div className="hidden w-16 sm:block">
                          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                            <div
                              className="h-full rounded-full bg-blue-400/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
                {filtered.length === 0 && (
                  <p className="px-3 py-3 text-xs text-zinc-400">{t('stats.noData')}</p>
                )}
              </div>
              {isMobile && !search.trim() && filtered.length > MOBILE_LIMIT && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex w-full items-center justify-center gap-1 border-t border-zinc-200 bg-zinc-50/60 px-3 py-2 text-[11px] font-medium text-zinc-500 transition hover:text-zinc-700"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="size-3" />
                      {t('stats.showLess')}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3" />
                      {t('stats.showAll', { count: filtered.length })}
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="shrink-0 grid grid-cols-2 gap-3">
              <InfoBox icon={<MapPin className="size-3.5" />} label={t('stats.settlementsCovered')} value={`${uniqueCount} / ${TOTAL_SETTLEMENTS}`} />
              <InfoBox icon={<MapPin className="size-3.5" />} label={t('stats.geoNoSettlement')} value={noSettlement} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
