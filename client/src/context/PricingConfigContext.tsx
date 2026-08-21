import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEFAULT_PRICING_CONFIG } from '../lib/defaultPricingConfig'
import type { PricingConfig } from '../types'

interface PricingConfigContextValue {
  config: PricingConfig | null
  loading: boolean
  error: string | null
}

const PricingConfigContext = createContext<PricingConfigContextValue>({
  config: null,
  loading: true,
  error: null,
})

export function PricingConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setConfig(DEFAULT_PRICING_CONFIG)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('pricing_config')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setConfig(data as PricingConfig)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PricingConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </PricingConfigContext.Provider>
  )
}

export function usePricingConfig() {
  return useContext(PricingConfigContext)
}
