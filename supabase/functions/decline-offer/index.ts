import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner } from '../_shared/cleanerAuth.ts'
import { autoOfferBest } from '../_shared/allocation.ts'

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

  // Clearing the offer leaves the booking open/needs_ops for ops to try a
  // different cleaner — declining is never held against a cleaner (§8).
  const { data: declined, error } = await supabase
    .from('bookings')
    .update({ offered_cleaner_id: null, offered_at: null })
    .eq('id', body.bookingId)
    .eq('offered_cleaner_id', cleaner.id)
    .select('id')
    .single()

  if (error || !declined) return errorResponse('NOT_FOUND', "That offer isn't yours to decline.", 404)

  await supabase.from('events').insert({
    booking_id: declined.id,
    actor_type: 'cleaner',
    actor_id: cleaner.id,
    action: 'offer_declined',
  })

  // Cascade: offer the gig to the next-best cleaner. The allocation engine
  // excludes everyone who already declined this booking (the event above is
  // written first, so this decliner is excluded too). Best-effort — if no
  // one is eligible the gig is simply back in the open feed.
  try {
    await autoOfferBest(supabase, declined.id)
  } catch (err) {
    console.error('auto-offer cascade failed for booking', declined.id, err)
  }

  return jsonResponse({ status: 'declined' })
})
