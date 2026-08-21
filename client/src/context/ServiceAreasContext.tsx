import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { DEFAULT_SERVICE_AREAS } from '../lib/defaultPricingConfig'
import type { ServiceArea } from '../types'

interface ServiceAreasContextValue {
  areas: ServiceArea[]
  loading: boolean
  error: string | null
}

const ServiceAreasContext = createContext<ServiceAreasContextValue>({
  areas: [],
  loading: true,
  error: null,
})

export function ServiceAreasProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<ServiceArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAreas(DEFAULT_SERVICE_AREAS)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('service_areas')
      .select('*')
      .eq('active', true)
      .then(({ data, error: fetchError }) => {
        if (cancelled) return
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setAreas((data ?? []) as ServiceArea[])
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return <ServiceAreasContext.Provider value={{ areas, loading, error }}>{children}</ServiceAreasContext.Provider>
}

export function useServiceAreas() {
  return useContext(ServiceAreasContext)
}

export function findAreaForZip(areas: ServiceArea[], zip: string): ServiceArea | null {
  return areas.find((area) => area.zip_prefixes.includes(zip)) ?? null
}
