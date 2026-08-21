import type { PricingConfig } from '../types'

/**
 * DEV FALLBACK ONLY — mirrors supabase/seed.sql placeholder values so the
 * app is usable before a real Supabase project is wired up. Never used
 * once VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set. See DECISIONS.md.
 */
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  id: 1,
  base_price: 59,
  per_bedroom: 14,
  per_bathroom: 9,
  sqft_band_multipliers: {
    under_1000: 1.0,
    '1000_1800': 1.15,
    '1800_2600': 1.35,
    '2600_plus': 1.6,
  },
  clean_type_multipliers: {
    standard: 1.0,
    deep: 1.5,
    moveout: 1.75,
  },
  frequency_discounts: {
    one_time: 0,
    weekly: 0.2,
    biweekly: 0.15,
    monthly: 0.1,
  },
}

export const DEFAULT_SERVICE_AREAS = [
  { id: 1, city: 'Muncie', zip_prefixes: ['47303', '47304', '47305', '47306', '47307', '47308'], active: true },
  { id: 2, city: 'Yorktown', zip_prefixes: ['47396'], active: true },
  { id: 3, city: 'Gaston', zip_prefixes: ['47342'], active: true },
  { id: 4, city: 'Albany', zip_prefixes: ['47320'], active: true },
]
