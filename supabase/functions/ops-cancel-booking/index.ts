import Stripe from 'npm:stripe@17.5.0'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { bookingId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingId) return errorResponse('BAD_REQUEST', 'Missing bookingId', 400)

  const supabase = getSupabaseAdmin()
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', body.bookingId)
    .single()

  if (fetchError || !booking) return errorResponse('NOT_FOUND', 'Booking not found.', 404)
  if (booking.status === 'cancelled') return errorResponse('ALREADY_CANCELLED', 'This booking is already cancelled.', 409)

  // Ops-initiated cancellations are always a full refund — the client
  // didn't choose to back out, the business couldn't deliver.
  let refundAmount = 0
  if (['open', 'claimed', 'needs_ops'].includes(booking.status) && booking.stripe_payment_intent_id) {
    refundAmount = Number(booking.quoted_price)
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-12-18.acacia' })
    try {
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100),
      })
    } catch {
      return errorResponse('REFUND_FAILED', 'Could not process the Stripe refund.', 500)
    }
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      refund_amount: refundAmount,
      cleaner_id: null,
      offered_cleaner_id: null,
    })
    .eq('id', body.bookingId)

  if (updateError) return errorResponse('UNKNOWN', 'Could not cancel booking', 500)

  await supabase.from('events').insert({
    booking_id: body.bookingId,
    actor_type: 'ops',
    actor_id: ops.id,
    action: 'cancelled',
  })

  return jsonResponse({ status: 'cancelled', refundAmount })
})
