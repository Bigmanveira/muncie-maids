// Payouts are 70% of a quoted price, so unlike the client app's rounder
// numbers these regularly land on cents — always show two decimal places.
export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const CLEAN_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard Clean',
  deep: 'First Time Clean',
  moveout: 'Move-out Clean',
}

// Left-edge accent per clean type, so a scrolling feed reads at a glance.
export const CLEAN_TYPE_ACCENT: Record<string, string> = {
  standard: 'border-l-chart-1',
  deep: 'border-l-chart-4',
  moveout: 'border-l-chart-2',
}

const SQFT_LABEL: Record<string, string> = {
  under_1000: 'Under 1,000 sqft',
  '1000_1800': '1,000–1,800 sqft',
  '1800_2600': '1,800–2,600 sqft',
  '2600_plus': '2,600+ sqft',
}

// bookings.bedrooms/bathrooms are stored as the numeric counts the client's
// quote form maps its labels to (studio -> 0, "4+" -> 4, "2.5+" -> 2.5).
export function formatBedrooms(count: number): string {
  return count === 0 ? 'Studio' : `${count} Bed${count === 4 ? '+' : ''}`
}

export function formatBathrooms(count: number): string {
  return `${count}${count === 2.5 ? '+' : ''} Bath`
}

export function formatSqftBand(band: string): string {
  return SQFT_LABEL[band] ?? band
}
