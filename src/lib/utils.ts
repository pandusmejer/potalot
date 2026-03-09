import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'forår'
  if (month >= 6 && month <= 8) return 'sommer'
  if (month >= 9 && month <= 11) return 'efterår'
  return 'vinter'
}

export function getSeasonYear(): number {
  return new Date().getFullYear()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString())
}
