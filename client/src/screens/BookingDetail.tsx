import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cancelBooking, getBooking } from '../lib/api'
import { hoursUntilVisit } from '../lib/dates'
import { BookingInfoCard } from '../components/BookingInfoCard'
import { CancelRescheduleControls } from '../components/CancelRescheduleControls'
import { useBookingModal } from '../context/BookingModalContext'
import type { BookingRecord } from '../types'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; booking: BookingRecord }

export function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [load, setLoad] = useState<LoadState>({ status: 'loading' })

  async function fetchBooking() {
    if (!bookingId || !token) {
      setLoad({ status: 'error', message: 'This link is missing its access token.' })
      return
    }
    setLoad({ status: 'loading' })
    try {
      const booking = await getBooking(bookingId, token)
      setLoad({ status: 'ready', booking })
    } catch (err) {
      setLoad({ status: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' })
    }
  }

  useEffect(() => {
    fetchBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, token])

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border/40 transform-gpu">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm"
          >
            <Icon icon="solar:arrow-left-linear" className="text-xl" />
          </button>
          <h1 className="font-bold text-foreground text-base tracking-tight">Booking Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-xl mx-auto">
        {load.status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Loading your booking&hellip;</p>
          </div>
        )}

        {load.status === 'error' && (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 flex flex-col items-center gap-4 text-center">
            <Icon icon="solar:danger-bold" className="text-destructive text-3xl" />
            <p className="text-sm text-foreground font-medium">{load.message}</p>
            <button
              type="button"
              onClick={fetchBooking}
              className="bg-card border border-border font-bold text-foreground px-6 py-3 rounded-full shadow-sm active:scale-[0.98] transition-all"
            >
              Try again
            </button>
          </div>
        )}

        {load.status === 'ready' && bookingId && token && (
          <BookingActions booking={load.booking} bookingId={bookingId} token={token} onCancelled={fetchBooking} />
        )}
      </div>
    </div>
  )
}

function BookingActions({
  booking,
  bookingId,
  token,
  onCancelled,
}: {
  booking: BookingRecord
  bookingId: string
  token: string
  onCancelled: () => void
}) {
  const { openBookingModal } = useBookingModal()
  const hoursUntil = hoursUntilVisit(booking.service_date, booking.time_window)
  const canManage = booking.status !== 'cancelled' && hoursUntil > 0
  const previewRefundPercent = booking.status === 'open' && hoursUntil < 24 ? 50 : 100

  async function handleConfirm(thenReschedule: boolean) {
    await cancelBooking(bookingId, token)
    onCancelled()
    if (thenReschedule) openBookingModal()
  }

  return (
    <>
      <BookingInfoCard booking={booking} />
      <CancelRescheduleControls canManage={canManage} previewRefundPercent={previewRefundPercent} onConfirm={handleConfirm} />

      <div className="pt-4 pb-4">
        <a
          href="mailto:support@munciemaids.com"
          className="w-full flex items-center justify-center gap-3 bg-card border border-border font-bold text-foreground py-5 rounded-full shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
        >
          <Icon icon="solar:chat-round-dots-bold" className="text-secondary text-2xl" />
          Message Support
        </a>
      </div>
    </>
  )
}
