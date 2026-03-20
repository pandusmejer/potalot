/**
 * Danish date format utilities (DD.MM.ÅÅÅÅ)
 */

/** Validate DD.MM.YYYY format and actual date validity */
export function validateDanishDate(input: string): boolean {
  const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (!match) return false

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // Check actual date validity (handles leap years, 30/31 day months)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/** Parse DD.MM.YYYY to ISO date string (YYYY-MM-DD) or null */
export function parseDanishDate(input: string): string | null {
  if (!validateDanishDate(input)) return null
  const [day, month, year] = input.split('.')
  return `${year}-${month}-${day}`
}

/** Format ISO date string or Date to DD.MM.YYYY */
export function formatDanishDate(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}
