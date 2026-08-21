import { Icon } from '@iconify/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMockBookings } from '../context/MockBookingsContext'
import { hoursUntilVisit } from '../lib/dates'
import { BookingInfoCard } from '../components/BookingInfoCard'
import { CancelRescheduleControls } from '../components/CancelRescheduleControls'
import { useBookingModal } from '../context/BookingModalContext'

export function MockBookingDetail() {
  const { mockId } = useParams<{ mockId: string }>()
  const navigate = useNavigate()
  const { openBookingModal } = useBookingModal()
  const { getBooking, cancelBooking } = useMockBookings()
  const booking = mockId ? getBooking(mockId) : undefined

  return (
    <div className="min-h-dvh bg-background pb-16">
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 border-b border-border/40 transform-gpu">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-sm"
          >
            <Icon icon="solar:arrow-left-linear" className="text-xl" />
          </button>
          <h1 className="font-bold text-foreground text-base tracking-tight">Booking Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="px-6 py-8 space-y-8 max-w-xl mx-auto">
        {!booking ? (
          <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 flex flex-col items-center gap-4 text-center">
            <Icon icon="solar:danger-bold" className="text-destructive text-3xl" />
            <p className="text-sm text-foreground font-medium">We couldn't find that booking.</p>
          </div>
        ) : (
          <>
            <BookingInfoCard booking={booking} />
            <CancelRescheduleControls
              canManage={booking.status !== 'cancelled' && hoursUntilVisit(booking.service_date, booking.time_window) > 0}
              previewRefundPercent={
                booking.status === 'open' && hoursUntilVisit(booking.service_date, booking.time_window) < 24 ? 50 : 100
              }
              onConfirm={async (thenReschedule) => {
                cancelBooking(booking.id)
                if (thenReschedule) openBookingModal()
              }}
            />

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
        )}
      </div>
    </div>
  )
}
