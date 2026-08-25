import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedCleaner } from '../_shared/cleanerAuth.ts'

// Mints a signed upload URL for a cleaner's own verification document and
// records the storage path on their row. The path is written server-side so
// a cleaner can never point their column at someone else's file — the
// document-path columns are not in the `authenticated` column grant.
const BUCKET = 'cleaner-documents'

const KINDS = {
  id_document: 'id_document_path',
  profile_photo: 'profile_photo_path',
} as const

type Kind = keyof typeof KINDS

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const cleaner = await getAuthedCleaner(req)
  if (!cleaner) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { kind?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (body.kind !== 'id_document' && body.kind !== 'profile_photo') {
    return errorResponse('BAD_REQUEST', 'kind must be id_document or profile_photo', 400)
  }
  const kind = body.kind as Kind

  const supabase = getSupabaseAdmin()
  const storagePath = `${cleaner.id}/${kind}-${Date.now()}.jpg`

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)
  if (signError || !signed) return errorResponse('UNKNOWN', 'Could not prepare the upload.', 500)

  const { error: updateError } = await supabase
    .from('cleaners')
    .update({ [KINDS[kind]]: storagePath })
    .eq('id', cleaner.id)
  if (updateError) return errorResponse('UNKNOWN', 'Could not record the document.', 500)

  await supabase.from('events').insert({
    booking_id: null,
    actor_type: 'cleaner',
    actor_id: cleaner.id,
    action: `verification_${kind}_uploaded`,
  })

  return jsonResponse({ uploadUrl: signed.signedUrl, uploadToken: signed.token, path: signed.path })
})
