import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { DetailsInputs, FunnelState, QuoteInputs, ScheduleInputs } from '../types'
import { clearPendingPhotos } from '../lib/pendingPhotos'

const STORAGE_KEY = 'muncie-maids-funnel'

const EMPTY_STATE: FunnelState = {
  quote: null,
  schedule: null,
  details: null,
  quotedPrice: null,
}

function loadState(): FunnelState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    return { ...EMPTY_STATE, ...JSON.parse(raw) }
  } catch {
    return EMPTY_STATE
  }
}

interface FunnelContextValue {
  state: FunnelState
  setQuote: (quote: QuoteInputs, quotedPrice: number) => void
  setSchedule: (schedule: ScheduleInputs) => void
  setDetails: (details: DetailsInputs) => void
  reset: () => void
}

const FunnelContext = createContext<FunnelContextValue | null>(null)

export function FunnelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FunnelState>(loadState)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setQuote = (quote: QuoteInputs, quotedPrice: number) =>
    setState((prev) => ({ ...prev, quote, quotedPrice }))

  const setSchedule = (schedule: ScheduleInputs) =>
    setState((prev) => ({ ...prev, schedule }))

  const setDetails = (details: DetailsInputs) =>
    setState((prev) => ({ ...prev, details }))

  const reset = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setState(EMPTY_STATE)
    clearPendingPhotos()
  }

  return (
    <FunnelContext.Provider value={{ state, setQuote, setSchedule, setDetails, reset }}>
      {children}
    </FunnelContext.Provider>
  )
}

export function useFunnel() {
  const ctx = useContext(FunnelContext)
  if (!ctx) throw new Error('useFunnel must be used within FunnelProvider')
  return ctx
}

/** Earliest funnel route the given state has NOT completed yet. */
export function firstIncompleteRoute(state: FunnelState): string | null {
  if (!state.quote) return '/quote'
  if (!state.schedule) return '/schedule'
  if (!state.details) return '/details'
  return null
}
