import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBookingModal } from '../context/BookingModalContext'
import { useMockBookings } from '../context/MockBookingsContext'
import { CLEAN_TYPE_LABEL, formatDateShort, formatPrice } from '../lib/format'

const STATUS_STYLE: Record<string, string> = {
  open: 'bg-secondary/10 text-secondary',
  cancelled: 'bg-muted text-muted-foreground',
  pending_payment: 'bg-chart-4/10 text-chart-4',
}

export function Bookings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { openBookingModal } = useBookingModal()
  const { bookings } = useMockBookings()

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-8">
        <h1 className="font-heading text-2xl font-extrabold text-foreground mb-8">My Bookings</h1>
        <div className="flex flex-col items-center text-center gap-4 py-16">
          <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
            <Icon icon="solar:calendar-linear" className="text-secondary text-3xl" />
          </div>
          <p className="text-muted-foreground text-sm max-w-xs">Sign in to see your upcoming and past cleanings.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  const sorted = [...bookings].sort((a, b) => a.service_date.localeCompare(b.service_date))

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8">
      <h1 className="font-heading text-2xl font-extrabold text-foreground mb-8">My Bookings</h1>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-4 py-16">
          <Icon icon="solar:calendar-linear" className="text-muted-foreground text-4xl" />
          <p className="text-muted-foreground text-sm max-w-xs">
            No bookings yet — get your instant price to book the first one.
          </p>
          <button
            type="button"
            onClick={openBookingModal}
            className="bg-primary text-white font-bold px-8 py-3.5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Get My Price
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          {sorted.map((booking) => (
            <button
              key={booking.id}
              type="button"
              onClick={() => navigate(`/bookings/${booking.id}`)}
              className="w-full text-left bg-card rounded-[24px] p-6 border border-border shadow-sm active:scale-[0.99] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_STYLE[booking.status]}`}
                >
                  {booking.status === 'open' ? 'Upcoming' : booking.status === 'cancelled' ? 'Cancelled' : 'Processing'}
                </span>
                <span className="font-extrabold text-primary">{formatPrice(booking.quoted_price)}</span>
              </div>
              <h3 className="font-bold text-foreground text-lg">{CLEAN_TYPE_LABEL[booking.clean_type]}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDateShort(booking.service_date)} &bull; {booking.time_window} &bull; {booking.address_line}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
