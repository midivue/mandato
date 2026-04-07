import { CUTOFF_AT } from '@mandatoto/shared/types'

export const CUTOFF_MS = new Date(CUTOFF_AT).getTime()

export function isBeforeCutoff(): boolean {
  return Date.now() < CUTOFF_MS
}
