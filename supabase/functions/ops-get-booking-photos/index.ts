import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

const BUCKET = 'booking-photos'
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour — plenty for a review session

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { bookingId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.bookingId) return errorResponse('BAD_REQUEST', 'Missing bookingId', 400)

  const supabase = getSupabaseAdmin()
  const { data: photos, error } = await supabase
    .from('booking_photos')
    .select('id, uploaded_by, storage_path, created_at')
    .eq('booking_id', body.bookingId)
    .order('created_at', { ascending: true })

  if (error) return errorResponse('UNKNOWN', 'Could not load photos', 500)
  if (!photos?.length) return jsonResponse({ photos: [] })

  const signed = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p.storage_path, SIGNED_URL_TTL_SECONDS)
      return {
        id: p.id,
        uploadedBy: p.uploaded_by,
        url: data?.signedUrl ?? null,
        createdAt: p.created_at,
      }
    }),
  )

  return jsonResponse({ photos: signed.filter((p) => p.url) })
})
