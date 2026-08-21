/** Opens the device's native maps app when possible, Google Maps in browser otherwise. */
export function mapsUrl(addressLine: string, city: string, zip: string): string {
  const query = encodeURIComponent(`${addressLine}, ${city}, IN ${zip}`)
  const isApple =
    /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 0
  return isApple ? `https://maps.apple.com/?daddr=${query}` : `https://www.google.com/maps/search/?api=1&query=${query}`
}
