import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { verifyBookingToken } from '../_shared/token.ts'

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
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(
      'id, status, bedrooms, bathrooms, sqft_band, clean_type, frequency, quoted_price, service_date, time_window, customer_name, address_line, city, zip, entry_notes, has_pets, cancelled_at, refund_amount',
    )
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    return errorResponse('NOT_FOUND', 'Booking not found.', 404)
  }

  return jsonResponse(booking)
})
