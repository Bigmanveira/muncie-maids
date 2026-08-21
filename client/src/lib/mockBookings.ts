import type { BookingRecord } from '../types'

/** Sample data so My Bookings is testable end-to-end before the backend is connected. */
export function seedMockBookings(): BookingRecord[] {
  const today = new Date()
  const dateOffset = (days: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return [
    {
      id: 'mock-1',
      status: 'open',
      bedrooms: 3,
      bathrooms: 2,
      sqft_band: '1000_1800',
      clean_type: 'standard',
      frequency: 'biweekly',
      quoted_price: 137,
      service_date: dateOffset(5),
      time_window: 'Mid-day',
      customer_name: 'Jane Doe',
      address_line: '1200 W University Ave',
      city: 'Muncie',
      zip: '47306',
      entry_notes: 'Garage code is 1234.',
      has_pets: true,
      cancelled_at: null,
      refund_amount: null,
    },
    {
      id: 'mock-2',
      status: 'open',
      bedrooms: 4,
      bathrooms: 2.5,
      sqft_band: '1800_2600',
      clean_type: 'deep',
      frequency: 'one_time',
      quoted_price: 214,
      service_date: dateOffset(14),
      time_window: 'Morning',
      customer_name: 'Jane Doe',
      address_line: '410 N Walnut St',
      city: 'Yorktown',
      zip: '47396',
      entry_notes: null,
      has_pets: false,
      cancelled_at: null,
      refund_amount: null,
    },
    {
      id: 'mock-3',
      status: 'cancelled',
      bedrooms: 2,
      bathrooms: 1,
      sqft_band: 'under_1000',
      clean_type: 'standard',
      frequency: 'monthly',
      quoted_price: 98,
      service_date: dateOffset(-3),
      time_window: 'Afternoon',
      customer_name: 'Jane Doe',
      address_line: '88 Elm St',
      city: 'Muncie',
      zip: '47303',
      entry_notes: null,
      has_pets: false,
      cancelled_at: dateOffset(-5),
      refund_amount: 98,
    },
  ]
}
