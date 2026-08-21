import type { CleanType, Frequency } from '../types'

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`
}

export const CLEAN_TYPE_LABEL: Record<CleanType, string> = {
  standard: 'Standard Clean',
  deep: 'First Time Clean',
  moveout: 'Move-out Clean',
}

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  one_time: 'One-time',
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
}

export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}
