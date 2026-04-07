import { Trophy } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export type TopThreeItem = {
  displayName: string
  score: number
  shareToken: string
}

export type TopThreePodiumProps = {
  items: TopThreeItem[]
  /** Defaults to leaderboard copy */
  titleKey?: string
  subtitleKey?: string
}

const BADGE_BY_RANK: [string, string, string] = [
  'bg-amber-100 text-amber-700',
  'bg-zinc-200 text-zinc-600',
  'bg-orange-100 text-orange-700',
]

export function TopThreePodium({
  items,
  titleKey = 'leaderboard.topThreeTitle',
  subtitleKey = 'leaderboard.topThreeSubtitle',
}: TopThreePodiumProps) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <div>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Trophy className="size-4 text-zinc-500" />
        {t(titleKey)}
      </h3>
      <p className="mb-3 text-xs leading-relaxed text-zinc-500">
        {t(subtitleKey)}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item, idx) => {
          const badgeClass = BADGE_BY_RANK[idx] ?? 'bg-zinc-100 text-zinc-500'
          return (
            <a
              key={item.shareToken}
              href={`#tipp/${item.shareToken}`}
              className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 transition-colors hover:bg-zinc-100/70"
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{item.displayName}</p>
                <p className="text-[11px] tabular-nums text-zinc-500">{item.score.toFixed(1)} pt</p>
              </div>
              <Trophy className="size-3.5 shrink-0 text-zinc-300" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
