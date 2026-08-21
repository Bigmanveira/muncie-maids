import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { StepHeader } from '../components/StepHeader'
import { useFunnel } from '../context/FunnelContext'
import { useMockBookings } from '../context/MockBookingsContext'
import { useDetectedLocation } from '../lib/useDetectedLocation'
import { stripePromise, isStripeConfigured } from '../lib/stripe'
import { isSupabaseConfigured } from '../lib/supabase'
import { createBooking, CreateBookingError } from '../lib/api'
import { uploadBookingPhoto } from '../lib/photos'
import { takePendingPhotos } from '../lib/pendingPhotos'
import { CLEAN_TYPE_LABEL, formatPrice, FREQUENCY_LABEL } from '../lib/format'
import { BATHROOM_COUNT, BEDROOM_COUNT } from '../lib/pricing'
import type { Bathrooms, Bedrooms, DetailsInputs, QuoteInputs, ScheduleInputs, BookingRecord } from '../types'

const BEDROOM_LABEL: Record<Bedrooms, string> = { studio: 'Studio', '1': '1 Bed', '2': '2 Bed', '3': '3 Bed', '4+': '4+ Bed' }
const BATHROOM_LABEL: Record<Bathrooms, string> = { '1': '1 Bath', '1.5': '1.5 Bath', '2': '2 Bath', '2.5+': '2.5+ Bath' }

type LoadState =
  | { status: 'creating' }
  | { status: 'error'; message: string }
  | { status: 'ready'; clientSecret: string; bookingId: string; bookingToken: string }
  | { status: 'demo' }

export function Pay() {
  const navigate = useNavigate()
  const { state } = useFunnel()
  const [load, setLoad] = useState<LoadState>({ status: 'creating' })

  async function requestBooking() {
    if (!state.quote || !state.schedule || !state.details) return

    // Payments aren't wired up yet — let testers complete the flow without a real charge.
    // This path disappears automatically once both Supabase and Stripe env vars are set.
    if (!isSupabaseConfigured || !isStripeConfigured) {
      setLoad({ status: 'demo' })
      return
    }

    setLoad({ status: 'creating' })
    try {
      const { clientSecret, bookingId, bookingToken } = await createBooking({
        quote: state.quote,
        schedule: state.schedule,
        details: state.details,
      })
      const staged = takePendingPhotos()
      if (staged.length) {
        void Promise.allSettled(staged.map((file) => uploadBookingPhoto(bookingId, bookingToken, file)))
      }
      setLoad({ status: 'ready', clientSecret, bookingId, bookingToken })
    } catch (err) {
      if (err instanceof CreateBookingError && err.code === 'WINDOW_TAKEN') {
        navigate('/schedule', { state: { message: "That window just filled — pick another." } })
        return
      }
      if (err instanceof CreateBookingError && err.code === 'OUT_OF_AREA') {
        navigate('/details', { state: { message: 'That address is outside our service area.' } })
        return
      }
      setLoad({ status: 'error', message: "Couldn't start checkout. Check your connection and try again." })
    }
  }

  useEffect(() => {
    requestBooking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state.quote || !state.schedule || !state.details) return null

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <StepHeader step={5} />

      <div className="px-6 flex-1 space-y-8 pb-56 max-w-md mx-auto w-full">
        <section className="bg-card rounded-[32px] p-8 shadow-sm border border-border">
          <h3 className="font-bold text-foreground text-lg mb-6">Booking Summary</h3>
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-foreground">{CLEAN_TYPE_LABEL[state.quote.cleanType]}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  {BEDROOM_LABEL[state.quote.bedrooms]} &bull; {BATHROOM_LABEL[state.quote.bathrooms]} &bull;{' '}
                  {FREQUENCY_LABEL[state.quote.frequency]}
                </p>
              </div>
              <p className="font-extrabold text-primary text-lg">{formatPrice(state.quotedPrice ?? 0)}</p>
            </div>
            <div className="h-px bg-border/60 w-full" />
            <div className="flex justify-between items-center pt-2">
              <p className="text-xl font-extrabold text-foreground">Total Cost</p>
              <p className="text-3xl font-extrabold text-primary">{formatPrice(state.quotedPrice ?? 0)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-bold text-foreground text-lg mb-4 ml-1">Card Details</h3>

          {load.status === 'creating' && (
            <div className="bg-card border border-border rounded-[24px] p-8 shadow-sm flex flex-col items-center gap-3">
              <div className="h-6 w-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground font-medium">Preparing secure checkout&hellip;</p>
            </div>
          )}

          {load.status === 'error' && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-[24px] p-6 space-y-4">
              <p className="text-sm text-foreground font-medium">{load.message}</p>
              <button
                type="button"
                onClick={requestBooking}
                className="w-full bg-card border border-border font-bold text-foreground py-3 rounded-full shadow-sm active:scale-[0.98] transition-all"
              >
                Try again
              </button>
            </div>
          )}

          {load.status === 'demo' && (
            <DemoCheckout quote={state.quote} schedule={state.schedule} details={state.details} price={state.quotedPrice ?? 0} />
          )}

          {load.status === 'ready' && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: load.clientSecret,
                appearance: {
                  variables: {
                    colorPrimary: '#D65A5A',
                    colorBackground: '#FFFFFF',
                    colorText: '#1A1C1E',
                    borderRadius: '16px',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  },
                },
              }}
            >
              <CheckoutForm bookingId={load.bookingId} bookingToken={load.bookingToken} price={state.quotedPrice ?? 0} />
            </Elements>
          )}
        </section>
      </div>
    </div>
  )
}

