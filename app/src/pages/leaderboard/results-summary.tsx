import { useTranslation } from 'react-i18next'
import { CheckCircle2 } from 'lucide-react'
import { T } from '@/components/trans'
import { PARTY_OPTIONS, PARTY_SHORT } from '@/data/election-options'
import { REFERENCE_RESULT, RESULTS_AVAILABLE, VOTE_PROCESSING_PCT } from '@mandatoto/shared/types'
import { WINNER_PARTY, WINNER_PM } from './leaderboard-utils'

export function ResultsSummary() {
  const { t } = useTranslation()

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('leaderboard.resultsListWinner')}
          </p>
          {RESULTS_AVAILABLE && WINNER_PARTY ? (
            <div className="flex items-center gap-3">
              <img
                src={WINNER_PARTY.logoSrc}
                alt={WINNER_PARTY.shortName}
                className="h-11 w-auto object-contain"
              />
              <p className="text-sm font-semibold text-zinc-900">
                {WINNER_PARTY.shortName}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-900">—</p>
          )}
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('leaderboard.resultsPm')}
          </p>
          {RESULTS_AVAILABLE && WINNER_PM ? (
            <div className="flex items-center gap-3">
              <img
                src={WINNER_PM.portraitSrc}
                alt={WINNER_PM.candidateName}
                className="h-12 w-10 object-cover"
              />
              <p className="text-sm font-semibold text-zinc-900">
                {WINNER_PM.candidateName} ({PARTY_SHORT[WINNER_PM.id]})
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-zinc-900">—</p>
          )}
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('leaderboard.resultsPercentages')}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {PARTY_OPTIONS.map((p) => (
              <span key={p.id} className="text-xs text-zinc-700">
                <span className="font-semibold">{p.shortName}</span>{' '}
                <span className="tabular-nums">
                  {RESULTS_AVAILABLE ? `${REFERENCE_RESULT.percentages[p.id]}%` : '0%'}
                </span>
              </span>
            ))}
            <span className="text-xs text-zinc-500">
              <span className="font-semibold">{t('stats.nationalities')}</span>{' '}
              <span className="tabular-nums">
                {RESULTS_AVAILABLE ? `${REFERENCE_RESULT.pctNationalities}%` : '0%'}
              </span>
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            {t('leaderboard.resultsMandates')}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {PARTY_OPTIONS.map((p) => {
              const count = RESULTS_AVAILABLE ? REFERENCE_RESULT.mandates[p.id] : null
              const isMajority = count != null && count >= 133
              return (
                <span key={p.id} className="text-xs text-zinc-700">
                  <span className="font-semibold">{p.shortName}</span>{' '}
                  <span className={`tabular-nums ${isMajority ? 'underline underline-offset-2' : ''}`}>
                    {count != null ? count : '—'}
                  </span>
                </span>
              )
            })}
            <span className="text-xs text-zinc-500">
              <span className="font-semibold">{t('stats.nationalities')}</span>{' '}
              <span className="tabular-nums">
                {RESULTS_AVAILABLE ? REFERENCE_RESULT.nationalitiesMandate : '—'}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[3fr_1fr]">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 shrink-0">
            {t('leaderboard.resultsProcessing')}
          </p>
          <div className="flex flex-1 items-center gap-3">
            {RESULTS_AVAILABLE ? (
              VOTE_PROCESSING_PCT >= 100 ? (
                <>
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <p className="text-sm font-bold tabular-nums text-emerald-700 shrink-0">100%</p>
                  <div className="h-2 flex-1 rounded-full bg-emerald-100">
                    <div className="h-2 w-full rounded-full bg-emerald-500" />
                  </div>
                </>
              ) : (
                <>
                  <p className={`text-sm font-bold tabular-nums shrink-0 ${VOTE_PROCESSING_PCT < 70 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {VOTE_PROCESSING_PCT}%
                  </p>
                  <div className="h-2 flex-1 rounded-full bg-zinc-200">
                    <div
                      className={`h-2 rounded-full ${VOTE_PROCESSING_PCT < 70 ? 'bg-red-500' : 'bg-yellow-400'}`}
                      style={{ width: `${VOTE_PROCESSING_PCT}%` }}
                    />
                  </div>
                </>
              )
            ) : (
              <>
                <p className="text-sm font-bold tabular-nums text-zinc-300 shrink-0">0%</p>
                <div className="h-2 flex-1 rounded-full bg-zinc-200" />
                <p className="text-xs text-zinc-400 shrink-0">{t('leaderboard.processingAwaiting')}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 shrink-0">
            {t('leaderboard.resultsParticipation')}
          </p>
          <p className="text-sm font-bold tabular-nums text-zinc-900">
            {RESULTS_AVAILABLE ? `${REFERENCE_RESULT.participationRate}%` : '—'}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        <T i18nKey={RESULTS_AVAILABLE ? 'leaderboard.description' : 'leaderboard.descriptionPreResult'} />
      </p>
    </div>
  )
}
