import { Icon } from '@iconify/react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useFunnel } from '../context/FunnelContext'
import { formatDateLong } from '../lib/format'
import { buildIcsContent, downloadIcs } from '../lib/ics'
import { timeWindowStartHour } from '../lib/dates'

export function Confirmed() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { state, reset } = useFunnel()

  const locationState = location.state as { bookingToken?: string; isMock?: boolean } | null
  const bookingToken = locationState?.bookingToken
  const isMock = locationState?.isMock ?? false
  const bookingDetailPath = isMock ? `/bookings/${bookingId}` : bookingToken ? `/booking/${bookingId}?token=${bookingToken}` : null

  const hasDetails = state.quote && state.schedule && state.details

  function handleAddToCalendar() {
    if (!state.schedule || !state.details || !bookingId) return
    const [y, m, d] = state.schedule.serviceDate.split('-').map(Number)
    const start = new Date(y, m - 1, d, timeWindowStartHour(state.schedule.timeWindow))
    const ics = buildIcsContent({
      uid: bookingId,
      title: 'Muncie Maids cleaning',
      description: `Your cleaning is confirmed. Entry notes: ${state.details.entryNotes || 'none'}`,
      location: `${state.details.addressLine}, ${state.details.city}, IN ${state.details.zip}`,
      start,
      durationHours: 2,
    })
    downloadIcs('muncie-maids-cleaning.ics', ics)
  }

  function handleBackToHome() {
    reset()
    navigate('/home')
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-36 h-36 rounded-full bg-secondary/5 flex items-center justify-center mb-10 relative">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border border-border">
          <Icon icon="solar:check-circle-bold" className="text-chart-3 text-7xl" />
        </div>
      </div>

      <h1 className="font-heading text-4xl font-extrabold text-foreground text-center mb-4 tracking-tight">
        Booking Confirmed!
      </h1>

      {hasDetails && state.schedule ? (
        <p className="text-muted-foreground text-center mb-12 max-w-[280px] text-lg font-medium leading-relaxed">
          We've confirmed your cleaning for{' '}
          <span className="text-secondary font-bold">{formatDateLong(state.schedule.serviceDate)}</span>.
        </p>
      ) : (
        <p className="text-muted-foreground text-center mb-12 max-w-[280px] text-lg font-medium leading-relaxed">
          We've confirmed your cleaning. Check your email for details.
        </p>
      )}

      {hasDetails && state.schedule && state.details && (
        <div className="w-full max-w-md bg-card rounded-[32px] p-8 shadow-sm border border-border mb-10 space-y-8">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-secondary/5 flex items-center justify-center">
              <Icon icon="solar:calendar-bold" className="text-secondary text-3xl" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Arrival Window
              </p>
              <p className="font-extrabold text-foreground text-lg">{state.schedule.timeWindow}</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-secondary/5 flex items-center justify-center">
              <Icon icon="solar:map-point-bold" className="text-secondary text-3xl" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">
                Service Address
              </p>
              <p className="font-extrabold text-foreground text-lg">{state.details.addressLine}</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mb-12">
        <h3 className="font-bold text-foreground mb-4 text-center text-lg">What's next?</h3>
        <div className="bg-muted/40 rounded-2xl p-5 border border-border/60">
          <p className="text-sm text-muted-foreground text-center leading-relaxed font-medium">
            We're assigning your local professional now. You'll receive a text with their details shortly!
          </p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-5">
        {hasDetails && (
          <button
            type="button"
            onClick={handleAddToCalendar}
            className="w-full flex items-center justify-center gap-2 font-bold text-secondary text-base active:scale-95 transition-transform"
          >
            <Icon icon="solar:calendar-add-bold" className="text-2xl" />
            Add to Calendar
          </button>
        )}
        {bookingDetailPath && (
          <button
            type="button"
            onClick={() => navigate(bookingDetailPath)}
            className="w-full flex items-center justify-center gap-2 font-bold text-secondary text-base active:scale-95 transition-transform"
          >
            <Icon icon="solar:document-text-bold" className="text-2xl" />
            View, Cancel, or Reschedule
          </button>
        )}
        <button
          type="button"
          onClick={handleBackToHome}
          className="w-full bg-secondary text-white font-bold py-5 rounded-full shadow-lg shadow-secondary/20 active:scale-[0.98] transition-all"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
