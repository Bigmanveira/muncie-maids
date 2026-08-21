import Stripe from 'npm:stripe@17.5.0'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { getSupabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { BATHROOM_COUNT, BEDROOM_COUNT, calculatePrice } from '../_shared/pricing.ts'
import { signBookingId } from '../_shared/token.ts'

// PLACEHOLDER — replace with the real crew capacity per arrival window
// once the owner confirms how many jobs can run concurrently. See DECISIONS.md.
const MAX_BOOKINGS_PER_WINDOW = 3

interface CreateBookingRequest {
  quote: {
    bedrooms: keyof typeof BEDROOM_COUNT
    bathrooms: keyof typeof BATHROOM_COUNT
    sqftBand: string
    cleanType: string
    frequency: string
  }
  schedule: {
    serviceDate: string
    timeWindow: string
  }
  details: {
    customerName: string
    customerPhone: string
    customerEmail: string
    addressLine: string
    zip: string
    entryNotes: string
    hasPets: boolean
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return errorResponse('METHOD_NOT_ALLOWED', 'Use POST', 405)

  let body: CreateBookingRequest
  try {
    body = await req.json()
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid JSON body', 400)
  }

  const { quote, schedule, details } = body ?? {}
  if (!quote || !schedule || !details) {
    return errorResponse('BAD_REQUEST', 'Missing quote, schedule, or details', 400)
  }

  const supabase = getSupabaseAdmin()

  const { data: config, error: configError } = await supabase
    .from('pricing_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (configError || !config) {
    return errorResponse('CONFIG_UNAVAILABLE', 'Pricing is temporarily unavailable', 503)
  }

  const { data: areas, error: areasError } = await supabase
    .from('service_areas')
    .select('*')
    .eq('active', true)

  if (areasError) {
    return errorResponse('CONFIG_UNAVAILABLE', 'Service area lookup is temporarily unavailable', 503)
  }

  const matchedArea = (areas ?? []).find((area) => (area.zip_prefixes as string[]).includes(details.zip))
  if (!matchedArea) {
    return errorResponse('OUT_OF_AREA', `We're not in ${details.zip} yet.`, 422)
  }

  let quotedPrice: number
  try {
    quotedPrice = calculatePrice(quote, config)
  } catch {
    return errorResponse('BAD_REQUEST', 'Invalid quote selections', 400)
  }

  const { count: windowCount, error: windowError } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('service_date', schedule.serviceDate)
    .eq('time_window', schedule.timeWindow)
    .neq('status', 'cancelled')

  if (windowError) {
    return errorResponse('UNKNOWN', 'Could not check availability', 500)
  }

  if ((windowCount ?? 0) >= MAX_BOOKINGS_PER_WINDOW) {
    return errorResponse('WINDOW_TAKEN', 'That window just filled — pick another.', 409)
  }

  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      status: 'pending_payment',
      bedrooms: BEDROOM_COUNT[quote.bedrooms],
      bathrooms: BATHROOM_COUNT[quote.bathrooms],
      sqft_band: quote.sqftBand,
      clean_type: quote.cleanType,
      frequency: quote.frequency,
      quoted_price: quotedPrice,
      service_date: schedule.serviceDate,
      time_window: schedule.timeWindow,
      customer_name: details.customerName,
      customer_phone: details.customerPhone,
      customer_email: details.customerEmail,
      address_line: details.addressLine,
      city: matchedArea.city,
      zip: details.zip,
      entry_notes: details.entryNotes || null,
      has_pets: details.hasPets,
    })
    .select('id')
    .single()

  if (insertError || !booking) {
    return errorResponse('UNKNOWN', 'Could not create booking', 500)
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-12-18.acacia' })

  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(quotedPrice * 100),
      currency: 'usd',
      metadata: { booking_id: booking.id },
      automatic_payment_methods: { enabled: true },
    })
  } catch {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
    return errorResponse('UNKNOWN', 'Could not start payment', 500)
  }

  await supabase.from('bookings').update({ stripe_payment_intent_id: paymentIntent.id }).eq('id', booking.id)

  const bookingToken = await signBookingId(booking.id)

  return jsonResponse({
    bookingId: booking.id,
    clientSecret: paymentIntent.client_secret,
    bookingToken,
  })
})
