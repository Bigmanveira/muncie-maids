export type Bedrooms = 'studio' | '1' | '2' | '3' | '4+'
export type Bathrooms = '1' | '1.5' | '2' | '2.5+'
export type SqftBand = 'under_1000' | '1000_1800' | '1800_2600' | '2600_plus'
export type CleanType = 'standard' | 'deep' | 'moveout'
export type Frequency = 'one_time' | 'weekly' | 'biweekly' | 'monthly'

export interface PricingConfig {
  id: number
  base_price: number
  per_bedroom: number
  per_bathroom: number
  sqft_band_multipliers: Record<SqftBand, number>
  clean_type_multipliers: Record<CleanType, number>
  frequency_discounts: Record<Frequency, number>
}

export interface ServiceArea {
  id: number
  city: string
  zip_prefixes: string[]
  active: boolean
}

export interface QuoteInputs {
  bedrooms: Bedrooms
  bathrooms: Bathrooms
  sqftBand: SqftBand
  cleanType: CleanType
  frequency: Frequency
}

export interface ScheduleInputs {
  serviceDate: string // YYYY-MM-DD
  timeWindow: string
}

export interface DetailsInputs {
  customerName: string
  customerPhone: string
  customerEmail: string
  addressLine: string
  city: string
  zip: string
  entryNotes: string
  hasPets: boolean
}

export interface FunnelState {
  quote: QuoteInputs | null
  schedule: ScheduleInputs | null
  details: DetailsInputs | null
  quotedPrice: number | null
}

export interface BookingRecord {
  id: string
  status: 'pending_payment' | 'open' | 'cancelled'
  bedrooms: number
  bathrooms: number
  sqft_band: SqftBand
  clean_type: CleanType
  frequency: Frequency
  quoted_price: number
  service_date: string
  time_window: string
  customer_name: string
  address_line: string
  city: string
  zip: string
  entry_notes: string | null
  has_pets: boolean
  cancelled_at: string | null
  refund_amount: number | null
}
