import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'

export class ApiError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

async function invoke<T>(fn: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body: body ?? {} })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const parsed = await error.context.json().catch(() => null)
      throw new ApiError(parsed?.code ?? 'UNKNOWN', parsed?.message ?? error.message)
    }
    throw new ApiError('UNKNOWN', error.message)
  }
  return data as T
}

export interface Gig {
  id: string
  serviceDate: string
  timeWindow: string
  cleanType: string
  bedrooms: number
  bathrooms: number
  sqftBand: string
  city: string
  zip: string
  payout: number
}

export interface ClaimedGig extends Gig {
  addressLine: string
  entryNotes: string | null
  hasPets: boolean
  customerName: string
}

export function listGigs() {
  return invoke<{ gigs: Gig[]; offers: Gig[] }>('list-gigs')
}

export function claimGig(bookingId: string) {
  return invoke<ClaimedGig>('claim-gig', { bookingId })
}

export function declineOffer(bookingId: string) {
  return invoke<{ status: 'declined' }>('decline-offer', { bookingId })
}

export function releaseGig(bookingId: string) {
  return invoke<{ status: 'released'; opsAlerted: boolean }>('release-gig', { bookingId })
}

export function completeGig(bookingId: string) {
  return invoke<{ status: 'completed'; payoutAmount: number }>('complete-gig', { bookingId })
}
