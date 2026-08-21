/**
 * Holds captured "before" photos between the /photos funnel step and the moment
 * Pay.tsx obtains a real bookingId+token. A plain module-level variable (not
 * FunnelContext/sessionStorage) because Files can't survive the JSON round-trip
 * FunnelState goes through on every change — this stays in-memory for the tab's
 * current session only, lost on refresh, which is fine since photos are optional.
 */
let files: File[] = []

export function setPendingPhotos(next: File[]) {
  files = next
}

export function takePendingPhotos(): File[] {
  const current = files
  files = []
  return current
}

export function clearPendingPhotos() {
  files = []
}
