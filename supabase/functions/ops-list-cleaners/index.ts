import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const supabase = getSupabaseAdmin()
  const { data: cleaners, error } = await supabase
    .from('cleaners')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return errorResponse('UNKNOWN', 'Could not load cleaners', 500)

  return jsonResponse({
    cleaners: (cleaners ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      towns: c.towns,
      services: c.services,
      yearsExperience: c.years_experience,
      hasOwnEquipment: c.has_own_equipment,
      status: c.status,
      agreementSignedAt: c.agreement_signed_at,
      reliabilityCompleted: c.reliability_completed,
      reliabilityReleased: c.reliability_released,
      createdAt: c.created_at,
    })),
  })
})
