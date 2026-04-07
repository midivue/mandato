import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { T } from '@/components/trans'
import type { VotingDraft } from '@/hooks/use-prediction'
import { computeVoterCount } from '@/hooks/use-prediction/percent-math'

const STEPS: [number, string][] = [
  [0.1,  '.1' ],
  [0.5,  '.5' ],
  [1,    '1'  ],
  [5,    '5'  ],
  [10,   '10' ],
]

function applyStep(current: string, step: number): string {
  const val = parseFloat(current || '0')
  const next = Math.max(0, Math.min(100, Math.round((val + step) * 1000) / 1000))
  return String(next)
}

type ParticipationRowProps = {
  draft: VotingDraft
  canEdit: boolean
  updateDraft: (updater: (prev: VotingDraft) => VotingDraft) => void
}

export function ParticipationRow({ draft, canEdit, updateDraft }: ParticipationRowProps) {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(1)

  const voterCount = computeVoterCount(draft.participationRate)
  const voterDisplay = voterCount != null
    ? voterCount.toLocaleString('hu-HU')
    : null

  function handleChange(value: string) {
    updateDraft((prev) => ({ ...prev, participationRate: value }))
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-900">{t('flow.participationRate')}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500"><T i18nKey="flow.participationRateHint" /></p>

          {/* Step size selector */}
          <div className="mt-2 grid grid-cols-5 gap-1 md:gap-0.5">
            {STEPS.map(([step, label]) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(step)}
                className={`h-7 rounded font-mono text-[11px] font-medium transition md:h-6 md:text-[10px] ${
                  activeStep === step
                    ? 'bg-zinc-800 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-100'
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
              onClick={() => handleChange(applyStep(draft.participationRate, -activeStep))}
              aria-label={`-${activeStep}%`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:size-7"
            >
              <Minus className="size-4 md:size-3" aria-hidden />
            </button>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              disabled={!canEdit}
              value={draft.participationRate}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleChange(e.target.value)}
              className="min-w-0 flex-1 rounded border border-zinc-200 bg-white px-1 py-1 text-center text-sm font-semibold outline-none transition focus:ring-1 focus:ring-zinc-400 md:py-0.5 md:text-xs"
              placeholder="0–100"
            />
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => handleChange(applyStep(draft.participationRate, activeStep))}
              aria-label={`+${activeStep}%`}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white text-zinc-600 transition hover:border-zinc-600 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-40 md:size-7"
            >
              <Plus className="size-4 md:size-3" aria-hidden />
            </button>
          </div>

          {voterDisplay && (
            <p className="mt-1.5 text-center text-[10px] text-zinc-500">
              {t('flow.totalVoters', { count: voterDisplay })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
