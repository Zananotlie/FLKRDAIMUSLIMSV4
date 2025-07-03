"use client"

interface PrayerTime {
  name: string
  time: string
  timestamp: number
  passed: boolean
  arabic: string
  kurdish: string
}

interface Location {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

// Prayer calculation using astronomical formulas
export function calculatePrayerTimes(latitude: number, longitude: number, date: Date = new Date()): PrayerTime[] {
  const times = calculateTimes(date, [latitude, longitude])

  const prayerNames = {
    fajr: { en: "Fajr", ar: "الفجر", ku: "بەیانی" },
    sunrise: { en: "Sunrise", ar: "الشروق", ku: "خۆرهەڵات" },
    dhuhr: { en: "Dhuhr", ar: "الظهر", ku: "نیوەڕۆ" },
    asr: { en: "Asr", ar: "العصر", ku: "عەسر" },
    maghrib: { en: "Maghrib", ar: "المغرب", ku: "ئاوابوون" },
    isha: { en: "Isha", ar: "العشاء", ku: "عیشا" },
  }

  const now = new Date()

  return Object.entries(times)
    .map(([key, time]) => {
      const [hours, minutes] = time.split(":").map(Number)
      const prayerDate = new Date(date)
      prayerDate.setHours(hours, minutes, 0, 0)

      return {
        name: prayerNames[key as keyof typeof prayerNames]?.en || key,
        time: formatTime(hours, minutes),
        timestamp: prayerDate.getTime(),
        passed: prayerDate.getTime() < now.getTime(),
        arabic: prayerNames[key as keyof typeof prayerNames]?.ar || key,
        kurdish: prayerNames[key as keyof typeof prayerNames]?.ku || key,
      }
    })
    .filter((prayer) => prayer.name !== "Sunrise") // Remove sunrise from main prayer times
}

function calculateTimes(date: Date, coords: [number, number]): { [key: string]: string } {
  const [lat, lng] = coords
  const timeZone = -(new Date().getTimezoneOffset() / 60)

  // Julian day calculation
  const jd = julianDay(date) - lng / (15 * 24)

  // Sun declination
  const decl = sunDeclination(jd)

  // Equation of time
  const eqt = equationOfTime(jd)

  // Prayer angle calculations
  const angles = {
    fajr: -18,
    sunrise: -0.833,
    dhuhr: 0,
    asr: (-1 * Math.atan(1 + Math.tan((Math.abs(lat - decl) * Math.PI) / 180)) * 180) / Math.PI,
    maghrib: -0.833,
    isha: -17,
  }

  const times: { [key: string]: string } = {}

  Object.entries(angles).forEach(([prayer, angle]) => {
    let time: number

    if (prayer === "dhuhr") {
      time = 12 - eqt / 60
    } else {
      const hourAngle =
        (Math.acos(
          (Math.sin((angle * Math.PI) / 180) - Math.sin(decl) * Math.sin((lat * Math.PI) / 180)) /
            (Math.cos(decl) * Math.cos((lat * Math.PI) / 180)),
        ) *
          180) /
        Math.PI /
        15

      if (prayer === "fajr" || prayer === "sunrise") {
        time = 12 - hourAngle - eqt / 60
      } else {
        time = 12 + hourAngle - eqt / 60
      }
    }

    // Adjust for timezone
    time += timeZone

    // Ensure time is within 24 hours
    if (time < 0) time += 24
    if (time >= 24) time -= 24

    times[prayer] = formatTimeFromDecimal(time)
  })

  return times
}

function julianDay(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const a = Math.floor((14 - month) / 12)
  const y = year - a
  const m = month + 12 * a - 3

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) +
    1721119
  )
}

function sunDeclination(jd: number): number {
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = (((357.528 + 0.9856003 * n) % 360) * Math.PI) / 180
  const lambda = ((L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI) / 180

  return (Math.asin(Math.sin((23.439 * Math.PI) / 180) * Math.sin(lambda)) * 180) / Math.PI
}

function equationOfTime(jd: number): number {
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = (((357.528 + 0.9856003 * n) % 360) * Math.PI) / 180
  const lambda = ((L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI) / 180

  const alpha = (Math.atan2(Math.cos((23.439 * Math.PI) / 180) * Math.sin(lambda), Math.cos(lambda)) * 180) / Math.PI
  const eqt = 4 * (L - alpha)

  return eqt
}

function formatTimeFromDecimal(time: number): string {
  const hours = Math.floor(time)
  const minutes = Math.floor((time - hours) * 60)
  return formatTime(hours, minutes)
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
}

export function getNextPrayer(prayerTimes: PrayerTime[]): PrayerTime | null {
  const now = Date.now()
  const upcomingPrayers = prayerTimes.filter((prayer) => prayer.timestamp > now)
  return upcomingPrayers.length > 0 ? upcomingPrayers[0] : null
}

export function getTimeUntilNextPrayer(nextPrayer: PrayerTime | null): string {
  if (!nextPrayer) return "00:00:00"

  const now = Date.now()
  const diff = nextPrayer.timestamp - now

  if (diff <= 0) return "00:00:00"

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}
