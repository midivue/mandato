import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { isBelowThreshold } from '@/hooks/use-prediction'
import type { VotingDraft, PercentFieldId } from '@/hooks/use-prediction'
import { computeVoteCount } from '@/hooks/use-prediction/percent-math'
import pmXSvg from '@/assets/pm-x.svg'

const STEPS: [number, string][] = [
  [0.05, '.05'],
  [0.1,  '.1' ],
  [0.5,  '.5' ],
  [1,    '1'  ],
  [5,    '5'  ],
]

function applyStep(current: string, step: number): string {
  const val = parseFloat(current || '0')
  const next = Math.max(0, Math.min(100, Math.round((val + step) * 1000) / 1000))
  return String(next)
}

type PartyGridProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  updatePercent: (field: PercentFieldId, value: string) => void
}

export function PartyGrid({ draft, canEdit, updateDraft, updatePercent }: PartyGridProps) {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-300 bg-white">
      {/* Mobile: horizontal snap scroll strip — Desktop: 5-column grid */}
      <div className="flex snap-x snap-mandatory overflow-x-auto md:grid md:grid-cols-5 md:overflow-visible">
        {PARTY_OPTIONS.map((option) => {
          const pmOption = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === option.id)
          const belowThreshold = isBelowThreshold(draft.listPercents[option.id])
          const isSelected = draft.listPartyId === option.id

          return (
            <div
              key={option.id}
              className="w-[85vw] max-w-xs shrink-0 snap-center border-r border-zinc-200 last:border-r-0 md:w-auto md:max-w-none md:shrink md:border-b-0 md:border-r"
            >
              {/* Party selector button */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => updateDraft((prev) => ({
                  ...prev,
                  listPartyId: option.id,
                  pmCandidateId: prev.pmCandidateId === null || prev.pmCandidateId !== option.id
                    ? option.id
                    : prev.pmCandidateId,
                }))}
                className={`group relative flex w-full flex-col items-center bg-white p-4 text-center transition md:min-h-[25rem] ${
                  !canEdit ? 'opacity-75' : ''
                }`}
              >
                <p className="mb-3 text-xs font-semibold text-zinc-700">{option.ballotNumber}.</p>
                <img
                  src={option.logoSrc}
                  alt={option.shortName}
                  className="mx-auto mb-4 h-12 w-auto object-contain"
                />
                <div className="mb-4 flex justify-center">
                  <span className={`flex size-10 items-center justify-center overflow-hidden rounded-full border-2 ${
                    isSelected ? 'border-zinc-400' : 'border-zinc-300'
                  }`}>
                    {isSelected
                      ? <span className="text-[2rem] font-bold leading-none text-[#1616E6]">&#x2715;</span>
                      : <span className="text-[2rem] font-bold leading-none text-zinc-900 opacity-0 transition-opacity group-hover:opacity-30">&#x2715;</span>
                    }
                  </span>
                </div>
                <p className="text-xs font-semibold tracking-wide text-zinc-900">{option.shortName}</p>
                <p className="mt-1 min-h-[2.8rem] break-words text-[10px] uppercase leading-tight text-zinc-600">
                  {option.fullName}
                </p>

                {/* Candidate list: hidden on mobile behind a <details>, always visible on desktop */}
                <div className="mt-4 w-full border-t border-zinc-200 pt-3 md:hidden">
                  <details className="group/details text-left">
                    <summary className="cursor-pointer list-none text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:text-zinc-600">
                      {t('flow.candidatesLabel')} ↓
                    </summary>
                    <ul className="mt-2 space-y-0.5 text-center text-[10px] uppercase leading-tight text-zinc-700">
                      {option.topFiveCandidates.map((candidate) => (
                        <li key={candidate}>{candidate}</li>
                      ))}
                    </ul>
                  </details>
                </div>
                <div className="mt-5 hidden w-full border-t border-zinc-200 pt-4 md:block">
                  <ul className="space-y-0.5 text-[10px] uppercase leading-tight text-zinc-700">
                    {option.topFiveCandidates.map((candidate) => (
                      <li key={candidate}>{candidate}</li>
                    ))}
                  </ul>
                </div>
              </button>

              {/* Percent stepper + PM selector */}
              <div className="border-t border-zinc-200 px-3 pb-3 pt-2">
                <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                  {t('flow.partyPercent')}
                </span>

                {/* Step size selector — shared activeStep across all 5 columns */}
                <div className="mt-1 grid grid-cols-5 gap-1 md:gap-0.5">
                  {STEPS.map(([step, label]) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setActiveStep(step)}
                      className={`h-7 rounded font-mono text-[11px] font-medium transition md:h-6 md:text-[10px] ${
                        activeStep === step
                          ? 'bg-zinc-800 text-white'
                          : 'border border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Minus / value / Plus */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => updatePercent(option.id, applyStep(draft.listPercents[option.id], -activeStep))}
                    aria-label={`-${activeStep}%`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:size-7"
                  >
                    <Minus className="size-4 md:size-3" aria-hidden />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.05}
                    disabled={!canEdit}
                    value={draft.listPercents[option.id]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => updatePercent(option.id, e.target.value)}
                    className={`min-w-0 flex-1 rounded border bg-white px-1 py-1 text-center text-sm font-semibold outline-none transition focus:ring-1 md:py-0.5 md:text-xs ${
                      belowThreshold
                        ? 'border-red-300 text-red-700 focus:ring-red-300'
                        : 'border-zinc-200 text-zinc-900 focus:ring-zinc-400'
                    }`}
                    placeholder="0–100"
                  />
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => updatePercent(option.id, applyStep(draft.listPercents[option.id], activeStep))}
                    aria-label={`+${activeStep}%`}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:size-7"
                  >
                    <Plus className="size-4 md:size-3" aria-hidden />
                  </button>
                </div>

                {(() => {
                  const count = computeVoteCount(draft.listPercents[option.id], draft.participationRate)
                  const display = count != null ? count.toLocaleString('hu-HU') : null
                  return display ? (
                    <p className="mt-1.5 text-center text-[10px] text-zinc-500">
                      {t('flow.totalVotesEst', { count: display })}
                    </p>
                  ) : null
                })()}

                <div className="mt-2 border-t border-zinc-100 pt-2">
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-600">
                    {t('flow.pmCandidate')}
                  </p>
                  {pmOption && (() => {
                    const isPmSelected = draft.pmCandidateId === pmOption.id
                    const imgClass = isPmSelected ? '' : 'grayscale opacity-60'
                    const borderClass = isPmSelected
                      ? 'ring-2 ring-zinc-800 border-zinc-800 bg-zinc-50'
                      : belowThreshold
                        ? 'border-zinc-200 bg-zinc-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-400'
                    return (
                      <button
                        type="button"
                        disabled={!canEdit || belowThreshold}
                        onClick={() =>
                          updateDraft((prev) => ({ ...prev, pmCandidateId: pmOption.id }))
                        }
                        className={`w-full rounded-md border p-2 text-center transition ${borderClass} ${belowThreshold ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className="space-y-2">
                          <div className="relative overflow-hidden rounded">
                            <img
                              src={pmOption.portraitSrc}
                              alt={pmOption.candidateName}
                              className={`h-20 w-full object-cover object-top transition-all duration-300 md:h-50 md:aspect-auto ${imgClass}`}
                            />
                            {belowThreshold && (
                              <img
                                src={pmXSvg}
                                alt=""
                                aria-hidden
                                className="pointer-events-none absolute inset-0 h-full w-full object-fill"
                              />
                            )}
                          </div>
                          <p className={`truncate text-xs font-semibold transition-colors duration-300 ${
                            belowThreshold ? 'text-zinc-400' : 'text-zinc-900'
                          }`}>
                            {pmOption.candidateName}
                          </p>
                          <p className={`truncate text-[10px] transition-colors duration-300 ${
                            belowThreshold ? 'text-zinc-400' : 'text-zinc-600'
                          }`}>
                            {pmOption.partyShortName}
                          </p>
                        </div>
                      </button>
                    )
                  })()}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile scroll hint dots */}
      <div className="flex items-center justify-center gap-1.5 border-t border-zinc-100 py-2 md:hidden">
        {PARTY_OPTIONS.map((option) => (
          <span
            key={option.id}
            className={`inline-block size-1.5 rounded-full transition-colors ${
              draft.listPartyId === option.id ? 'bg-zinc-700' : 'bg-zinc-300'
            }`}
          />
        ))}
        <span className="ml-2 text-[10px] text-zinc-400">{t('flow.swipeHint')}</span>
      </div>
    </div>
  )
}
