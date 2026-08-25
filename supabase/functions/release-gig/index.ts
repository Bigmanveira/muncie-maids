import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner } from '../_shared/cleanerAuth.ts'
import { timeWindowStartHour } from '../_shared/timeWindows.ts'
import { autoOfferBest } from '../_shared/allocation.ts'

// Releasing inside 48h of the visit is penalty-free to the client (the gig
// just goes back to OPEN) but counts against the cleaner's reliability and
// gets flagged for ops — product-plan-v2 §4/§8.
const OPS_ALERT_HOURS = 48

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const cleaner = await getAuthedCleaner(req)
  if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

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
    .select('id, status, cleaner_id, service_date, time_window')
    .eq('id', body.bookingId)
    .single()

  if (fetchError || !booking) return errorResponse('NOT_FOUND', 'Gig not found.', 404)
  if (booking.cleaner_id !== cleaner.id || booking.status !== 'claimed') {
    return errorResponse('NOT_YOURS', "That gig isn't yours to release.", 403)
  }

  const [y, m, d] = (booking.service_date as string).split('-').map(Number)
  const serviceDateTime = new Date(y, m - 1, d, timeWindowStartHour(booking.time_window as string))
  const hoursUntil = (serviceDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const insideAlertWindow = hoursUntil < OPS_ALERT_HOURS

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'open', cleaner_id: null, claimed_at: null })
    .eq('id', booking.id)

  if (updateError) return errorResponse('UNKNOWN', 'Could not release this gig', 500)

  const { data: reliability } = await supabase
    .from('cleaners')
    .select('reliability_released')
    .eq('id', cleaner.id)
    .single()

  await supabase
    .from('cleaners')
    .update({ reliability_released: (reliability?.reliability_released ?? 0) + 1 })
    .eq('id', cleaner.id)

  await supabase.from('events').insert({
    booking_id: booking.id,
    actor_type: 'cleaner',
    actor_id: cleaner.id,
    action: insideAlertWindow ? 'released_inside_48h' : 'released',
  })

  // The released gig needs a new cleaner — auto-offer the best match right
  // away (especially valuable inside the 48h window). Best-effort.
  try {
    await autoOfferBest(supabase, booking.id)
  } catch (err) {
    console.error('auto-offer after release failed for booking', booking.id, err)
  }

  return jsonResponse({ status: 'released', opsAlerted: insideAlertWindow })
})
