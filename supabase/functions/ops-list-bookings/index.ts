import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

interface ListBookingsRequest {
  status?: string
  search?: string
  limit?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: ListBookingsRequest
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('bookings')
    .select(
      'id, status, service_date, time_window, clean_type, city, zip, quoted_price, customer_name, customer_email, customer_phone, cleaner_id, offered_cleaner_id, payout_amount, payout_paid_at, created_at',
    )
    .order('service_date', { ascending: false })
    .limit(Math.min(body.limit ?? 100, 200))

  if (body.status) query = query.eq('status', body.status)
  if (body.search) {
    const term = body.search.trim()
    query = query.or(`customer_name.ilike.%${term}%,customer_email.ilike.%${term}%,city.ilike.%${term}%`)
  }

  const { data: bookings, error } = await query
  if (error) return errorResponse('UNKNOWN', 'Could not load bookings', 500)

  const cleanerIds = [...new Set((bookings ?? []).flatMap((b) => [b.cleaner_id, b.offered_cleaner_id]).filter(Boolean))]
  const { data: cleaners } = cleanerIds.length
    ? await supabase.from('cleaners').select('id, name').in('id', cleanerIds)
    : { data: [] as { id: string; name: string }[] }
  const cleanerById = new Map((cleaners ?? []).map((c) => [c.id, c.name]))

  return jsonResponse({
    bookings: (bookings ?? []).map((b) => ({
      id: b.id,
      status: b.status,
      serviceDate: b.service_date,
      timeWindow: b.time_window,
      cleanType: b.clean_type,
      city: b.city,
      zip: b.zip,
      quotedPrice: Number(b.quoted_price),
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      customerPhone: b.customer_phone,
      cleanerName: b.cleaner_id ? (cleanerById.get(b.cleaner_id) ?? 'Unknown') : null,
      offeredCleanerName: b.offered_cleaner_id ? (cleanerById.get(b.offered_cleaner_id) ?? 'Unknown') : null,
      payoutAmount: b.payout_amount != null ? Number(b.payout_amount) : null,
      payoutPaidAt: b.payout_paid_at,
      createdAt: b.created_at,
    })),
  })
})
