function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** How far ahead a cleaning can be booked. */
export const BOOKING_WINDOW_DAYS = 60

/** Earliest bookable day is tomorrow — no same-day booking, and no Sundays (no service that day). */
export function isBookableDate(date: Date, today = new Date()): boolean {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + BOOKING_WINDOW_DAYS)
  return date > start && date <= end && date.getDay() !== 0
}

/** Earliest selectable date — tomorrow, or the next non-Sunday after that. */
export function firstBookableDate(today = new Date()): string {
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  while (!isBookableDate(cursor, today)) {
    cursor.setDate(cursor.getDate() + 1)
  }
  return toIso(cursor)
}

export interface CalendarDay {
  iso: string
  day: number
  inCurrentMonth: boolean
  isToday: boolean
  bookable: boolean
}

/** A full calendar grid (leading/trailing days from adjacent months included) for the given month. */
export function getMonthGrid(year: number, month: number, today = new Date()): CalendarDay[] {
  const todayIso = toIso(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  const leading = firstOfMonth.getDay()

  const toCell = (date: Date, inCurrentMonth: boolean): CalendarDay => {
    const iso = toIso(date)
    return { iso, day: date.getDate(), inCurrentMonth, isToday: iso === todayIso, bookable: isBookableDate(date, today) }
  }

  const cells: CalendarDay[] = []

  for (let i = leading - 1; i >= 0; i--) {
    cells.push(toCell(new Date(year, month - 1, daysInPrevMonth - i), false))
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toCell(new Date(year, month, day), true))
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]
    const [y, m, d] = last.iso.split('-').map(Number)
    cells.push(toCell(new Date(y, m - 1, d + 1), false))
  }

  return cells
}

export const TIME_WINDOWS = [
  { value: 'Morning', label: 'Morning', range: '8:00 AM - 10:00 AM arrival', icon: 'solar:sun-2-bold', startHour: 8 },
  { value: 'Mid-day', label: 'Mid-day', range: '11:00 AM - 1:00 PM arrival', icon: 'solar:sun-fog-bold', startHour: 11 },
  { value: 'Afternoon', label: 'Afternoon', range: '2:00 PM - 4:00 PM arrival', icon: 'solar:cloudy-moon-bold', startHour: 14 },
] as const

export function timeWindowStartHour(value: string): number {
  return TIME_WINDOWS.find((w) => w.value === value)?.startHour ?? 8
}

/** Hours from now until a booking's visit start. Negative once the visit has passed. */
export function hoursUntilVisit(serviceDate: string, timeWindow: string): number {
  const [y, m, d] = serviceDate.split('-').map(Number)
  const visit = new Date(y, m - 1, d, timeWindowStartHour(timeWindow))
  return (visit.getTime() - Date.now()) / (1000 * 60 * 60)
}
