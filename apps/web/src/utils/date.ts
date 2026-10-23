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

/**
 * Computes exact UTC timestamp (in milliseconds) for a given date (YYYY-MM-DD)
 * and minutes from midnight (0 = 00:00 midnight, 600 = 10:00 AM) in a specified timezone.
 */
export function getTargetTimeMs(dateStr: string, minutesFromMidnight: number, timeZone: string = DEFAULT_TIMEZONE): number {
  try {
    const testDate = new Date(`${dateStr}T12:00:00Z`)
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    })
    const parts = dtf.formatToParts(testDate)
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value
    let offsetMinutes = 0
    if (tzPart) {
      const match = tzPart.match(/GMT([+-])(\d{1,2}):(\d{2})/)
      if (match) {
        const sign = match[1] === '+' ? 1 : -1
        offsetMinutes = sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10))
      }
    }
    const [y, m, d] = dateStr.split('-').map(Number)
    const totalUtcMinutes = minutesFromMidnight - offsetMinutes
    return new Date(Date.UTC(y, m - 1, d, 0, totalUtcMinutes, 0)).getTime()
  } catch {
    return new Date(`${dateStr}T10:00:00Z`).getTime()
  }
}

/**
 * Parses a clock time string like "10:00 AM" or "10:00" into minutes from midnight.
 */
export function parseClockInMinutes(str: string, defaultMinutes: number = 600): number {
  try {
    const cleaned = str.trim().toUpperCase()
    const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/)
    const h24Match = cleaned.match(/^(\d{1,2}):(\d{2})$/)
    let hours = 0
    let minutes = 0
    if (ampmMatch) {
      hours = parseInt(ampmMatch[1], 10)
      minutes = parseInt(ampmMatch[2], 10)
      if (ampmMatch[3] === 'PM' && hours !== 12) hours += 12
      if (ampmMatch[3] === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    } else if (h24Match) {
      hours = parseInt(h24Match[1], 10)
      minutes = parseInt(h24Match[2], 10)
      return hours * 60 + minutes
    }
    return defaultMinutes
  } catch {
    return defaultMinutes
  }
}

