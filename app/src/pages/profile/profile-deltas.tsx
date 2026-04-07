import { REFERENCE_RESULT, RESULTS_AVAILABLE } from '@mandatoto/shared/types'
import type { PartyId } from '@mandatoto/shared/types'

export function DeltaIndicator({ guess, partyId }: { guess: number | null; partyId: PartyId }) {
  if (!RESULTS_AVAILABLE || guess === null) return null
  const actual = REFERENCE_RESULT.percentages[partyId]
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 1) color = 'text-emerald-600'
  else if (abs <= 3) color = 'text-blue-600'
  else if (abs <= 5) color = 'text-orange-500'
  else color = 'text-red-600'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(1)}
    </span>
  )
}

export function AttendanceDelta({ guess }: { guess: number }) {
  if (!RESULTS_AVAILABLE) return null
  const actual = REFERENCE_RESULT.participationRate
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 1) color = 'text-emerald-600'
  else if (abs <= 3) color = 'text-blue-600'
  else if (abs <= 5) color = 'text-orange-500'
  else color = 'text-red-600'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(1)}
    </span>
  )
}

export function NationalitiesDelta({ guess }: { guess: number }) {
  if (!RESULTS_AVAILABLE) return null
  const actual = REFERENCE_RESULT.pctNationalities
  const diff = guess - actual
  const abs = Math.abs(diff)
  if (diff === 0) return null

  const isUp = diff > 0
  let color: string
  if (abs <= 0.2) color = 'text-emerald-600'
  else if (abs <= 0.5) color = 'text-blue-600'
  else if (abs <= 1) color = 'text-orange-500'
  else color = 'text-red-600'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${color}`}>
      <span className="leading-none">{isUp ? '▲' : '▼'}</span>
      {abs.toFixed(2)}
    </span>
  )
}
