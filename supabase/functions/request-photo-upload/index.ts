import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { verifyBookingToken } from '../_shared/token.ts'
import { getAuthedCleaner } from '../_shared/cleanerAuth.ts'

const BUCKET = 'booking-photos'

interface RequestBody {
  bookingId?: string
  role?: 'client' | 'cleaner'
  bookingToken?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const { bookingId, role } = body
  if (!bookingId || (role !== 'client' && role !== 'cleaner')) {
    return errorResponse('BAD_REQUEST', 'Missing bookingId or role', 400)
  }

  const supabase = getSupabaseAdmin()

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, cleaner_id')
    .eq('id', bookingId)
    .single()
  if (fetchError || !booking) return errorResponse('NOT_FOUND', 'Booking not found.', 404)

  if (role === 'client') {
    if (!body.bookingToken || !(await verifyBookingToken(bookingId, body.bookingToken))) {
      return errorResponse('INVALID_TOKEN', 'This booking link is invalid or has expired.', 403)
    }
  } else {
    const cleaner = await getAuthedCleaner(req)
    if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)
    if (booking.cleaner_id !== cleaner.id || !['claimed', 'completed'].includes(booking.status)) {
      return errorResponse('NOT_YOURS', "That job isn't yours to add photos to.", 403)
    }
  }

  const storagePath = `${bookingId}/${role}-${Date.now()}.jpg`

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)
  if (signError || !signed) return errorResponse('UNKNOWN', 'Could not prepare the upload.', 500)

  const { error: insertError } = await supabase.from('booking_photos').insert({
    booking_id: bookingId,
    uploaded_by: role,
    storage_path: storagePath,
  })
  if (insertError) return errorResponse('UNKNOWN', 'Could not record the photo.', 500)

  await supabase.from('events').insert({
    booking_id: bookingId,
    actor_type: role,
    actor_id: role === 'cleaner' ? booking.cleaner_id : null,
    action: 'photo_upload_requested',
  })

  return jsonResponse({ uploadUrl: signed.signedUrl, uploadToken: signed.token, path: signed.path })
})
