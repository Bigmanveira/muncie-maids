import type { Bathrooms, Bedrooms, PricingConfig, QuoteInputs } from '../types'

export const BEDROOM_COUNT: Record<Bedrooms, number> = {
  studio: 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4+': 4,
}

export const BATHROOM_COUNT: Record<Bathrooms, number> = {
  '1': 1,
  '1.5': 1.5,
  '2': 2,
  '2.5+': 2.5,
}

const DURATION_CLEAN_TYPE_MULTIPLIER: Record<QuoteInputs['cleanType'], number> = {
  standard: 1.0,
  deep: 1.4,
  moveout: 1.6,
}

/** Rough on-site duration estimate for display only — never affects price. */
export function estimateDurationHours(inputs: QuoteInputs): number {
  const bedrooms = BEDROOM_COUNT[inputs.bedrooms]
  const bathrooms = BATHROOM_COUNT[inputs.bathrooms]
  const rawHours = (1.5 + bedrooms * 0.4 + bathrooms * 0.3) * DURATION_CLEAN_TYPE_MULTIPLIER[inputs.cleanType]
  return Math.round(rawHours * 2) / 2
}

export function calculatePrice(inputs: QuoteInputs, config: PricingConfig): number {
  const bedrooms = BEDROOM_COUNT[inputs.bedrooms]
  const bathrooms = BATHROOM_COUNT[inputs.bathrooms]

  const base =
    config.base_price + bedrooms * config.per_bedroom + bathrooms * config.per_bathroom

  const sqftMultiplier = config.sqft_band_multipliers[inputs.sqftBand]
  const cleanTypeMultiplier = config.clean_type_multipliers[inputs.cleanType]
  const discount = config.frequency_discounts[inputs.frequency]

  const beforeDiscount = base * sqftMultiplier * cleanTypeMultiplier
  const final = beforeDiscount * (1 - discount)

  return Math.round(final)
}
