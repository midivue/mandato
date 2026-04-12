import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RankBadge } from '@/components/rank-badge'
import type { LeaderboardEntry } from '@mandatoto/shared/types'

type CategoryTableProps = {
  entries: LeaderboardEntry[]
  getValue: (entry: LeaderboardEntry) => number | null
  referenceValue: number
  /** Optional name filter — entries are filtered for display but ranks come from the full sorted list. */
  nameFilter?: string
  unit?: string
}

export function CategoryTable({ entries, getValue, referenceValue, nameFilter, unit = 'pp' }: CategoryTableProps) {
  const { t } = useTranslation()

  const ranked = useMemo(() => {
    return entries
      .filter((e) => getValue(e) != null)
      .map((e) => ({
        entry: e,
        predicted: getValue(e) as number,
        error: Math.abs((getValue(e) as number) - referenceValue),
      }))
      .sort((a, b) => a.error - b.error)
      .map((row, idx) => ({ ...row, rank: idx + 1 }))
  }, [entries, getValue, referenceValue])

  const displayed = useMemo(() => {
    if (!nameFilter || nameFilter.length < 2) return ranked
    const q = nameFilter.toLowerCase()
    return ranked.filter((r) => r.entry.displayName.toLowerCase().includes(q))
  }, [ranked, nameFilter])

  const isFilterActive = !!nameFilter && nameFilter.length >= 2

  if (ranked.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-400">
        {t('leaderboard.categoryEmpty')}
      </p>
    )
  }

  if (isFilterActive && displayed.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">
        {t('leaderboard.noSearchResults')}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            <th className="px-3 py-2.5 text-right w-10">{t('leaderboard.rank')}</th>
            <th className="px-3 py-2.5">{t('leaderboard.name')}</th>
            <th className="px-3 py-2.5 text-right">{t('leaderboard.categoryPredicted')}</th>
            <th className="px-3 py-2.5 text-right">{t('leaderboard.categoryActual')}</th>
            <th className="px-3 py-2.5 text-right">{t('leaderboard.categoryError')}</th>
          </tr>
        </thead>
        <tbody>
          {displayed.map(({ entry, predicted, error, rank }) => (
            <tr
              key={entry.shareToken}
              className={`border-b border-zinc-100 transition-colors ${rank <= 3 ? 'bg-zinc-50/60' : ''}`}
            >
              <td className="px-3 py-2.5 text-right tabular-nums font-medium text-zinc-500">
                {rank <= 3 ? <RankBadge rank={rank} /> : rank}
              </td>
              <td className="px-3 py-2.5 font-medium text-zinc-900">
                <a
                  href={`#tipp/${entry.shareToken}`}
                  className="underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-900 transition-colors"
                >
                  {entry.displayName}
                </a>
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-zinc-800">
                {predicted.toFixed(2)}%
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-zinc-500">
                {referenceValue.toFixed(2)}%
              </td>
              <td className={`px-3 py-2.5 text-right tabular-nums font-semibold ${
                error === 0 ? 'text-emerald-600'
                : error < 1 ? 'text-emerald-500'
                : error < 3 ? 'text-amber-600'
                : 'text-red-500'
              }`}>
                ±{error.toFixed(2)}{unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
