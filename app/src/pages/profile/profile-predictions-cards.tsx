import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import type { SharedPrediction } from '@mandatoto/shared/types'
import { TOTAL_ELIGIBLE_VOTERS } from '@mandatoto/shared/types'
import pmXSvg from '@/assets/pm-x.svg'
import { DeltaIndicator } from './profile-deltas'
import { PCT_KEYS, pctDisplay } from './profile-utils'

type Props = {
  prediction: SharedPrediction
}

export function ProfilePredictionsCards({ prediction }: Props) {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
      <div className="grid grid-cols-5">
        {PARTY_OPTIONS.map((option) => {
          const isWinner = prediction.listWinnerId === option.id
          const pctValue = prediction[PCT_KEYS[option.id]] as number | null
          const pmOption = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === option.id)
          const isPmWinner = prediction.pmWinnerId === option.id

          return (
            <div key={option.id} className="border-r border-zinc-200 last:border-r-0">
              <div className="flex w-full flex-col items-center bg-white p-4 text-center md:min-h-[25rem]">
                <p className="mb-3 text-xs font-semibold text-zinc-700">{option.ballotNumber}.</p>
                <img
                  src={option.logoSrc}
                  alt={option.shortName}
                  className="mx-auto mb-4 h-12 w-auto object-contain"
                />
                <div className="mb-4 flex justify-center">
                  <span className={`flex size-10 items-center justify-center overflow-hidden rounded-full border-2 ${
                    isWinner ? 'border-zinc-400' : 'border-zinc-300'
                  }`}>
                    {isWinner && <span className="text-[2rem] font-bold leading-none text-[#1616E6]">&#x2715;</span>}
                  </span>
                </div>
                <p className="text-xs font-semibold tracking-wide text-zinc-900">{option.shortName}</p>
                <p className="mt-1 min-h-[2.8rem] break-words text-[10px] uppercase leading-tight text-zinc-600">
                  {option.fullName}
                </p>
                <div className="mt-5 w-full border-t border-zinc-200 pt-4">
                  <ul className="space-y-0.5 text-[10px] uppercase leading-tight text-zinc-700">
                    {option.topFiveCandidates.map((candidate) => (
                      <li key={candidate}>{candidate}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="border-t border-zinc-200 px-3 pb-3 pt-2">
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                    {t('flow.partyPercent')}
                  </span>
                  <p className={`flex items-center justify-between gap-1 rounded-md border bg-zinc-50 px-2 py-1.5 text-xs ${
                    pctValue !== null && pctValue < 5
                      ? 'border-red-300 text-red-700'
                      : 'border-zinc-200 text-zinc-800'
                  }`}>
                    <span>{pctDisplay(pctValue)}</span>
                    <DeltaIndicator guess={pctValue} partyId={option.id} />
                  </p>
                  {pctValue !== null && pctValue > 0 && prediction.participationRate !== null && prediction.participationRate > 0 && (
                    <p className="mt-0.5 text-[10px] text-zinc-400">
                      {t('flow.totalVotesEst', { count: Math.round(TOTAL_ELIGIBLE_VOTERS * prediction.participationRate / 100 * pctValue / 100).toLocaleString('hu-HU') })}
                    </p>
                  )}
                </div>
                <div className="mt-2 border-t border-zinc-100 pt-2">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                    {t('flow.pmCandidate')}
                  </p>
                  {pmOption && (() => {
                    const isBelowPct = pctValue !== null && pctValue < 5
                    const pmImgClass = isPmWinner ? '' : 'grayscale opacity-60'
                    const pmBorderClass = isPmWinner
                      ? 'ring-2 ring-zinc-800 border-zinc-800 bg-zinc-50'
                      : isBelowPct
                        ? 'border-zinc-200 bg-zinc-50'
                        : 'border-zinc-200 bg-white'
                    return (
                      <div className={`w-full rounded-md border p-2 text-center ${pmBorderClass}`}>
                        <div className="space-y-2">
                          <div className="relative overflow-hidden rounded">
                            <img
                              src={pmOption.portraitSrc}
                              alt={pmOption.candidateName}
                              className={`aspect-auto h-50 w-full object-cover object-top ${pmImgClass}`}
                            />
                            {isBelowPct && (
                              <img
                                src={pmXSvg}
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                              />
                            )}
                          </div>
                          <p className={`truncate text-xs font-semibold ${
                            isPmWinner ? 'text-zinc-900' : 'text-zinc-400'
                          }`}>
                            {pmOption.candidateName}
                          </p>
                          <p className={`truncate text-[10px] ${
                            isPmWinner ? 'text-zinc-600' : 'text-zinc-400'
                          }`}>
                            {pmOption.partyShortName}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
