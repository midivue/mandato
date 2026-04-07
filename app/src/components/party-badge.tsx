import { PARTY_SHORT } from '@/data/election-options'

type PartyBadgeProps = {
  partyId: string
  size?: 'sm' | 'md'
}

export function PartyBadge({ partyId, size = 'md' }: PartyBadgeProps) {
  const label = PARTY_SHORT[partyId] ?? partyId

  const sizeClasses =
    size === 'sm'
      ? 'px-1.5 py-0.5 text-[10px]'
      : 'px-2 py-0.5 text-[11px]'

  return (
    <span className={`inline-block rounded-full border border-zinc-200 bg-zinc-50 ${sizeClasses} font-medium text-zinc-700`}>
      {label}
    </span>
  )
}
