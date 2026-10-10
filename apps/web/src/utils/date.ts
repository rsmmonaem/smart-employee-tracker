/**
 * Timezone-aware date helpers for Bangladesh (Asia/Dhaka) & client local time.
 */

export const DEFAULT_TIMEZONE = 'Asia/Dhaka'

/**
 * Returns YYYY-MM-DD for a given Date in client local time.
 */
export function getLocalTodayString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Returns YYYY-MM-DD for yesterday in client local time.
 */
export function getLocalYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return getLocalTodayString(d)
}

/**
 * Returns YYYY-MM-DD formatted strictly in a specific IANA timezone (default: Asia/Dhaka).
 */
export function getTodayInTimezone(timeZone: string = DEFAULT_TIMEZONE): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  } catch {
    return getLocalTodayString()
  }
}

/**
 * Converts any ISO date string or Date to YYYY-MM-DD in a specific timezone.
 */
export function formatLocalDateString(isoStr?: string | null | Date, timeZone: string = DEFAULT_TIMEZONE): string {
  if (!isoStr) return ''
  try {
    const d = typeof isoStr === 'string' ? new Date(isoStr) : isoStr
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  } catch {
    return typeof isoStr === 'string' ? isoStr.slice(0, 10) : ''
  }
}
