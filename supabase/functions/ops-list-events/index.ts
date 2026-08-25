import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

// Audit log for the ops portal: the events table is the system of record for
// every actor-visible action (claims, offers, approvals, background checks,
// document uploads, releases, cancellations...). This returns a page of
// events enriched with actor names and booking context. Cursor-paged via
// `before` (an ISO timestamp) for "load older".
const PAGE_SIZE = 60

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { before?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('events')
    .select('id, booking_id, actor_type, actor_id, action, created_at')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)
  if (body.before) query = query.lt('created_at', body.before)

  const { data: events, error } = await query
  if (error) return errorResponse('UNKNOWN', 'Could not load the audit log', 500)

  // Batch-resolve actor names and booking summaries.
  const cleanerIds = [...new Set((events ?? []).filter((e) => e.actor_type === 'cleaner' || e.actor_type === 'system').map((e) => e.actor_id).filter(Boolean))]
  const opsIds = [...new Set((events ?? []).filter((e) => e.actor_type === 'ops').map((e) => e.actor_id).filter(Boolean))]
  const bookingIds = [...new Set((events ?? []).map((e) => e.booking_id).filter(Boolean))]

  const [{ data: cleaners }, { data: opsUsers }, { data: bookings }] = await Promise.all([
    cleanerIds.length
      ? supabase.from('cleaners').select('id, name').in('id', cleanerIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    opsIds.length
      ? supabase.from('ops_users').select('id, name, email').in('id', opsIds)
      : Promise.resolve({ data: [] as { id: string; name: string; email: string }[] }),
    bookingIds.length
      ? supabase.from('bookings').select('id, customer_name, service_date, city').in('id', bookingIds)
      : Promise.resolve({ data: [] as { id: string; customer_name: string; service_date: string; city: string }[] }),
  ])

  const cleanerName = new Map((cleaners ?? []).map((c) => [c.id, c.name]))
  const opsName = new Map((opsUsers ?? []).map((o) => [o.id, o.name || o.email]))
  const bookingInfo = new Map((bookings ?? []).map((b) => [b.id, b]))

  const enriched = (events ?? []).map((e) => {
    let actorName: string | null = null
    if (e.actor_id) {
      if (e.actor_type === 'ops') actorName = opsName.get(e.actor_id) ?? null
      else actorName = cleanerName.get(e.actor_id) ?? null
    }
    const b = e.booking_id ? bookingInfo.get(e.booking_id) : null
    return {
      id: e.id,
      action: e.action,
      actorType: e.actor_type,
      actorName,
      bookingId: e.booking_id,
      bookingCustomer: b?.customer_name ?? null,
      bookingDate: b?.service_date ?? null,
      bookingCity: b?.city ?? null,
      createdAt: e.created_at,
    }
  })

  return jsonResponse({ events: enriched, hasMore: (events ?? []).length === PAGE_SIZE })
})
