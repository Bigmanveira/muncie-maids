import { Icon } from '@iconify/react'
import { CLEAN_TYPE_LABEL, formatDateLong, formatPrice, FREQUENCY_LABEL } from '../lib/format'
import type { BookingRecord } from '../types'

export function BookingInfoCard({ booking }: { booking: BookingRecord }) {
  const statusLabel = booking.status === 'open' ? 'Upcoming Service' : booking.status === 'cancelled' ? 'Cancelled' : 'Processing Payment'

  return (
    <>
      <div className="bg-card rounded-[32px] p-8 shadow-sm border border-border overflow-hidden relative">
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="space-y-4">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
              {statusLabel}
            </span>
            <div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {CLEAN_TYPE_LABEL[booking.clean_type]}
              </h2>
              <p className="text-muted-foreground font-bold mt-1">{formatDateLong(booking.service_date)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-primary">{formatPrice(booking.quoted_price)}</p>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
              {FREQUENCY_LABEL[booking.frequency]}
            </p>
          </div>
        </div>
        <div className="space-y-5 pt-6 border-t border-border relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Icon icon="solar:clock-circle-bold" className="text-secondary text-xl" />
            </div>
            <span className="text-sm font-bold text-foreground">{booking.time_window} arrival</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Icon icon="solar:map-point-bold" className="text-secondary text-xl" />
            </div>
            <span className="text-sm font-bold text-foreground truncate">
              {booking.address_line}, {booking.city}
            </span>
          </div>
        </div>
      </div>

      {booking.status === 'cancelled' && (
        <section className="rounded-2xl bg-muted/40 border border-border/60 p-6">
          <p className="text-sm text-foreground font-medium">
            We cancelled this booking{booking.cancelled_at ? ` on ${formatDateLong(booking.cancelled_at.slice(0, 10))}` : ''}.
            {booking.refund_amount != null && ` We refunded ${formatPrice(booking.refund_amount)}.`}
          </p>
        </section>
      )}

      {booking.status === 'open' && (
        <section className="bg-card rounded-[28px] p-6 shadow-sm border border-dashed border-border bg-muted/20">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-2 border-border shadow-inner relative">
              <Icon icon="solar:user-bold-duotone" className="text-muted-foreground text-3xl" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Assigning Your Cleaning Team</h3>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Finding the best match for your home&hellip;</p>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-5">
        <h3 className="font-bold text-foreground text-lg ml-1">Service Notes</h3>
        <div className="bg-card rounded-[28px] p-8 shadow-sm border border-border space-y-8">
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-3">
              Entry Instructions
            </p>
            <p className="text-sm text-foreground leading-relaxed font-medium">
              {booking.entry_notes || 'No entry instructions provided.'}
            </p>
          </div>
          <div className="h-px bg-border/50 w-full" />
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-3">Pets</p>
            <div className="flex items-center gap-3">
              <Icon icon="ph:dog-bold" className="text-primary text-xl" />
              <p className="text-sm text-foreground font-medium">{booking.has_pets ? 'Yes, pets at home.' : 'No pets.'}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
