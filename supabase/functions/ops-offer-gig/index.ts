import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { bookingId?: string; cleanerId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingId || !body.cleanerId) return errorResponse('BAD_REQUEST', 'Missing bookingId or cleanerId', 400)

  const supabase = getSupabaseAdmin()

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, status, city')
    .eq('id', body.bookingId)
    .single()
  if (bookingError || !booking) return errorResponse('NOT_FOUND', 'Booking not found.', 404)
  if (!['open', 'needs_ops'].includes(booking.status)) {
    return errorResponse('INVALID_STATUS', 'Only open or needs_ops gigs can be offered.', 409)
  }

  const { data: cleaner, error: cleanerError } = await supabase
    .from('cleaners')
    .select('id, status, towns')
    .eq('id', body.cleanerId)
    .single()
  if (cleanerError || !cleaner) return errorResponse('NOT_FOUND', 'Cleaner not found.', 404)
  if (cleaner.status !== 'active') return errorResponse('INVALID_CLEANER', 'That cleaner is not active.', 409)
  if (!(cleaner.towns as string[]).includes(booking.city)) {
    return errorResponse('OUT_OF_AREA', "That cleaner doesn't serve this gig's town.", 409)
  }

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ offered_cleaner_id: body.cleanerId, offered_at: now })
    .eq('id', body.bookingId)
  if (updateError) return errorResponse('UNKNOWN', 'Could not offer this gig', 500)

  await supabase.from('events').insert({
    booking_id: body.bookingId,
    actor_type: 'ops',
    actor_id: ops.id,
    action: 'offered',
  })

  return jsonResponse({ status: 'offered' })
})
