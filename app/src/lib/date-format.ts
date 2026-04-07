const BUDAPEST_TZ = 'Europe/Budapest'

/** SQLite/D1 `datetime('now')` is UTC but has no `Z`; browsers parse it as local time. */
const SQLITE_UTC = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/

function toInstant(input: Date | string | number): Date {
  if (input instanceof Date) return input
  if (typeof input === 'number') return new Date(input)
  const s = input.trim()
  if (SQLITE_UTC.test(s)) {
    return new Date(`${s.replace(' ', 'T')}Z`)
  }
  return new Date(s)
}

/**
 * Formats an absolute instant as YYYY-MM-DD HH:MM:SS in Europe/Budapest
 * (stable across browsers; not tied to the user's local timezone).
 */
export function formatDateTimeBudapest(input: Date | string | number): string {
  const d = toInstant(input)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUDAPEST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const v = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''

  return `${v('year')}-${v('month')}-${v('day')} ${v('hour')}:${v('minute')}:${v('second')}`
}
