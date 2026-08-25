/** Opens the device's native maps app when possible, Google Maps in browser otherwise. */
function isAppleDevice(): boolean {
  return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0
}

export function mapsUrl(addressLine: string, city: string, zip: string): string {
  const query = encodeURIComponent(`${addressLine}, ${city}, IN ${zip}`)
  return isAppleDevice()
    ? `https://maps.apple.com/?daddr=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`
}

/** Turn-by-turn directions to the job — launches navigation in the native
 * maps app (Apple Maps on iPhone, Google Maps elsewhere) with the cleaning
 * location as the destination. */
export function directionsUrl(addressLine: string, city: string, zip: string): string {
  const dest = encodeURIComponent(`${addressLine}, ${city}, IN ${zip}`)
  return isAppleDevice()
    ? `https://maps.apple.com/?daddr=${dest}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`
}
