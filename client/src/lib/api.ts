import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { BookingRecord, DetailsInputs, QuoteInputs, ScheduleInputs } from '../types'

export interface CreateBookingRequest {
  quote: QuoteInputs
  schedule: ScheduleInputs
  details: DetailsInputs
}

export interface CreateBookingResponse {
  bookingId: string
  clientSecret: string
  bookingToken: string
}

export type CreateBookingErrorCode = 'WINDOW_TAKEN' | 'OUT_OF_AREA' | 'PRICE_MISMATCH' | 'UNKNOWN'

export class CreateBookingError extends Error {
  code: CreateBookingErrorCode
  constructor(code: CreateBookingErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export async function createBooking(req: CreateBookingRequest): Promise<CreateBookingResponse> {
  const { data, error } = await supabase.functions.invoke('create-booking', { body: req })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = await error.context.json()
        throw new CreateBookingError(body.code ?? 'UNKNOWN', body.message ?? error.message)
      } catch (parseError) {
        if (parseError instanceof CreateBookingError) throw parseError
      }
    }
    throw new CreateBookingError('UNKNOWN', error.message)
  }

  return { bookingId: data.bookingId, clientSecret: data.clientSecret, bookingToken: data.bookingToken }
}

export async function getBooking(bookingId: string, token: string): Promise<BookingRecord> {
  const { data, error } = await supabase.functions.invoke('get-booking', {
    body: { bookingId, token },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.message ?? 'This booking link is invalid or has expired.')
    }
    throw new Error(error.message)
  }

  return data as BookingRecord
}

export interface CancelBookingResponse {
  status: 'cancelled'
  refundAmount: number
  refundPercent: number
}

export async function cancelBooking(bookingId: string, token: string): Promise<CancelBookingResponse> {
  const { data, error } = await supabase.functions.invoke('cancel-booking', {
    body: { bookingId, token },
  })

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.message ?? 'Could not cancel this booking.')
    }
    throw new Error(error.message)
  }

  return data as CancelBookingResponse
}
