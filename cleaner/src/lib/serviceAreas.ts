import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/** Towns a cleaner can select — same set clients can book in. */
export function useTowns() {
  const [towns, setTowns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('service_areas')
      .select('city')
      .eq('active', true)
      .order('city')
      .then(({ data }) => {
        setTowns([...new Set((data ?? []).map((row) => row.city as string))])
        setLoading(false)
      })
  }, [])

  return { towns, loading }
}

export const SERVICE_OPTIONS = [
  { value: 'standard', label: 'Standard Clean' },
  { value: 'deep', label: 'First Time Clean' },
  { value: 'moveout', label: 'Move-out Clean' },
] as const
