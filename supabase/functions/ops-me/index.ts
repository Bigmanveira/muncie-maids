import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  if (!jwt) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const admin = getSupabaseAdmin()
  const {
    data: { user },
  } = await admin.auth.getUser(jwt)
  if (!user) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const { data: opsUser } = await admin.from('ops_users').select('id, name, email, role').eq('id', user.id).single()

  // Signed in but never granted access — distinct from not being signed in
  // at all, so the app can show "ask an owner to add you" instead of a
  // login form.
  if (!opsUser) return errorResponse('NOT_AUTHORIZED', "Your account hasn't been granted ops access.", 403)

  return jsonResponse(opsUser)
})
