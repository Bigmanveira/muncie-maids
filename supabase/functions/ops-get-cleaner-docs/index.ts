import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { getAuthedOps } from '../_shared/opsAuth.ts'

// Ops-only: mints short-lived signed READ URLs for a cleaner's verification
// documents (ID + profile photo). The bucket is private with no client
// policies, so this function is the only read path.
const BUCKET = 'cleaner-documents'
const SIGNED_URL_TTL_SECONDS = 60 * 10 // 10 minutes — long enough to review, short enough to not linger

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  const ops = await getAuthedOps(req)
  if (!ops) return errorResponse('UNAUTHORIZED', 'Sign in required.', 401)

  let body: { cleanerId?: string }
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }
  if (!body.cleanerId) return errorResponse('BAD_REQUEST', 'Missing cleanerId', 400)

  const supabase = getSupabaseAdmin()
  const { data: cleaner, error: fetchError } = await supabase
    .from('cleaners')
    .select('id, id_document_path, profile_photo_path')
    .eq('id', body.cleanerId)
    .single()
  if (fetchError || !cleaner) return errorResponse('NOT_FOUND', 'Cleaner not found.', 404)

  async function sign(path: string | null): Promise<string | null> {
    if (!path) return null
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
    return data?.signedUrl ?? null
  }

  return jsonResponse({
    idDocumentUrl: await sign(cleaner.id_document_path),
    profilePhotoUrl: await sign(cleaner.profile_photo_path),
  })
})
