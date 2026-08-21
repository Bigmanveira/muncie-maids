export interface ServiceTown {
  name: string
  lat: number
  lng: number
}

/** Approximate town-center coordinates for the four served Delaware County towns. */
export const SERVICE_TOWNS: ServiceTown[] = [
  { name: 'Muncie', lat: 40.1934, lng: -85.3863 },
  { name: 'Yorktown', lat: 40.167, lng: -85.4913 },
  { name: 'Gaston', lat: 40.2989, lng: -85.4766 },
  { name: 'Albany', lat: 40.3081, lng: -85.2416 },
]

/** Generous radius covering all of Delaware County from any of its town centers. */
export const SERVICE_RADIUS_MILES = 15

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_MILES = 3958.8
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function findNearestTown(lat: number, lng: number): { town: ServiceTown; distanceMiles: number } {
  let nearest = SERVICE_TOWNS[0]
  let nearestDistance = haversineMiles(lat, lng, nearest.lat, nearest.lng)

  for (const town of SERVICE_TOWNS.slice(1)) {
    const distance = haversineMiles(lat, lng, town.lat, town.lng)
    if (distance < nearestDistance) {
      nearest = town
      nearestDistance = distance
    }
  }

  return { town: nearest, distanceMiles: nearestDistance }
}
