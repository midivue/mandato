import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS } from '@/data/election-options'
import { REFERENCE_RESULT, RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { StatsResponse, PartyId } from '@mandatoto/shared/types'
import { deltaClass, formatDelta } from './stats-utils'

export function ConsensusTable({ stats }: { stats: StatsResponse }) {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">
        {t(RESULTS_AVAILABLE ? 'stats.consensusTitle' : 'stats.consensusTitlePreResult')}
      </h3>
      <p className="mb-3 text-[11px] text-zinc-400">
        {t(RESULTS_AVAILABLE ? 'stats.consensusDesc' : 'stats.consensusDescPreResult')}
      </p>
      <div className="overflow-hidden rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <th className="px-3 py-2">&nbsp;</th>
              <th className="px-3 py-2 text-right">{t('stats.communityAvg')}</th>
              {RESULTS_AVAILABLE && (
                <>
                  <th className="px-3 py-2 text-right">{t('stats.actualResult')}</th>
                  <th className="px-3 py-2 text-right">{t('stats.delta')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {PARTY_OPTIONS.map((party) => {
              const avg = stats.averagePercents[party.id as PartyId]
              const actual = REFERENCE_RESULT.percentages[party.id]
              const delta = avg !== null ? avg - actual : null
              return (
                <tr key={party.id} className="border-b border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">{party.shortName}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden w-16 sm:block">
                        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full rounded-full bg-blue-400/60" style={{ width: `${avg ?? 0}%` }} />
                        </div>
                      </div>
                      <span>{avg !== null ? `${avg.toFixed(1)}%` : '—'}</span>
                    </div>
                  </td>
                  {RESULTS_AVAILABLE && (
                    <>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-700">{actual}%</td>
                      <td className={`px-3 py-2 text-right tabular-nums font-medium ${delta !== null ? deltaClass(delta) : 'text-zinc-400'}`}>
                        {delta !== null ? formatDelta(delta) : '—'}
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
            {(() => {
              const natAvg = stats.averagePercents.nationalities
              const natActual = REFERENCE_RESULT.pctNationalities
              const natDelta = natAvg !== null ? natAvg - natActual : null
              return (
                <tr className="border-t border-zinc-200 bg-zinc-50/40">
                  <td className="px-3 py-2 text-xs font-medium text-zinc-600">{t('stats.nationalities')}</td>
                  <td className="px-3 py-2 text-right text-xs tabular-nums text-zinc-600">
                    {natAvg !== null ? `${natAvg.toFixed(2)}%` : '—'}
                  </td>
                  {RESULTS_AVAILABLE && (
                    <>
                      <td className="px-3 py-2 text-right text-xs tabular-nums text-zinc-600">{natActual}%</td>
                      <td className={`px-3 py-2 text-right text-xs tabular-nums font-medium ${natDelta !== null ? deltaClass(natDelta) : 'text-zinc-400'}`}>
                        {natDelta !== null ? formatDelta(natDelta) : '—'}
                      </td>
                    </>
                  )}
                </tr>
              )
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}