function DemoCheckout({
  quote,
  schedule,
  details,
  price,
}: {
  quote: QuoteInputs
  schedule: ScheduleInputs
  details: DetailsInputs
  price: number
}) {
  const navigate = useNavigate()
  const { addBooking } = useMockBookings()
  const location = useDetectedLocation()
  const [submitting, setSubmitting] = useState(false)

  function handleConfirm() {
    setSubmitting(true)
    // Brief delay so it still feels like something happened, matching the real checkout's pacing.
    setTimeout(() => {
      const bookingId = `demo-${crypto.randomUUID()}`
      const booking: BookingRecord = {
        id: bookingId,
        status: 'open',
        bedrooms: BEDROOM_COUNT[quote.bedrooms],
        bathrooms: BATHROOM_COUNT[quote.bathrooms],
        sqft_band: quote.sqftBand,
        clean_type: quote.cleanType,
        frequency: quote.frequency,
        quoted_price: price,
        service_date: schedule.serviceDate,
        time_window: schedule.timeWindow,
        customer_name: details.customerName,
        address_line: details.addressLine,
        city: details.city,
        zip: details.zip,
        entry_notes: details.entryNotes || null,
        has_pets: details.hasPets,
        cancelled_at: null,
        refund_amount: null,
      }
      addBooking(booking)
      navigate(`/confirmed/${bookingId}`, { state: { isMock: true } })
    }, 900)
  }

  return (
    <div>
      <div className="rounded-2xl bg-chart-4/10 border border-chart-4/20 p-4 flex items-start gap-3">
        <Icon icon="solar:info-circle-bold" className="text-chart-4 text-xl shrink-0 mt-0.5" />
        <p className="text-xs text-foreground leading-relaxed">
          <span className="font-bold">Demo mode.</span> No backend is connected yet, so confirming here simulates a
          successful booking — no card is charged.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mb-6 disabled:opacity-50"
          >
            {submitting ? 'Confirming…' : `Confirm Booking — ${formatPrice(price)}`}
          </button>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-border" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{location.town} Trusted</p>
            <span className="h-px w-8 bg-border" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutForm({ bookingId, bookingToken, price }: { bookingId: string; bookingToken: string; price: number }) {
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()
  const location = useDetectedLocation()
  const [submitting, setSubmitting] = useState(false)
  const [declineMessage, setDeclineMessage] = useState<string | null>(null)

  async function handleConfirm() {
    if (!stripe || !elements) return
    setSubmitting(true)
    setDeclineMessage(null)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/confirmed/${bookingId}` },
      redirect: 'if_required',
    })

    if (error) {
      setDeclineMessage(error.message ?? 'Your card was declined. Please try a different payment method.')
      setSubmitting(false)
      return
    }

    navigate(`/confirmed/${bookingId}`, { state: { bookingToken } })
  }

  return (
    <div>
      <div className="bg-card border border-border rounded-[24px] overflow-hidden shadow-sm p-5">
        <PaymentElement />
      </div>

      {declineMessage && (
        <div className="mt-4 rounded-2xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <Icon icon="solar:danger-bold" className="text-destructive text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-foreground font-medium">{declineMessage}</p>
        </div>
      )}

      <div className="flex items-start gap-4 px-2 py-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
          <Icon icon="solar:lock-bold" className="text-secondary text-lg" />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          We won't charge your card until the day of your service. Stripe handles payments securely.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/90 backdrop-blur-xl border-t border-border z-20 transform-gpu">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!stripe || submitting}
            className="w-full bg-primary text-white font-bold py-5 rounded-full shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mb-6 disabled:opacity-50"
          >
            {submitting ? 'Confirming…' : `Confirm Booking — ${formatPrice(price)}`}
          </button>
          <div className="flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-border" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{location.town} Trusted</p>
            <span className="h-px w-8 bg-border" />
          </div>
        </div>
      </div>
    </div>
  )
}
