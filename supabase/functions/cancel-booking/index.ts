import Stripe from 'npm:stripe@17.5.0'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { verifyBookingToken } from '../_shared/token.ts'
import { timeWindowStartHour } from '../_shared/timeWindows.ts'

// Cancellation policy (product-plan-v2 §5.1/§9, owner-confirmed):
// full refund at 24h+ before the visit, 50% retained inside 24h.
const FREE_CANCEL_HOURS = 24
const LATE_CANCEL_REFUND_PERCENT = 50

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: { bookingId?: string; token?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const { bookingId, token } = body
  if (!bookingId || !token) {
    return errorResponse('BAD_REQUEST', 'Missing bookingId or token', 400)
  }

  const validToken = await verifyBookingToken(bookingId, token)
  if (!validToken) {
    return errorResponse('INVALID_TOKEN', 'This booking link is invalid or has expired.', 403)
  }

  const supabase = getSupabaseAdmin()
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return errorResponse('NOT_FOUND', 'Booking not found.', 404)
  }

  if (booking.status === 'cancelled') {
    return errorResponse('ALREADY_CANCELLED', 'This booking is already cancelled.', 409)
  }

  const [y, m, d] = booking.service_date.split('-').map(Number)
  const serviceDateTime = new Date(y, m - 1, d, timeWindowStartHour(booking.time_window))
  const now = new Date()

  if (serviceDateTime.getTime() < now.getTime()) {
    return errorResponse('TOO_LATE', "This booking's visit has already passed.", 409)
  }

  let refundAmount = 0
  let refundPercent = 0

  if (booking.status === 'open') {
    const hoursUntil = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    refundPercent = hoursUntil >= FREE_CANCEL_HOURS ? 100 : LATE_CANCEL_REFUND_PERCENT
    refundAmount = Math.round(booking.quoted_price * (refundPercent / 100) * 100) / 100

    if (booking.stripe_payment_intent_id) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-12-18.acacia' })
      try {
        await stripe.refunds.create({
          payment_intent: booking.stripe_payment_intent_id,
          amount: Math.round(refundAmount * 100),
        })
      } catch {
        return errorResponse('REFUND_FAILED', "We couldn't process your refund. Please contact support.", 500)
      }
    }
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: now.toISOString(), refund_amount: refundAmount })
    .eq('id', bookingId)

  if (updateError) {
    return errorResponse('UNKNOWN', 'Could not cancel booking', 500)
  }

  return jsonResponse({ status: 'cancelled', refundAmount, refundPercent })
})
