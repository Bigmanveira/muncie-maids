import { useState } from 'react'
import { Icon } from '@iconify/react'
import { BOOKING_WINDOW_DAYS, getMonthGrid } from '../lib/dates'

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

interface DateCalendarProps {
  selectedDate: string
  onSelect: (iso: string) => void
}

export function DateCalendar({ selectedDate, onSelect }: DateCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number)
    return new Date(y, m - 1, 1)
  })

  const today = new Date()
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + BOOKING_WINDOW_DAYS)
  const maxMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)

  const canGoPrev = viewDate.getTime() > minMonth.getTime()
  const canGoNext = viewDate.getTime() < maxMonth.getTime()

  const grid = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth(), today)

  function changeMonth(delta: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="bg-card rounded-[24px] border border-border shadow-sm p-5">
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={!canGoPrev}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Icon icon="solar:alt-arrow-left-linear" className="text-foreground" />
        </button>
        <span className="font-bold text-foreground text-sm">{MONTH_FORMAT.format(viewDate)}</span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          disabled={!canGoNext}
          aria-label="Next month"
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Icon icon="solar:alt-arrow-right-linear" className="text-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-muted-foreground uppercase">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {grid.map((cell) => {
          const selected = cell.iso === selectedDate

          let cellClass = 'text-muted-foreground/25 cursor-not-allowed'
          if (cell.bookable) {
            cellClass = selected
              ? 'bg-primary text-white shadow-md font-bold'
              : 'text-foreground font-semibold hover:bg-muted active:scale-95'
          } else if (cell.inCurrentMonth) {
            cellClass = 'text-muted-foreground/40 cursor-not-allowed'
          }

          return (
            <button
              key={cell.iso}
              type="button"
              disabled={!cell.bookable}
              onClick={() => onSelect(cell.iso)}
              className={`relative mx-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-sm transition-all ${cellClass}`}
            >
              {cell.day}
              {cell.isToday && !selected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
