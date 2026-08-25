import Stripe from 'npm:stripe@17.5.0'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { autoOfferBest } from '../_shared/allocation.ts'

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
      await supabase.from('bookings').update({ status: 'open' }).eq('id', bookingId)
      // Auto-offer the freshly opened gig to the best-matched cleaner.
      // Best-effort: a failure here must never fail the payment webhook —
      // the gig is already in the open feed either way.
      try {
        await autoOfferBest(supabase, bookingId)
      } catch (err) {
        console.error('auto-offer failed for booking', bookingId, err)
      }
      // TODO: trigger confirmation SMS/email here once Twilio/email is wired up (out of scope for M1).
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
