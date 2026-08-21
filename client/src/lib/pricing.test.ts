import { describe, expect, it } from 'vitest'
import { calculatePrice } from './pricing'
import type { PricingConfig } from '../types'

const config: PricingConfig = {
  id: 1,
  base_price: 60,
  per_bedroom: 15,
  per_bathroom: 10,
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

describe('calculatePrice', () => {
  it('computes a typical 3bd/2ba standard one-time clean in the expected range', () => {
    const price = calculatePrice(
      { bedrooms: '3', bathrooms: '2', sqftBand: '1000_1800', cleanType: 'standard', frequency: 'one_time' },
      config,
    )
    expect(price).toBeGreaterThanOrEqual(120)
    expect(price).toBeLessThanOrEqual(180)
  })

  it('applies bedroom and bathroom increments additively before multipliers', () => {
    const base = calculatePrice(
      { bedrooms: 'studio', bathrooms: '1', sqftBand: 'under_1000', cleanType: 'standard', frequency: 'one_time' },
      config,
    )
    const withExtras = calculatePrice(
      { bedrooms: '2', bathrooms: '2', sqftBand: 'under_1000', cleanType: 'standard', frequency: 'one_time' },
      config,
    )
    expect(withExtras).toBeGreaterThan(base)
  })

  it('applies the sqft band multiplier', () => {
    const small = calculatePrice(
      { bedrooms: '2', bathrooms: '1', sqftBand: 'under_1000', cleanType: 'standard', frequency: 'one_time' },
      config,
    )
    const large = calculatePrice(
      { bedrooms: '2', bathrooms: '1', sqftBand: '2600_plus', cleanType: 'standard', frequency: 'one_time' },
      config,
    )
    expect(large).toBeGreaterThan(small)
  })

  it('applies the clean type multiplier (deep > standard, moveout > deep)', () => {
    const inputs = { bedrooms: '2', bathrooms: '1', sqftBand: '1000_1800', frequency: 'one_time' } as const
    const standard = calculatePrice({ ...inputs, cleanType: 'standard' }, config)
    const deep = calculatePrice({ ...inputs, cleanType: 'deep' }, config)
    const moveout = calculatePrice({ ...inputs, cleanType: 'moveout' }, config)
    expect(deep).toBeGreaterThan(standard)
    expect(moveout).toBeGreaterThan(deep)
  })

  it('applies frequency discounts (weekly cheapest, one_time full price)', () => {
    const inputs = { bedrooms: '2', bathrooms: '1', sqftBand: '1000_1800', cleanType: 'standard' } as const
    const oneTime = calculatePrice({ ...inputs, frequency: 'one_time' }, config)
    const monthly = calculatePrice({ ...inputs, frequency: 'monthly' }, config)
    const biweekly = calculatePrice({ ...inputs, frequency: 'biweekly' }, config)
    const weekly = calculatePrice({ ...inputs, frequency: 'weekly' }, config)
    expect(oneTime).toBeGreaterThan(monthly)
    expect(monthly).toBeGreaterThan(biweekly)
    expect(biweekly).toBeGreaterThan(weekly)
  })

  it('rounds to a whole dollar', () => {
    const price = calculatePrice(
      { bedrooms: '1', bathrooms: '1', sqftBand: 'under_1000', cleanType: 'standard', frequency: 'biweekly' },
      config,
    )
    expect(Number.isInteger(price)).toBe(true)
  })
})
