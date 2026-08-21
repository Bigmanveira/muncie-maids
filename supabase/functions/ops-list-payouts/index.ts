import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const supabase = getSupabaseAdmin()
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, service_date, clean_type, cleaner_id, payout_amount, payout_paid_at, completed_at')
    .eq('status', 'completed')
    .order('service_date', { ascending: false })

  if (error) return errorResponse('UNKNOWN', 'Could not load payouts', 500)

  const cleanerIds = [...new Set((bookings ?? []).map((b) => b.cleaner_id).filter(Boolean))]
  const { data: cleaners } = cleanerIds.length
    ? await supabase.from('cleaners').select('id, name').in('id', cleanerIds)
    : { data: [] as { id: string; name: string }[] }
  const cleanerById = new Map((cleaners ?? []).map((c) => [c.id, c.name]))

  return jsonResponse({
    payouts: (bookings ?? []).map((b) => ({
      id: b.id,
      serviceDate: b.service_date,
      cleanType: b.clean_type,
      cleanerId: b.cleaner_id,
      cleanerName: b.cleaner_id ? (cleanerById.get(b.cleaner_id) ?? 'Unknown') : 'Unassigned',
      payoutAmount: b.payout_amount != null ? Number(b.payout_amount) : 0,
      payoutPaidAt: b.payout_paid_at,
      completedAt: b.completed_at,
    })),
  })
})
