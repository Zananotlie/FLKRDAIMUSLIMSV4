"use client"

interface OfflineData {
  prayerTimes: any[]
  qiblaDirection: number
  location: any
  hijriDate: any
  dailyVerse: any
  dailyHadith: any
  quranSurahs: any[]
  kurdishTafsir: { [key: string]: any }
  lastUpdated: number
}

const STORAGE_KEY = "flkrd_offline_data"
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function saveOfflineData(data: Partial<OfflineData>): void {
  try {
    const existing = getOfflineData()
    const updated = {
      ...existing,
      ...data,
      lastUpdated: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("Error saving offline data:", error)
  }
}

export function getOfflineData(): OfflineData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      // Check if data is still valid
      if (Date.now() - data.lastUpdated < CACHE_DURATION) {
        return data
      }
    }
  } catch (error) {
    console.error("Error loading offline data:", error)
  }

  // Return default data
  return {
    prayerTimes: [],
    qiblaDirection: 195.0,
    location: null,
    hijriDate: null,
    dailyVerse: null,
    dailyHadith: null,
    quranSurahs: [],
    kurdishTafsir: {},
    lastUpdated: 0,
  }
}

export function clearOfflineData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error("Error clearing offline data:", error)
  }
}

export function isDataFresh(): boolean {
  const data = getOfflineData()
  return Date.now() - data.lastUpdated < CACHE_DURATION
}
