import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import type { SharedPrediction } from '@mandatoto/shared/types'
import pmXSvg from '@/assets/pm-x.svg'
import { DeltaIndicator } from './profile-deltas'
import { PCT_KEYS, pctDisplay } from './profile-utils'

type Props = {
  prediction: SharedPrediction
}

export function ProfilePredictionsCompact({ prediction }: Props) {
  const { t } = useTranslation()

  return (
    <div>
      {/* table-fixed: columns respect the header widths so nothing overflows on 320px phones */}
      <table className="w-full table-fixed text-xs">
        <colgroup>
          <col className="w-7" />
          <col />
          <col className="w-16" />
          <col className="w-9" />
          <col className="w-[5.5rem]" />
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-1.5 py-2 text-center">#</th>
            <th className="px-2 py-2 text-left">{t('profile.compact.party')}</th>
            <th className="px-2 py-2 text-right">%</th>
            <th className="px-1.5 py-2 text-center">✕</th>
            <th className="px-2 py-2 text-left">{t('profile.compact.pm')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {PARTY_OPTIONS.map((option) => {
            const pctKey = PCT_KEYS[option.id]
            const pctValue = prediction[pctKey] as number | null
            const isListWinner = prediction.listWinnerId === option.id
            const isBelowThreshold = pctValue !== null && pctValue < 5
            const pmOption = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === option.id)
            const isPmWinner = prediction.pmWinnerId === option.id
            return (
              <tr
                key={option.id}
                className={`transition-colors ${isListWinner ? 'bg-blue-50/50' : ''}`}
              >
                {/* Ballot number */}
                <td className="px-1.5 py-2.5 text-center text-[11px] font-medium text-zinc-400">
                  {option.ballotNumber}
                </td>

                {/* Party logo + short name only */}
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={option.logoSrc}
                      alt={option.shortName}
                      title={option.fullName}
                      className="size-5 shrink-0 rounded object-contain"
                    />
                    <span className="truncate font-semibold text-zinc-900">{option.shortName}</span>
                  </div>
                </td>

                {/* List percentage + delta */}
                <td className="px-2 py-2.5 text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`tabular-nums font-semibold ${
                      isBelowThreshold ? 'text-red-600' : 'text-zinc-900'
                    }`}>
                      {pctDisplay(pctValue)}
                    </span>
                    <DeltaIndicator guess={pctValue} partyId={option.id} />
                  </div>
                </td>

                {/* List winner mark */}
                <td className="px-1.5 py-2.5 text-center">
                  <span className={`inline-flex size-6 items-center justify-center rounded-full border-2 ${
                    isListWinner ? 'border-zinc-400' : 'border-zinc-200'
                  }`}>
                    {isListWinner && (
                      <span className="text-sm font-bold leading-none text-[#1616E6]">&#x2715;</span>
                    )}
                  </span>
                </td>

                {/* PM candidate */}
                <td className="px-2 py-2.5">
                  {pmOption ? (
                    <div className={`flex items-center gap-1.5 ${!isPmWinner ? 'opacity-40' : ''}`}>
                      <div className={`relative size-7 shrink-0 overflow-hidden rounded border ${
                        isPmWinner ? 'border-zinc-700 ring-1 ring-zinc-600' : 'border-zinc-200'
                      }`}>
                        <img
                          src={pmOption.portraitSrc}
                          alt={pmOption.candidateName}
                          className={`size-full object-cover object-top ${
                            !isPmWinner || isBelowThreshold ? 'grayscale' : ''
                          }`}
                        />
                        {isBelowThreshold && (
                          <img
                            src={pmXSvg}
                            alt=""
                            aria-hidden
                            className="pointer-events-none absolute inset-0 size-full object-fill"
                          />
                        )}
                      </div>
                      <span className={`truncate text-[11px] font-medium leading-tight ${
                        isPmWinner ? 'text-zinc-900' : 'text-zinc-400'
                      }`}>
                        {pmOption.candidateName.split(' ').slice(-1)[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-zinc-300">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
