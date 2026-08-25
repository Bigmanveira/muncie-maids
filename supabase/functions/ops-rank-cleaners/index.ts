import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'
import { loadAllocBooking, rankCleanersForBooking } from '../_shared/allocation.ts'

// Ops transparency view of the allocation engine: the full ranked list with
// per-factor score breakdowns for one booking. Powers the "best match"
// suggestions next to the manual offer picker.
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
  const booking = await loadAllocBooking(supabase, body.bookingId)
  if (!booking) return errorResponse('NOT_FOUND', 'Booking not found.', 404)

  const ranked = await rankCleanersForBooking(supabase, booking)
  return jsonResponse({ ranked })
})
