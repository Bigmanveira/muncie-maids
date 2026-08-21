import { createContext, useContext, useState, type ReactNode } from 'react'
import { seedMockBookings } from '../lib/mockBookings'
import type { BookingRecord } from '../types'

const STORAGE_KEY = 'muncie-maids-mock-bookings'

function loadBookings(): BookingRecord[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seed
  }
  return seedMockBookings()
}

interface MockBookingsContextValue {
  bookings: BookingRecord[]
  getBooking: (id: string) => BookingRecord | undefined
  cancelBooking: (id: string) => { refundAmount: number; refundPercent: number }
  addBooking: (booking: BookingRecord) => void
}

const MockBookingsContext = createContext<MockBookingsContextValue | null>(null)

export function MockBookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingRecord[]>(loadBookings)

  function persist(next: BookingRecord[]) {
    setBookings(next)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function getBooking(id: string) {
    return bookings.find((b) => b.id === id)
  }

  function addBooking(booking: BookingRecord) {
    persist([booking, ...bookings])
  }

  function cancelBooking(id: string) {
    const booking = bookings.find((b) => b.id === id)
    if (!booking) return { refundAmount: 0, refundPercent: 0 }

    const [y, m, d] = booking.service_date.split('-').map(Number)
    const visit = new Date(y, m - 1, d)
    const hoursUntil = (visit.getTime() - Date.now()) / (1000 * 60 * 60)
    const refundPercent = hoursUntil >= 24 ? 100 : 50
    const refundAmount = Math.round(booking.quoted_price * (refundPercent / 100) * 100) / 100

    persist(
      bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled', cancelled_at: new Date().toISOString(), refund_amount: refundAmount } : b,
      ),
    )
    return { refundAmount, refundPercent }
  }

  return (
    <MockBookingsContext.Provider value={{ bookings, getBooking, cancelBooking, addBooking }}>
      {children}
    </MockBookingsContext.Provider>
  )
}

export function useMockBookings() {
  const ctx = useContext(MockBookingsContext)
  if (!ctx) throw new Error('useMockBookings must be used within MockBookingsProvider')
  return ctx
}
