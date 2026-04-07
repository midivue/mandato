import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { BestGroupEntry } from '@mandatoto/shared/types'

export function BestGroupsSection({ bestGroups }: { bestGroups: BestGroupEntry[] }) {
  const { t } = useTranslation()

  if (bestGroups.length === 0) return null

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Users className="size-4 text-zinc-500" />
        {t(RESULTS_AVAILABLE ? 'leaderboard.bestGroups' : 'leaderboard.bestGroupsPreResult')}
      </h3>
      <p className="mt-1 mb-3 text-xs leading-relaxed text-zinc-500">
        {t(RESULTS_AVAILABLE ? 'leaderboard.bestGroupsSubtitle' : 'leaderboard.bestGroupsSubtitlePreResult')}
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(RESULTS_AVAILABLE ? bestGroups : bestGroups.slice(0, 6)).map((group, idx) => (
          <a
            key={group.groupToken}
            href={`#csoport/${group.groupToken}`}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <span
              className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                RESULTS_AVAILABLE
                  ? idx === 0
                    ? 'bg-amber-100 text-amber-700'
                    : idx === 1
                      ? 'bg-zinc-200 text-zinc-600'
                      : idx === 2
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-zinc-100 text-zinc-500'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {RESULTS_AVAILABLE ? idx + 1 : '—'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">
                {group.name}
              </p>
              <p className="text-[11px] text-zinc-500">
                {t('leaderboard.bestGroupsMembers', {
                  count: group.memberCount,
                })}
                {group.avgScore != null && (
                  <>
                    {' '}&middot;{' '}
                    {t('leaderboard.bestGroupsAvgScore')}:{' '}
                    <span className="font-semibold tabular-nums">
                      {group.avgScore.toFixed(1)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
