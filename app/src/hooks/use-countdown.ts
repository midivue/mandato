import { useEffect, useState } from 'react'
import { CUTOFF_AT } from '@mandatoto/shared/types'

const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

export function useCountdown() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (Date.now() >= CUTOFF_MS) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, CUTOFF_MS - now)
  const d = Math.floor(diff / 86_400_000)
  const h = Math.floor((diff % 86_400_000) / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1000)
  return { d, h, m, s, expired: diff === 0 }
}
