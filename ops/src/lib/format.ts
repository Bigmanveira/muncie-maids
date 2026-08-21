export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatDateTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const CLEAN_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard Clean',
  deep: 'First Time Clean',
  moveout: 'Move-out Clean',
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Pending Payment',
  open: 'Open',
  claimed: 'Claimed',
  needs_ops: 'Needs Ops',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'bg-chart-4/10 text-chart-4',
  open: 'bg-chart-2/10 text-chart-2',
  claimed: 'bg-chart-3/10 text-chart-3',
  needs_ops: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive',
}
