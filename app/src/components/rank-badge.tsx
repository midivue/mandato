type RankBadgeProps = {
  rank: number
}

export function RankBadge({ rank }: RankBadgeProps) {
  const colorClass =
    rank === 1
      ? 'bg-amber-100 text-amber-700'
      : rank === 2
        ? 'bg-zinc-200 text-zinc-600'
        : 'bg-orange-100 text-orange-700'

  return (
    <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-bold ${colorClass}`}>
      {rank}
    </span>
  )
}
