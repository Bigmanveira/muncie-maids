import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

// A pending_payment booking that's been sitting this long almost certainly
// means the Stripe checkout was abandoned or failed.
const STALE_PENDING_HOURS = 1

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  const supabase = getSupabaseAdmin()

  const [needsOps, stalePending, releaseEvents] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, service_date, time_window, clean_type, city, customer_name, quoted_price, offered_cleaner_id')
      .eq('status', 'needs_ops')
      .order('service_date', { ascending: true }),
    supabase
      .from('bookings')
      .select('id, service_date, time_window, customer_name, customer_email, quoted_price, created_at')
      .eq('status', 'pending_payment')
      .lt('created_at', new Date(Date.now() - STALE_PENDING_HOURS * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('events')
      .select('id, booking_id, actor_id, created_at')
      .eq('action', 'released_inside_48h')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (needsOps.error || stalePending.error || releaseEvents.error) {
    return errorResponse('UNKNOWN', 'Could not load the dashboard', 500)
  }

  // events.actor_id has no FK (it's polymorphic across client/cleaner/ops/
  // system) so it can't be embedded via PostgREST — resolve names manually.
  const bookingIds = [...new Set((releaseEvents.data ?? []).map((e) => e.booking_id))]
  const cleanerIds = [...new Set((releaseEvents.data ?? []).map((e) => e.actor_id).filter(Boolean))]

  const [releaseBookings, releaseCleaners] = await Promise.all([
    bookingIds.length
      ? supabase.from('bookings').select('id, service_date, customer_name').in('id', bookingIds)
      : Promise.resolve({ data: [] }),
    cleanerIds.length ? supabase.from('cleaners').select('id, name').in('id', cleanerIds) : Promise.resolve({ data: [] }),
  ])

  const bookingById = new Map((releaseBookings.data ?? []).map((b) => [b.id, b]))
  const cleanerById = new Map((releaseCleaners.data ?? []).map((c) => [c.id, c]))

  return jsonResponse({
    needsOps: (needsOps.data ?? []).map((b) => ({
      id: b.id,
      serviceDate: b.service_date,
      timeWindow: b.time_window,
      cleanType: b.clean_type,
      city: b.city,
      customerName: b.customer_name,
      quotedPrice: Number(b.quoted_price),
      hasOffer: b.offered_cleaner_id != null,
    })),
    stalePending: (stalePending.data ?? []).map((b) => ({
      id: b.id,
      serviceDate: b.service_date,
      timeWindow: b.time_window,
      customerName: b.customer_name,
      customerEmail: b.customer_email,
      quotedPrice: Number(b.quoted_price),
      createdAt: b.created_at,
    })),
    recentReleases: (releaseEvents.data ?? []).map((e) => {
      const booking = bookingById.get(e.booking_id)
      const cleaner = cleanerById.get(e.actor_id)
      return {
        id: e.id,
        bookingId: e.booking_id,
        cleanerName: cleaner?.name ?? 'Unknown',
        serviceDate: booking?.service_date ?? null,
        customerName: booking?.customer_name ?? null,
        releasedAt: e.created_at,
      }
    }),
  })
})
