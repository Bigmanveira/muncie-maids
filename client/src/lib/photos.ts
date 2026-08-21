import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

const BUCKET = 'booking-photos'
const MAX_BYTES = 15 * 1024 * 1024 // phone panorama shots can run several MB

export class PhotoUploadError extends Error {}

/** Uploads a walkthrough photo (ideally a phone panorama shot) for a booking. */
export async function uploadBookingPhoto(bookingId: string, bookingToken: string, file: File): Promise<void> {
  if (file.size > MAX_BYTES) {
    throw new PhotoUploadError('That photo is too large — please choose one under 15MB.')
  }

  const { data, error } = await supabase.functions.invoke('request-photo-upload', {
    body: { bookingId, role: 'client', bookingToken },
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
