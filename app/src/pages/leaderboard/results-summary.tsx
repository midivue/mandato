import { useTranslation } from 'react-i18next'
import { BarChart3, CheckCircle2 } from 'lucide-react'
import { T } from '@/components/trans'
import { PARTY_OPTIONS, PARTY_SHORT } from '@/data/election-options'
import { REFERENCE_RESULT, RESULTS_AVAILABLE, VOTE_PROCESSING_PCT } from '@mandatoto/shared/types'
import { WINNER_PARTY, WINNER_PM } from './leaderboard-utils'

export function ResultsSummary() {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <BarChart3 className="size-4 text-zinc-500" />
        {t(RESULTS_AVAILABLE ? 'leaderboard.resultsTitle' : 'leaderboard.resultsTitlePreResult')}
      </h3>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500">
        {t(RESULTS_AVAILABLE ? 'leaderboard.resultsSubtitle' : 'leaderboard.resultsSubtitlePreResult')}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
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
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {t('leaderboard.resultsProcessing')}
        </p>
        <div className="flex items-center gap-2">
          {RESULTS_AVAILABLE ? (
            VOTE_PROCESSING_PCT >= 100 ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">{t('leaderboard.processingComplete')}</p>
              </>
            ) : (
              <>
                <div className="h-2 w-24 rounded-full bg-zinc-200">
                  <div
                    className="h-2 rounded-full bg-zinc-700"
                    style={{ width: `${VOTE_PROCESSING_PCT}%` }}
                  />
                </div>
                <p className="text-sm font-bold tabular-nums text-zinc-900">{VOTE_PROCESSING_PCT}%</p>
              </>
            )
          ) : (
            <>
              <div className="h-2 w-24 rounded-full bg-zinc-200" />
              <p className="text-sm font-bold tabular-nums text-zinc-300">0%</p>
              <p className="text-xs text-zinc-400">{t('leaderboard.processingAwaiting')}</p>
            </>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        <T i18nKey={RESULTS_AVAILABLE ? 'leaderboard.description' : 'leaderboard.descriptionPreResult'} />
      </p>
    </div>
  )
}
