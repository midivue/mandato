import { useState } from 'react'
import { Minus, Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PARTY_OPTIONS, PRIME_MINISTER_OPTIONS } from '@/data/election-options'
import { isBelowThreshold } from '@/hooks/use-prediction'
import type { VotingDraft, PercentFieldId } from '@/hooks/use-prediction'
import { computeVoteCount } from '@/hooks/use-prediction/percent-math'

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

type BallotPartyCompactProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
  updatePercent: (field: PercentFieldId, value: string) => void
}

export function BallotPartyCompact({ draft, canEdit, updateDraft, updatePercent }: BallotPartyCompactProps) {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="space-y-2">
      {/* Shared step selector — one strip for all 5 parties */}
      <div className="grid grid-cols-5 gap-1">
        {STEPS.map(([step, label]) => (
          <button
            key={step}
            type="button"
            onClick={() => setActiveStep(step)}
            className={`h-9 rounded font-mono text-[11px] font-medium transition ${
              activeStep === step
                ? 'bg-zinc-800 text-white'
                : 'border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Five party boxes */}
      {PARTY_OPTIONS.map((option) => {
        const pmOption = PRIME_MINISTER_OPTIONS.find((pm) => pm.id === option.id)
        const belowThreshold = isBelowThreshold(draft.listPercents[option.id])
        const isSelected = draft.listPartyId === option.id
        const isPmSelected = draft.pmCandidateId === option.id

        const voteCount = computeVoteCount(draft.listPercents[option.id], draft.participationRate)
        const voteDisplay = voteCount != null ? voteCount.toLocaleString('hu-HU') : null

        function handleSelectWinner() {
          updateDraft((prev) => ({
            ...prev,
            listPartyId: option.id,
            pmCandidateId: prev.pmCandidateId !== option.id ? option.id : prev.pmCandidateId,
          }))
        }

        return (
          <div
            key={option.id}
            className={`rounded-lg border px-4 py-3 transition-colors ${
              isSelected ? 'border-blue-200 bg-blue-50/40' : 'border-zinc-200 bg-zinc-50/60'
            }`}
          >
            {/* Header: party identity (clicking also sets list winner) */}
            <button
              type="button"
              disabled={!canEdit}
              onClick={handleSelectWinner}
              className="flex w-full items-center justify-center gap-2 disabled:pointer-events-none disabled:opacity-75"
            >
              <img
                src={option.logoSrc}
                alt={option.shortName}
                className="size-6 shrink-0 rounded object-contain"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-900">{option.ballotNumber}. {option.shortName}</p>
                <p className="text-[10px] text-zinc-500">{option.fullName}</p>
              </div>
            </button>

            {/* Stepper */}
            <div className="mt-2 flex items-center gap-1.5">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => updatePercent(option.id, applyStep(draft.listPercents[option.id], -activeStep))}
                aria-label={`-${activeStep}%`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <Minus className="size-4" aria-hidden />
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
                className={`min-w-0 flex-1 rounded border bg-white px-1 py-1 text-center text-sm font-semibold outline-none transition focus:ring-1 ${
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
                className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>

            {voteDisplay && (
              <p className="mt-1.5 text-center text-[10px] text-zinc-500">
                {t('flow.totalVotesEst', { count: voteDisplay })}
              </p>
            )}

            {/* List winner toggle — centered big circle, no label */}
            <div className="mt-2.5 border-t border-zinc-100 pt-3 pb-1 flex justify-center">
              <button
                type="button"
                disabled={!canEdit}
                onClick={handleSelectWinner}
                className="disabled:pointer-events-none disabled:opacity-75"
                aria-label={t('flow.listWinner')}
              >
                <span className={`inline-flex size-9 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-zinc-300 bg-white hover:border-zinc-400'
                }`}>
                  {isSelected && (
                    <X className="size-4 text-[#1616E6]" strokeWidth={2.5} aria-hidden />
                  )}
                </span>
              </button>
            </div>

            {/* PM toggle row — centered, smaller, with green tick on right */}
            {pmOption && (
              <div className="mt-1 border-t border-zinc-100 pt-2">
                <button
                  type="button"
                  disabled={!canEdit || belowThreshold}
                  onClick={() => updateDraft((prev) => ({ ...prev, pmCandidateId: pmOption.id }))}
                  className={`flex w-full items-center justify-center gap-2 text-[11px] transition ${
                    belowThreshold ? 'cursor-not-allowed opacity-40' : 'hover:opacity-80'
                  } disabled:pointer-events-none`}
                >
                  <span className="w-3 shrink-0" aria-hidden />
                  <span className="text-zinc-500">
                    {t('flow.pmCandidate')}:{' '}
                    <span className={isPmSelected ? 'font-semibold text-zinc-900' : 'text-zinc-400'}>
                      {pmOption.candidateName}
                    </span>
                  </span>
                  <span className={`w-3 shrink-0 text-center text-[10px] font-semibold text-emerald-600 transition-opacity ${isPmSelected ? 'opacity-100' : 'opacity-0'}`}>✓</span>
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
