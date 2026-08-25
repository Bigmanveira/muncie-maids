import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'
import { autoOfferBest } from '../_shared/allocation.ts'

// One-click "offer to best match": runs the allocation engine for a booking
// and places the offer with the top-ranked eligible cleaner. Same offer
// semantics as a manual pick — the cleaner still accepts or declines.
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
  const offered = await autoOfferBest(supabase, body.bookingId)
  if (!offered) {
    return errorResponse(
      'NO_ELIGIBLE_CLEANER',
      'No eligible cleaner right now (already offered, nobody serves this town/service, or everyone declined). The gig stays in the open feed.',
      409,
    )
  }

  return jsonResponse({ status: 'offered', cleaner: { id: offered.cleanerId, name: offered.name, score: offered.total } })
})
