/** Monday-start ISO week key + display range for grouping payouts. */
export function weekKey(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diffToMonday)
  return date.toISOString().slice(0, 10)
}

export function weekLabel(mondayIso: string): string {
  const [y, m, d] = mondayIso.split('-').map(Number)
  const monday = new Date(y, m - 1, d)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Week of ${fmt(monday)} – ${fmt(sunday)}`
}
