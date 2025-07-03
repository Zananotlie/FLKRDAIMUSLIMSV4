"use client"

// Kaaba coordinates
const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

export function calculateQiblaDirection(latitude: number, longitude: number): number {
  // Convert degrees to radians
  const lat1 = (latitude * Math.PI) / 180
  const lng1 = (longitude * Math.PI) / 180
  const lat2 = (KAABA_LAT * Math.PI) / 180
  const lng2 = (KAABA_LNG * Math.PI) / 180

  // Calculate the difference in longitude
  const dLng = lng2 - lng1

  // Calculate the bearing using the formula
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  // Calculate the bearing in radians
  let bearing = Math.atan2(y, x)

  // Convert to degrees
  bearing = (bearing * 180) / Math.PI

  // Normalize to 0-360 degrees
  bearing = (bearing + 360) % 360

  return Math.round(bearing * 10) / 10 // Round to 1 decimal place
}

export function getQiblaCompassDirection(qiblaAngle: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ]

  const index = Math.round(qiblaAngle / 22.5) % 16
  return directions[index]
}

export function getDistanceToKaaba(latitude: number, longitude: number): number {
  const R = 6371 // Earth's radius in kilometers

  const lat1 = (latitude * Math.PI) / 180
  const lng1 = (longitude * Math.PI) / 180
  const lat2 = (KAABA_LAT * Math.PI) / 180
  const lng2 = (KAABA_LNG * Math.PI) / 180

  const dLat = lat2 - lat1
  const dLng = lng2 - lng1

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}
