import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner } from '../_shared/cleanerAuth.ts'

const PAYOUT_PERCENT = 0.7
const REQUIRED_PHOTO_COUNT = 4

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const cleaner = await getAuthedCleaner(req)
  if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { bookingId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingId) return errorResponse('BAD_REQUEST', 'Missing bookingId', 400)

  const supabase = getSupabaseAdmin()

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, cleaner_id, service_date, quoted_price')
    .eq('id', body.bookingId)
    .single()

  if (fetchError || !booking) return errorResponse('NOT_FOUND', 'Gig not found.', 404)
  if (booking.cleaner_id !== cleaner.id || booking.status !== 'claimed') {
    return errorResponse('NOT_YOURS', "That gig isn't yours to complete.", 403)
  }

  const [y, m, d] = (booking.service_date as string).split('-').map(Number)
  const serviceDate = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (serviceDate.getTime() > today.getTime()) {
    return errorResponse('TOO_EARLY', "You can't complete a job before its service date.", 409)
  }

  const { count: photoCount } = await supabase
    .from('booking_photos')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', booking.id)
    .eq('uploaded_by', 'cleaner')

  if ((photoCount ?? 0) < REQUIRED_PHOTO_COUNT) {
    return errorResponse('PHOTOS_REQUIRED', `Add all ${REQUIRED_PHOTO_COUNT} proof photos before completing this job.`, 409)
  }

  const payoutAmount = Math.round(Number(booking.quoted_price) * PAYOUT_PERCENT * 100) / 100
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed', completed_at: now, payout_amount: payoutAmount })
    .eq('id', booking.id)

  if (updateError) return errorResponse('UNKNOWN', 'Could not mark this job complete', 500)

  const { data: reliability } = await supabase
    .from('cleaners')
    .select('reliability_completed')
    .eq('id', cleaner.id)
    .single()

  await supabase
    .from('cleaners')
    .update({ reliability_completed: (reliability?.reliability_completed ?? 0) + 1 })
    .eq('id', cleaner.id)

  await supabase.from('events').insert({
    booking_id: booking.id,
    actor_type: 'cleaner',
    actor_id: cleaner.id,
    action: 'completed',
  })

  return jsonResponse({ status: 'completed', payoutAmount })
})
