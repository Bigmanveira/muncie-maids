import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { bookingIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingIds?.length) return errorResponse('BAD_REQUEST', 'Missing bookingIds', 400)

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()

  const { data: paid, error } = await supabase
    .from('bookings')
    .update({ payout_paid_at: now })
    .in('id', body.bookingIds)
    .eq('status', 'completed')
    .is('payout_paid_at', null)
    .select('id')

  if (error) return errorResponse('UNKNOWN', 'Could not mark payouts paid', 500)

  await Promise.all(
    (paid ?? []).map((b) =>
      supabase.from('events').insert({
        booking_id: b.id,
        actor_type: 'ops',
        actor_id: ops.id,
        action: 'payout_marked_paid',
      }),
    ),
  )

  return jsonResponse({ paidCount: paid?.length ?? 0 })
})
