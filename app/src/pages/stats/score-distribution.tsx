import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StatsResponse } from '@mandatoto/shared/types'

export function ScoreDistribution({ stats }: { stats: StatsResponse }) {
  const { t } = useTranslation()

  const scoreDistMax = useMemo(() => {
    let max = 0
    for (const v of Object.values(stats.scoreDistribution)) if ((v as number) > max) max = v as number
    return max
  }, [stats.scoreDistribution])

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('stats.scoreDistTitle')}</h3>
      <div className="space-y-1.5">
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90].map((bracket) => {
          const count = (stats.scoreDistribution[String(bracket)] ?? 0) as number
          const barW = scoreDistMax > 0 ? (count / scoreDistMax) * 100 : 0
          return (
            <div key={bracket} className="flex items-center gap-2">
              <span className="w-12 text-right text-[11px] tabular-nums text-zinc-500">
                {bracket}–{bracket + 10}
              </span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-zinc-600" style={{ width: `${barW}%` }} />
              </div>
              <span className="w-8 text-right text-[11px] tabular-nums text-zinc-500">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
