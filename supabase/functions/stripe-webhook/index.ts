import Stripe from 'npm:stripe@17.5.0'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { autoOfferBest } from '../_shared/allocation.ts'
import { sendEmail, siteUrl } from '../_shared/email.ts'
import { bookingConfirmedEmail, type EmailBooking } from '../_shared/emailTemplates.ts'
import { signBookingId } from '../_shared/token.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-12-18.acacia' })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Use POST', { status: 405 })

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const body = await req.text()

  if (!signature || !webhookSecret) {
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    return new Response(`Signature verification failed: ${(err as Error).message}`, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const bookingId = paymentIntent.metadata?.booking_id

    if (bookingId) {
      // Guarded transition: Stripe retries webhooks, so only the delivery
      // that actually moves the booking out of pending_payment runs the
      // side effects below (one auto-offer, one confirmation email).
      const { data: opened } = await supabase
        .from('bookings')
        .update({ status: 'open' })
        .eq('id', bookingId)
        .eq('status', 'pending_payment')
        .select('id, customer_name, customer_email, clean_type, service_date, time_window, address_line, city, zip, quoted_price')
        .maybeSingle()

      if (opened) {
        // Auto-offer the freshly opened gig to the best-matched cleaner.
        // Best-effort: a failure here must never fail the payment webhook —
        // the gig is already in the open feed either way.
        try {
          await autoOfferBest(supabase, bookingId)
        } catch (err) {
          console.error('auto-offer failed for booking', bookingId, err)
        }

        try {
          const token = await signBookingId(bookingId)
          const manageUrl = `${siteUrl()}/booking/${bookingId}?token=${token}`
          const sent = await sendEmail(bookingConfirmedEmail(opened as EmailBooking, manageUrl))
          if (sent) {
            await supabase.from('events').insert({
              booking_id: bookingId,
              actor_type: 'system',
              actor_id: null,
              action: 'confirmation_email_sent',
            })
          }
        } catch (err) {
          console.error('confirmation email failed for booking', bookingId, err)
        }
        // TODO: confirmation SMS once Twilio is wired up.
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    // Booking stays 'pending_payment'. A later scheduled cleanup job can
    // cancel bookings that remain unpaid past their service date.
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
