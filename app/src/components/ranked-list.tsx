import { useState, useMemo, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'

const MOBILE_LIMIT = 5
const SM_BREAKPOINT = 640
const MOBILE_MQ = `(max-width: ${SM_BREAKPOINT - 1}px)`

function subscribeToMobile(cb: () => void) {
  const mql = window.matchMedia(MOBILE_MQ)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(MOBILE_MQ).matches,
    () => false,
  )
}

export function RankedList({
  title,
  items,
  emptyText,
  showCode,
  searchPlaceholder,
}: {
  title: string
  items: { key: string; label: string; code?: string; count: number }[]
  emptyText: string
  showCode?: boolean
  searchPlaceholder?: string
}) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()

  const rankMap = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach((item, i) => m.set(item.key, i + 1))
    return m
  }, [items])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((c) => c.label.toLowerCase().includes(q) || (c.code && c.code.toLowerCase().includes(q)))
  }, [items, search])

  const total = useMemo(
    () => items.reduce((sum, c) => sum + c.count, 0),
    [items],
  )

  const shouldLimit = isMobile && !expanded && !search.trim() && filtered.length > MOBILE_LIMIT
  const visible = shouldLimit ? filtered.slice(0, MOBILE_LIMIT) : filtered

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200 flex flex-col">
      {searchPlaceholder ? (
        <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/60 px-3 py-2 flex items-center gap-2">
          <Search className="size-3.5 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-xs text-zinc-900 placeholder:text-zinc-400 outline-none"
          />
        </div>
      ) : (
        <div className="shrink-0 border-b border-zinc-200 bg-zinc-50/60 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
        {visible.map((item) => {
          const pctOfTotal = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.key} className="flex items-center gap-2.5 px-3 py-1.5">
              <span className="w-7 text-right text-[11px] font-medium tabular-nums text-zinc-400">
                {rankMap.get(item.key)}.
              </span>
              {showCode && item.code && (
                <span className="w-7 text-center text-[11px] font-medium tabular-nums text-zinc-400">
                  {item.code}
                </span>
              )}
              <span className="flex-1 truncate text-xs font-medium text-zinc-900">
                {item.label}
              </span>
              <span className="text-xs tabular-nums text-zinc-500">{item.count}</span>
              <div className="hidden w-16 sm:block">
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-blue-400/70"
                    style={{ width: `${pctOfTotal}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && (
          <p className="px-3 py-3 text-xs text-zinc-400">{emptyText}</p>
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
  )
}
