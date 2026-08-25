import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

// Ops records the outcome of a background check ordered through a consumer
// reporting agency (Checkr, GoodHire, ...). We store only status + provider
// + the provider's report reference — never report contents, never an SSN.
// Requires the cleaner to have consented in-app first (FCRA authorization).
const STATUSES = ['pending', 'clear', 'consider', 'failed'] as const
type BgStatus = (typeof STATUSES)[number]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { cleanerId?: string; status?: string; provider?: string; reference?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.cleanerId || !STATUSES.includes(body.status as BgStatus)) {
    return errorResponse('BAD_REQUEST', 'Missing cleanerId or invalid status', 400)
  }

  const supabase = getSupabaseAdmin()
  const { data: cleaner, error: fetchError } = await supabase
    .from('cleaners')
    .select('id, bg_check_consented_at')
    .eq('id', body.cleanerId)
    .single()
  if (fetchError || !cleaner) return errorResponse('NOT_FOUND', 'Cleaner not found.', 404)
  if (!cleaner.bg_check_consented_at) {
    return errorResponse('NO_CONSENT', 'This cleaner has not authorized a background check yet.', 409)
  }

  const status = body.status as BgStatus
  const done = status !== 'pending'
  const { error: updateError } = await supabase
    .from('cleaners')
    .update({
      bg_check_status: status,
      bg_check_provider: body.provider?.trim() || null,
      bg_check_reference: body.reference?.trim() || null,
      bg_check_completed_at: done ? new Date().toISOString() : null,
    })
    .eq('id', body.cleanerId)
  if (updateError) return errorResponse('UNKNOWN', 'Could not save the background check.', 500)

  await supabase.from('events').insert({
    booking_id: null,
    actor_type: 'ops',
    actor_id: ops.id,
    action: `bg_check_${status}`,
  })

  return jsonResponse({ status })
})
