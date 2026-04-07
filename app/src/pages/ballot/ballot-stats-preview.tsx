import { BarChart2, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useApiQuery } from '@/hooks/use-api-query'
import { getStats } from '@/lib/api-client'
import { PARTY_OPTIONS } from '@/data/election-options'
import type { StatsResponse } from '@mandatoto/shared/types'

const PARTY_COLORS: Record<string, string> = {
  mkkp: 'bg-amber-400',
  tisza: 'bg-blue-500',
  mi_hazank: 'bg-red-600',
  dk: 'bg-indigo-600',
  fidesz_kdnp: 'bg-orange-500',
}

function SkeletonTile() {
  return (
    <div className="animate-pulse space-y-1.5 rounded-lg bg-zinc-100 px-3 py-2.5">
      <div className="h-3 w-16 rounded bg-zinc-200" />
      <div className="h-5 w-10 rounded bg-zinc-200" />
    </div>
  )
}

export function BallotStatsPreview() {
  const { t } = useTranslation()
  const { data, loading } = useApiQuery<StatsResponse>(getStats, [])

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <BarChart2 className="size-4 shrink-0 text-zinc-400" aria-hidden />
        <h3 className="text-sm font-semibold text-zinc-900">{t('flow.statsPreviewTitle')}</h3>
      </div>

      {/* Two count tiles */}
      <div className="grid grid-cols-2 gap-2">
        {loading ? (
          <>
            <SkeletonTile />
            <SkeletonTile />
          </>
        ) : (
          <>
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                {t('flow.statsPreviewTipsLabel')}
              </p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900">
                {data?.totalPredictions ?? '—'}
              </p>
              <p className="text-[10px] text-zinc-400">{t('flow.statsPreviewTipsUnit')}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                {t('flow.statsPreviewGroupsLabel')}
              </p>
              <p className="mt-0.5 text-xl font-bold text-zinc-900">
                {data?.groupStats.totalGroups ?? '—'}
              </p>
              <p className="text-[10px] text-zinc-400">{t('flow.statsPreviewGroupsUnit')}</p>
            </div>
          </>
        )}
      </div>

      {/* Avg party % mini bars */}
      <div className="mt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
          {t('flow.statsPreviewAvgPct')}
        </p>
        {loading ? (
          <div className="animate-pulse space-y-1.5">
            {[60, 80, 45, 35, 90].map((w, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-2.5 w-10 rounded bg-zinc-200" />
                <div className="h-2 rounded bg-zinc-200" style={{ width: `${w * 0.5}%` }} />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-1">
            {PARTY_OPTIONS.map((party) => {
              const pct = data.averagePercents[party.id] ?? 0
              return (
                <div key={party.id} className="flex items-center gap-1.5">
                  <span className="w-[4.5rem] shrink-0 text-[10px] font-medium text-zinc-500 truncate">
                    {party.shortName}
                  </span>
                  <div className="flex flex-1 items-center gap-1">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full ${PARTY_COLORS[party.id] ?? 'bg-zinc-400'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span className="w-7 text-right text-[10px] text-zinc-400 tabular-nums">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <div className="mt-auto pt-4">
        <a
          href="#stats"
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-800"
        >
          <BarChart2 className="size-3.5" aria-hidden />
          {t('flow.statsPreviewCta')}
          <ChevronRight className="size-3.5" aria-hidden />
        </a>
      </div>

    </div>
  )
}
