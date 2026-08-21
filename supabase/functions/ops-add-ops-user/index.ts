import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)
  if (ops.role !== 'owner') return errorResponse('FORBIDDEN', 'Only an owner can add ops users.', 403)

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.email) return errorResponse('BAD_REQUEST', 'Missing email', 400)

  const supabase = getSupabaseAdmin()

  // They must have already signed up via the ops portal's own signup form
  // (with role: 'ops' in their metadata) before an owner can grant access —
  // this function only flips them from "signed up" to "authorized".
  const { data: existingUser } = await supabase
    .from('ops_users')
    .select('id')
    .eq('email', body.email)
    .maybeSingle()
  if (existingUser) return errorResponse('ALREADY_ADDED', 'That person already has ops access.', 409)

  const { data: authUsers, error: lookupError } = await supabase.auth.admin.listUsers()
  if (lookupError) return errorResponse('UNKNOWN', 'Could not look up that account', 500)

  const authUser = authUsers.users.find((u) => u.email?.toLowerCase() === body.email!.toLowerCase())
  if (!authUser) {
    return errorResponse('NOT_FOUND', 'No account with that email has signed up to the ops portal yet.', 404)
  }

  const { error: insertError } = await supabase.from('ops_users').insert({
    id: authUser.id,
    name: (authUser.user_metadata?.name as string | undefined) ?? '',
    email: authUser.email ?? body.email,
    role: 'staff',
  })
  if (insertError) return errorResponse('UNKNOWN', 'Could not grant access', 500)

  await supabase.from('events').insert({
    booking_id: null,
    actor_type: 'ops',
    actor_id: ops.id,
    action: 'ops_user_added',
  })

  return jsonResponse({ status: 'added' })
})
