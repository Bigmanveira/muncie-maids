import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { cleanerId?: string; decision?: 'approve' | 'decline' }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.cleanerId || !body.decision) return errorResponse('BAD_REQUEST', 'Missing cleanerId or decision', 400)

  const supabase = getSupabaseAdmin()
  const { data: cleaner, error: fetchError } = await supabase
    .from('cleaners')
    .select('id, status')
    .eq('id', body.cleanerId)
    .single()
  if (fetchError || !cleaner) return errorResponse('NOT_FOUND', 'Cleaner not found.', 404)
  if (cleaner.status !== 'applied') return errorResponse('INVALID_STATUS', 'This application was already reviewed.', 409)

  const nextStatus = body.decision === 'approve' ? 'active' : 'declined'
  const { error: updateError } = await supabase.from('cleaners').update({ status: nextStatus }).eq('id', body.cleanerId)
  if (updateError) return errorResponse('UNKNOWN', 'Could not save the decision', 500)

  await supabase.from('events').insert({
    booking_id: null,
    actor_type: 'ops',
    actor_id: ops.id,
    action: body.decision === 'approve' ? 'application_approved' : 'application_declined',
  })

  return jsonResponse({ status: nextStatus })
})
