import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS } from '@/data/election-options'
import { PARTY_IDS } from '@mandatoto/shared/types'
import type { StatsResponse, PartyId } from '@mandatoto/shared/types'

export function PartyAccuracy({ stats }: { stats: StatsResponse }) {
  const { t } = useTranslation()

  const maxErr = useMemo(() => {
    return Math.max(
      ...PARTY_IDS.map((id) => stats.avgAbsoluteErrors[id] ?? 0),
      stats.avgAbsoluteErrors.nationalities ?? 0,
      1,
    )
  }, [stats.avgAbsoluteErrors])

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('stats.partyAccuracyTitle')}</h3>
      <div className="space-y-2">
        {PARTY_OPTIONS.map((party) => {
          const err = stats.avgAbsoluteErrors[party.id as PartyId]
          const barW = err !== null ? (err / maxErr) * 100 : 0
          const errColor = err !== null ? (err <= 2 ? 'bg-emerald-400' : err <= 5 ? 'bg-amber-400' : 'bg-red-400') : 'bg-zinc-300'
          return (
            <div key={party.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-700">{party.shortName}</span>
                <span className="tabular-nums text-zinc-500">{err !== null ? `±${err.toFixed(1)}%` : '—'}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div className={`h-full rounded-full ${errColor}`} style={{ width: `${barW}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
