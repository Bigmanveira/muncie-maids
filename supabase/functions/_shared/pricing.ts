// Mirrors client/src/lib/pricing.ts calculatePrice(). Keep both in sync if the
// formula changes — this copy is what actually gets charged; the client copy
// is only for the live-updating quote UI.

export interface PricingConfig {
  base_price: number
  per_bedroom: number
  per_bathroom: number
  sqft_band_multipliers: Record<string, number>
  clean_type_multipliers: Record<string, number>
  frequency_discounts: Record<string, number>
}

export interface QuoteInputs {
  bedrooms: 'studio' | '1' | '2' | '3' | '4+'
  bathrooms: '1' | '1.5' | '2' | '2.5+'
  sqftBand: string
  cleanType: string
  frequency: string
}

export const BEDROOM_COUNT: Record<QuoteInputs['bedrooms'], number> = {
  studio: 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4+': 4,
}

export const BATHROOM_COUNT: Record<QuoteInputs['bathrooms'], number> = {
  '1': 1,
  '1.5': 1.5,
  '2': 2,
  '2.5+': 2.5,
}

export function calculatePrice(inputs: QuoteInputs, config: PricingConfig): number {
  const bedrooms = BEDROOM_COUNT[inputs.bedrooms]
  const bathrooms = BATHROOM_COUNT[inputs.bathrooms]

  const base = config.base_price + bedrooms * config.per_bedroom + bathrooms * config.per_bathroom

  const sqftMultiplier = config.sqft_band_multipliers[inputs.sqftBand]
  const cleanTypeMultiplier = config.clean_type_multipliers[inputs.cleanType]
  const discount = config.frequency_discounts[inputs.frequency]

  if (sqftMultiplier == null || cleanTypeMultiplier == null || discount == null) {
    throw new Error('Unknown quote input value')
  }

  const beforeDiscount = base * sqftMultiplier * cleanTypeMultiplier
  const final = beforeDiscount * (1 - discount)

  return Math.round(final)
}
