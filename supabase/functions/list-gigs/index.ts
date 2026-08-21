import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner, isFeedUnlocked } from '../_shared/cleanerAuth.ts'

const PAYOUT_PERCENT = 0.7

function toGig(g: Record<string, unknown>) {
  return {
    id: g.id,
    serviceDate: g.service_date,
    timeWindow: g.time_window,
    cleanType: g.clean_type,
    bedrooms: g.bedrooms,
    bathrooms: g.bathrooms,
    sqftBand: g.sqft_band,
    city: g.city,
    zip: g.zip,
    payout: Math.round(Number(g.quoted_price) * PAYOUT_PERCENT * 100) / 100,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const cleaner = await getAuthedCleaner(req)
  if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)
  if (!isFeedUnlocked(cleaner)) {
    return errorResponse('NOT_UNLOCKED', 'Your application is still pending approval or your agreement is unsigned.', 403)
  }

  const supabase = getSupabaseAdmin()

  // Offers are direct invitations from ops (product-plan-v2 §8 — never a
  // unilateral assignment, the cleaner must accept) so they're shown
  // regardless of the cleaner's self-selected towns.
  const { data: offered, error: offerError } = await supabase
    .from('bookings')
    .select('id, service_date, time_window, clean_type, bedrooms, bathrooms, sqft_band, city, zip, quoted_price')
    .eq('offered_cleaner_id', cleaner.id)
    .in('status', ['open', 'needs_ops'])
    .order('service_date', { ascending: true })

  if (offerError) return errorResponse('UNKNOWN', 'Could not load your offers', 500)

  if (cleaner.towns.length === 0) {
    return jsonResponse({ gigs: [], offers: (offered ?? []).map(toGig) })
  }

  // A cleaner can't take a second gig the same day (see DECISIONS.md —
  // simplified from the plan's window-overlap check to a same-date check).
  const { data: claimedDates } = await supabase
    .from('bookings')
    .select('service_date')
    .eq('cleaner_id', cleaner.id)
    .in('status', ['claimed', 'completed'])

  const bookedDates = new Set((claimedDates ?? []).map((b) => b.service_date as string))

  const { data: gigs, error } = await supabase
    .from('bookings')
    .select('id, service_date, time_window, clean_type, bedrooms, bathrooms, sqft_band, city, zip, quoted_price')
    .eq('status', 'open')
    .is('offered_cleaner_id', null)
    .in('city', cleaner.towns)
    .order('service_date', { ascending: true })

  if (error) return errorResponse('UNKNOWN', 'Could not load the gig feed', 500)

  const available = (gigs ?? []).filter((g) => !bookedDates.has(g.service_date as string))

  return jsonResponse({
    gigs: available.map(toGig),
    offers: (offered ?? []).map(toGig),
  })
})
