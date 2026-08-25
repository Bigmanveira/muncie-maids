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
    .select(
      'id, status, agreement_signed_at, verification_submitted_at, bg_check_consented_at, bg_check_status, id_document_path, profile_photo_path',
    )
    .eq('id', body.cleanerId)
    .single()
  if (fetchError || !cleaner) return errorResponse('NOT_FOUND', 'Cleaner not found.', 404)
  if (cleaner.status !== 'applied') return errorResponse('INVALID_STATUS', 'This application was already reviewed.', 409)

  // Approval gate — customer security requirements. Declines are always
  // allowed; approvals require the full vetting trail. Enforced here (not
  // just in the ops UI) so no client bug can activate an unvetted cleaner.
  if (body.decision === 'approve') {
    const missing: string[] = []
    if (!cleaner.verification_submitted_at) missing.push('identity verification not submitted')
    if (!cleaner.id_document_path) missing.push('no ID document on file')
    if (!cleaner.profile_photo_path) missing.push('no profile photo on file')
    if (!cleaner.bg_check_consented_at) missing.push('background check not authorized')
    if (cleaner.bg_check_status !== 'clear') missing.push(`background check is "${cleaner.bg_check_status}", needs "clear"`)
    if (!cleaner.agreement_signed_at) missing.push('agreement not signed')
    if (missing.length > 0) {
      return errorResponse('REQUIREMENTS_NOT_MET', `Cannot approve: ${missing.join('; ')}.`, 409)
    }
  }

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
