import { useTranslation } from 'react-i18next'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { LeaderboardEntry } from '@mandatoto/shared/types'
import { computeScoreBreakdown } from './leaderboard-utils'

export function ScoreTooltip({ entry }: { entry: LeaderboardEntry }) {
  const { t } = useTranslation()
  if (!RESULTS_AVAILABLE || entry.score == null) return null
  const b = computeScoreBreakdown(entry)
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg opacity-0 transition-opacity group-hover/score:opacity-100">
      <div className="space-y-0.5 whitespace-nowrap text-[11px]">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">{t('leaderboard.tooltipPct')}</span>
          <span className="font-semibold tabular-nums text-zinc-800">+{b.pctPts.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">{t('leaderboard.tooltipNationalities')}</span>
          <span className="font-semibold tabular-nums text-zinc-800">+{b.natPts.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">{t('leaderboard.tooltipListWinner')}</span>
          <span className="font-semibold tabular-nums text-zinc-800">
            {b.listPts > 0 ? '✓' : '✗'} {b.listPts > 0 ? '+' : ''}{b.listPts}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">{t('leaderboard.tooltipPm')}</span>
          <span className="font-semibold tabular-nums text-zinc-800">
            {b.pmPts > 0 ? '✓' : '✗'} {b.pmPts > 0 ? '+' : ''}{b.pmPts}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-500">{t('leaderboard.tooltipAttendance')}</span>
          <span className="font-semibold tabular-nums text-zinc-800">+{b.attPts.toFixed(1)}</span>
        </div>
        <div className="mt-1 flex justify-between gap-4 border-t border-zinc-100 pt-1">
          <span className="font-semibold text-zinc-700">{t('leaderboard.tooltipTotal')}</span>
          <span className="font-bold tabular-nums text-zinc-900">{b.total.toFixed(1)}</span>
        </div>
      </div>
    </div>
  )
}
