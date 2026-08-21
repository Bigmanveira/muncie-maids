import type { Bathrooms, Bedrooms, CleanType, Frequency, SqftBand } from '../types'

export const BEDROOM_OPTIONS: { value: Bedrooms; label: string }[] = [
  { value: 'studio', label: 'Studio' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4+', label: '4+' },
]

export const BATHROOM_OPTIONS: { value: Bathrooms; label: string }[] = [
  { value: '1', label: '1' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: '2' },
  { value: '2.5+', label: '2.5+' },
]

export const SQFT_OPTIONS: { value: SqftBand; label: string }[] = [
  { value: 'under_1000', label: 'Under 1,000 sqft' },
  { value: '1000_1800', label: '1,000-1,800 sqft' },
  { value: '1800_2600', label: '1,800-2,600 sqft' },
  { value: '2600_plus', label: '2,600+ sqft' },
]

export const CLEAN_TYPE_OPTIONS: { value: CleanType; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'deep', label: 'First Time' },
  { value: 'moveout', label: 'Move-out' },
]

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'one_time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
]
