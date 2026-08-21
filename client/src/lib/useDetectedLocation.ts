import { useCallback, useEffect, useState } from 'react'
import { findNearestTown, SERVICE_RADIUS_MILES } from './geolocation'

export const DEFAULT_LOCATION_LABEL = 'Serving Delaware County, IN'
export const DEFAULT_TOWN = 'Muncie'

function isStandalone(): boolean {
  // iOS PWAs (added to Home Screen) — geolocation is unreliable in this mode on iOS.
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

interface DetectedLocation {
  label: string
  /** Bare town name for copy like "{town} Trusted" — falls back to DEFAULT_TOWN when undetected. */
  town: string
  detecting: boolean
  detected: boolean
  /** Set only after a manual tap that failed — explains why, so it isn't a mystery. Null otherwise. */
  hint: string | null
  /** Manually (re)request the browser's location. iOS Safari — especially installed/standalone PWAs —
   * often silently ignores a geolocation request that wasn't triggered by a direct tap, so the automatic
   * attempt on mount isn't enough there; exposing this lets the location pill retry on tap. */
  detect: () => void
}

/** Auto-detects the visitor's town via browser geolocation; falls back silently if denied/unavailable. */
export function useDetectedLocation(): DetectedLocation {
  const [state, setState] = useState<Omit<DetectedLocation, 'detect' | 'hint'>>({
    label: DEFAULT_LOCATION_LABEL,
    town: DEFAULT_TOWN,
    detecting: false,
    detected: false,
  })
  const [hint, setHint] = useState<string | null>(null)

  const run = useCallback((manual: boolean) => {
    if (!navigator.geolocation) {
      if (manual) setHint("This browser doesn't support location detection.")
      return
    }

    setState((s) => ({ ...s, detecting: true }))
    if (manual) setHint(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const { town, distanceMiles } = findNearestTown(latitude, longitude)
        if (distanceMiles <= SERVICE_RADIUS_MILES) {
          setState({ label: `Near ${town.name}, IN`, town: town.name, detecting: false, detected: true })
          setHint(null)
        } else {
          setState({ label: DEFAULT_LOCATION_LABEL, town: DEFAULT_TOWN, detecting: false, detected: false })
          if (manual) setHint("You're outside our service area, so we're showing the general area instead.")
        }
      },
      (error) => {
        setState({ label: DEFAULT_LOCATION_LABEL, town: DEFAULT_TOWN, detecting: false, detected: false })
        if (!manual) return

        if (error.code === error.PERMISSION_DENIED) {
          setHint(
            isStandalone()
              ? "Location is off for this app. On iPhone, open this link in Safari instead of the installed app, or allow location in Settings."
              : 'Location access is turned off for this site. Enable it in your phone Settings, then try again.',
          )
        } else if (error.code === error.TIMEOUT) {
          setHint("Couldn't get your location in time. Try again.")
        } else {
          setHint("Couldn't detect your location right now.")
        }
      },
      { timeout: 8000, maximumAge: 10 * 60 * 1000 },
    )
  }, [])

  const detect = useCallback(() => run(true), [run])

  useEffect(() => {
    run(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...state, hint, detect }
}
