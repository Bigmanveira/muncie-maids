import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Verification document uploads (ID photo, profile photo) — same signed-URL
// pattern as photos.ts. The edge function authorizes, mints the upload URL,
// and records the path on the cleaner row server-side.
const BUCKET = 'cleaner-documents'
const MAX_BYTES = 15 * 1024 * 1024

export type DocKind = 'id_document' | 'profile_photo'

export class DocUploadError extends Error {}

export async function uploadVerificationDoc(kind: DocKind, file: File): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new DocUploadError('That photo is too large — please choose one under 15MB.')
  }

  const { data, error } = await supabase.functions.invoke('request-cleaner-doc-upload', {
    body: { kind },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new DocUploadError(body?.message ?? 'Could not start the upload.')
    }
    throw new DocUploadError(error.message)
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(data.path, data.uploadToken, file)

  if (uploadError) throw new DocUploadError('The upload failed partway through — please try again.')
}
