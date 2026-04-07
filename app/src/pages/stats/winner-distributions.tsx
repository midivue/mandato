import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS, PARTY_SHORT, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { REFERENCE_RESULT, RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { StatsResponse } from '@mandatoto/shared/types'
import { PM_NAME } from './stats-utils'

export function WinnerDistributions({ stats }: { stats: StatsResponse }) {
  const { t } = useTranslation()

  const totalList = Object.values(stats.listWinnerCounts).reduce((a, b) => a + b, 0)
  const totalPm = Object.values(stats.pmWinnerCounts).reduce((a, b) => a + b, 0)
  const finalizedCount = stats.totalPredictions

  let topListMax = 0
  let topListKey = ''
  for (const [k, v] of Object.entries(stats.listWinnerCounts)) {
    if ((v as number) > topListMax) { topListMax = v as number; topListKey = k }
  }
  const communityConfidence = totalList > 0 ? (topListMax / totalList) * 100 : 0

  let topPmMax = 0
  let topPmKey = ''
  for (const [k, v] of Object.entries(stats.pmWinnerCounts)) {
    if ((v as number) > topPmMax) { topPmMax = v as number; topPmKey = k }
  }
  const pmListAgree = topListKey === topPmKey && topListKey !== ''

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.listWinnerTitle')}</h3>
        <p className="mb-3 text-[11px] text-zinc-400">
          {t('stats.basedOnFinalized', { count: finalizedCount })}
        </p>
        <div className="space-y-2">
          {PARTY_OPTIONS.map((party) => {
            const count = (stats.listWinnerCounts[party.id] ?? 0) as number
            const percentage = totalList > 0 ? (count / totalList) * 100 : 0
            const isActual = RESULTS_AVAILABLE && party.id === REFERENCE_RESULT.listWinnerId
            return (
              <div key={party.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isActual ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {party.shortName}
                    {isActual && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {t('stats.actual')}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-zinc-500">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all ${isActual ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {totalList > 0 && (
          <p className="mt-2 text-[11px] text-zinc-400">
            {t('stats.communityConfidence', { party: PARTY_SHORT[topListKey] ?? '?', pct: communityConfidence.toFixed(0) })}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-900">{t('stats.pmWinnerTitle')}</h3>
        <p className="mb-3 text-[11px] text-zinc-400">
          {t('stats.basedOnFinalized', { count: finalizedCount })}
        </p>
        <div className="space-y-2">
          {PRIME_MINISTER_OPTIONS.map((pm) => {
            const count = (stats.pmWinnerCounts[pm.id] ?? 0) as number
            const percentage = totalPm > 0 ? (count / totalPm) * 100 : 0
            const isActual = RESULTS_AVAILABLE && pm.id === REFERENCE_RESULT.pmWinnerId
            return (
              <div key={pm.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${isActual ? 'text-zinc-900' : 'text-zinc-700'}`}>
                    {PM_NAME[pm.id]} ({PARTY_SHORT[pm.id]})
                    {isActual && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {t('stats.actual')}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums text-zinc-500">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className={`h-full rounded-full transition-all ${isActual ? 'bg-zinc-800' : 'bg-zinc-300'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
        {totalPm > 0 && (
          <p className="mt-2 text-[11px] text-zinc-400">
            {pmListAgree ? t('stats.pmListAgreeYes') : t('stats.pmListAgreeNo')}
          </p>
        )}
      </div>
    </div>
  )
}
