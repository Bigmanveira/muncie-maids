import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

const BUCKET = 'booking-photos'
const MAX_BYTES = 15 * 1024 * 1024 // phone panorama shots can run several MB

export class PhotoUploadError extends Error {}

/** Uploads a proof-of-completion photo (ideally a phone panorama shot) for a claimed job. */
export async function uploadJobPhoto(bookingId: string, file: File): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new PhotoUploadError('That photo is too large — please choose one under 15MB.')
  }

  const { data, error } = await supabase.functions.invoke('request-photo-upload', {
    body: { bookingId, role: 'cleaner' },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new PhotoUploadError(body?.message ?? 'Could not start the photo upload.')
    }
    throw new PhotoUploadError(error.message)
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(data.path, data.uploadToken, file)

  if (uploadError) throw new PhotoUploadError('The upload failed partway through — please try again.')
}

export async function countJobPhotos(bookingId: string): Promise<number> {
  const { count } = await supabase
    .from('booking_photos')
    .select('id', { count: 'exact', head: true })
    .eq('booking_id', bookingId)
    .eq('uploaded_by', 'cleaner')
  return count ?? 0
}
