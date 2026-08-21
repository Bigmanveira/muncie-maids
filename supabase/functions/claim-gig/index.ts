import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner, isFeedUnlocked } from '../_shared/cleanerAuth.ts'

const PAYOUT_PERCENT = 0.7

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const cleaner = await getAuthedCleaner(req)
  if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)
  if (!isFeedUnlocked(cleaner)) {
    return errorResponse('NOT_UNLOCKED', 'Your application is still pending approval or your agreement is unsigned.', 403)
  }

  let body: { bookingId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingId) return errorResponse('BAD_REQUEST', 'Missing bookingId', 400)

  const supabase = getSupabaseAdmin()

  const { data: target, error: fetchError } = await supabase
    .from('bookings')
    .select('service_date, city, offered_cleaner_id')
    .eq('id', body.bookingId)
    .single()

  if (fetchError || !target) return errorResponse('NOT_FOUND', 'Gig not found.', 404)

  // A direct offer (product-plan-v2 §8) can be accepted regardless of the
  // cleaner's self-selected towns and even while the gig has escalated to
  // needs_ops — that's the whole point of ops stepping in.
  const isOffer = target.offered_cleaner_id === cleaner.id
  if (!isOffer && !cleaner.towns.includes(target.city as string)) {
    return errorResponse('OUT_OF_AREA', "That gig isn't in one of your towns.", 403)
  }

  const { data: sameDay } = await supabase
    .from('bookings')
    .select('id')
    .eq('cleaner_id', cleaner.id)
    .eq('service_date', target.service_date)
    .in('status', ['claimed', 'completed'])
    .limit(1)

  if (sameDay && sameDay.length > 0) {
    return errorResponse('DOUBLE_BOOKED', 'You already have a job that day.', 409)
  }

  // Atomic claim, so two simultaneous taps can't double-book the same gig.
  // Open-marketplace claims require `open` + unoffered; accepting a direct
  // offer works from `open` or `needs_ops`, but only for the cleaner it was
  // offered to (re-checked here, not just filtered client-side).
  let query = supabase
    .from('bookings')
    .update({ status: 'claimed', cleaner_id: cleaner.id, claimed_at: new Date().toISOString(), offered_cleaner_id: null, offered_at: null })
    .eq('id', body.bookingId)

  query = isOffer
    ? query.eq('offered_cleaner_id', cleaner.id).in('status', ['open', 'needs_ops'])
    : query.eq('status', 'open').is('offered_cleaner_id', null)

  const { data: claimed, error: claimError } = await query.select('*').single()

  if (claimError || !claimed) {
    return errorResponse('ALREADY_CLAIMED', 'Someone else just claimed that gig.', 409)
  }

  await supabase.from('events').insert({
    booking_id: claimed.id,
    actor_type: 'cleaner',
    actor_id: cleaner.id,
    action: isOffer ? 'offer_accepted' : 'claimed',
  })

  return jsonResponse({
    id: claimed.id,
    serviceDate: claimed.service_date,
    timeWindow: claimed.time_window,
    cleanType: claimed.clean_type,
    bedrooms: claimed.bedrooms,
    bathrooms: claimed.bathrooms,
    sqftBand: claimed.sqft_band,
    addressLine: claimed.address_line,
    city: claimed.city,
    zip: claimed.zip,
    entryNotes: claimed.entry_notes,
    hasPets: claimed.has_pets,
    customerName: claimed.customer_name,
    payout: Math.round(Number(claimed.quoted_price) * PAYOUT_PERCENT * 100) / 100,
  })
})
