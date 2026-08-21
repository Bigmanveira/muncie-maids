import { Icon } from '@iconify/react'
import { useFunnel } from '../context/FunnelContext'
import { CLEAN_TYPE_LABEL, formatDateShort, formatPrice, FREQUENCY_LABEL } from '../lib/format'

interface SummaryBarProps {
  /** Override the committed schedule with an in-progress selection (e.g. while still on /schedule). */
  scheduleOverride?: { serviceDate: string; timeWindow: string } | null
}

/** Persistent service + price summary shown above the CTA on Schedule, Details, and Pay. */
export function SummaryBar({ scheduleOverride }: SummaryBarProps = {}) {
  const { state } = useFunnel()
  if (!state.quote || state.quotedPrice == null) return null

  const schedule = scheduleOverride ?? state.schedule

  return (
    <div className="flex items-center justify-between mb-5 px-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Icon icon="solar:home-2-bold" className="text-primary text-xl" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{CLEAN_TYPE_LABEL[state.quote.cleanType]}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            {FREQUENCY_LABEL[state.quote.frequency]} &bull; {formatPrice(state.quotedPrice)}
          </p>
        </div>
      </div>
      {schedule && (
        <div className="text-right">
          <p className="text-sm font-extrabold text-primary">{formatDateShort(schedule.serviceDate)}</p>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{schedule.timeWindow}</p>
        </div>
      )}
    </div>
  )
}
