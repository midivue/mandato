import { useTranslation } from 'react-i18next'
import type { StatsResponse } from '@mandatoto/shared/types'
import { pct } from './stats-utils'

export function AccuracyRates({ stats }: { stats: StatsResponse }) {
  const { t } = useTranslation()
  const finalizedCount = stats.totalPredictions

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('stats.accuracyTitle')}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('stats.correctListRate')}
          </p>
          <p className="text-lg font-bold tabular-nums text-zinc-900">
            {pct(stats.correctListWinner as number, finalizedCount)}%
            <span className="ml-1.5 text-xs font-medium text-zinc-500">
              ({stats.correctListWinner}/{finalizedCount} {t('stats.ofFinalized')})
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('stats.correctPmRate')}
          </p>
          <p className="text-lg font-bold tabular-nums text-zinc-900">
            {pct(stats.correctPm as number, finalizedCount)}%
            <span className="ml-1.5 text-xs font-medium text-zinc-500">
              ({stats.correctPm}/{finalizedCount} {t('stats.ofFinalized')})
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
