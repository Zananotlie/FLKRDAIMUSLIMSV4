"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Bell, Volume2, Calendar, MapPin, Clock, Sunrise, Sun, Sunset, Moon, Star, Compass, Timer } from "lucide-react"
import * as Switch from "@radix-ui/react-switch"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { calculatePrayerTimes, getNextPrayer, getTimeUntilNextPrayer } from "@/utils/prayerTimes"
import { saveOfflineData, getOfflineData } from "@/utils/offlineStorage"

const GlassCard = React.memo(({ children, className = "" }: any) => (
  <div
    className={`bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl relative overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

const PrayerTimeCard = React.memo(({ prayer, index, playAdhan, isNext }: any) => {
  const prayerIcons = {
    Fajr: Sunrise,
    Dhuhr: Sun,
    Asr: Sun,
    Maghrib: Sunset,
    Isha: Moon,
  }

  const PrayerIcon = prayerIcons[prayer.name as keyof typeof prayerIcons] || Clock

  return (
    <GlassCard
      className={`p-4 transition-all duration-500 ${
        prayer.passed ? "opacity-60" : isNext ? "ring-2 ring-blue-400 bg-blue-50/50" : ""
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              prayer.passed
                ? "bg-green-500 shadow-lg shadow-green-500/30"
                : isNext
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-500/40 animate-pulse"
                  : "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
            }`}
          >
            <PrayerIcon size={24} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gray-800 font-semibold text-lg">{prayer.name}</span>
              {isNext && <Timer size={16} className="text-blue-600 animate-spin" />}
            </div>
            <p className="text-gray-600 text-sm">{prayer.arabic}</p>
            <p className="text-gray-500 text-xs">{prayer.kurdish}</p>
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <span className="text-gray-700 font-mono text-lg font-semibold">
              {new Date(`2000-01-01 ${prayer.time}`).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {!prayer.passed && (
              <button
                onClick={() => playAdhan(prayer.name)}
                className="block mt-1 text-blue-600 hover:text-blue-800 transition-colors"
                title="Play Adhan"
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  )
})

PrayerTimeCard.displayName = "PrayerTimeCard"

export default function PrayerScreen({ appState, setAppState, t, playAdhan }: any) {
  const [prayerTimes, setPrayerTimes] = useState<any[]>([])
  const [nextPrayer, setNextPrayer] = useState<any>(null)
  const [timeUntilNext, setTimeUntilNext] = useState("00:00:00")
  const [loading, setLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<any>(null)

  // Get user location and calculate prayer times
  const initializePrayerTimes = useCallback(async () => {
    setLoading(true)

    try {
      // Try to get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const location = {
              latitude,
              longitude,
              city: "Current Location",
              country: "",
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }

            setCurrentLocation(location)

            // Calculate prayer times
            const times = calculatePrayerTimes(latitude, longitude)
            setPrayerTimes(times)

            // Find next prayer
            const next = getNextPrayer(times)
            setNextPrayer(next)

            // Save to offline storage
            saveOfflineData({ prayerTimes: times, location })

            setLoading(false)
          },
          (error) => {
            console.error("Geolocation error:", error)
            // Use offline data or default location
            const offlineData = getOfflineData()
            if (offlineData.prayerTimes.length > 0) {
              setPrayerTimes(offlineData.prayerTimes)
              setCurrentLocation(offlineData.location)
              const next = getNextPrayer(offlineData.prayerTimes)
              setNextPrayer(next)
            } else {
              // Default to a major city (e.g., Erbil, Kurdistan)
              const defaultLat = 36.1911
              const defaultLng = 44.0093
              const times = calculatePrayerTimes(defaultLat, defaultLng)
              setPrayerTimes(times)
              setCurrentLocation({
                latitude: defaultLat,
                longitude: defaultLng,
                city: "Erbil",
                country: "Kurdistan",
                timezone: "Asia/Baghdad",
              })
              const next = getNextPrayer(times)
              setNextPrayer(next)
            }
            setLoading(false)
          },
        )
      } else {
        // Geolocation not supported, use offline data or default
        const offlineData = getOfflineData()
        if (offlineData.prayerTimes.length > 0) {
          setPrayerTimes(offlineData.prayerTimes)
          setCurrentLocation(offlineData.location)
        }
        setLoading(false)
      }
    } catch (error) {
      console.error("Error initializing prayer times:", error)
      setLoading(false)
    }
  }, [])

  // Update time until next prayer every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (nextPrayer) {
        setTimeUntilNext(getTimeUntilNextPrayer(nextPrayer))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [nextPrayer])

  // Initialize on component mount
  useEffect(() => {
    initializePrayerTimes()
  }, [initializePrayerTimes])

  // Update next prayer when prayer times change
  useEffect(() => {
    if (prayerTimes.length > 0) {
      const next = getNextPrayer(prayerTimes)
      setNextPrayer(next)
    }
  }, [prayerTimes])

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-800">{t.prayerTimes}</h2>
        {currentLocation && (
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <MapPin size={16} />
            <span>
              {currentLocation.city}
              {currentLocation.country && `, ${currentLocation.country}`}
            </span>
          </div>
        )}
        <p className="text-gray-500 text-sm">بانگەکان بەدەنگی مەلاکان</p>
      </div>

      {/* Next Prayer Countdown */}
      {nextPrayer && (
        <GlassCard className="p-6 text-center bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800">{t.nextPrayer}</h3>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{nextPrayer.name}</h2>
          <p className="text-gray-600 mb-2">
            {nextPrayer.arabic} • {nextPrayer.kurdish}
          </p>
          <div className="text-4xl font-mono font-bold text-blue-600 mb-2">{timeUntilNext}</div>
          <p className="text-gray-500 text-sm">
            Prayer time:{" "}
            {new Date(`2000-01-01 ${nextPrayer.time}`).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </GlassCard>
      )}

      {/* Prayer Times */}
      {loading ? (
        <LoadingSkeleton lines={5} />
      ) : (
        <div className="space-y-4">
          {prayerTimes.map((prayer: any, index: number) => (
            <PrayerTimeCard
              key={prayer.name}
              prayer={prayer}
              index={index}
              playAdhan={playAdhan}
              isNext={nextPrayer && nextPrayer.name === prayer.name}
            />
          ))}
        </div>
      )}

      {/* Prayer Tools */}
      <div className="space-y-4">
        {/* Notification Controls */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-gray-600" size={20} />
              <div>
                <span className="text-gray-800 font-medium">{t.notifications}</span>
                <p className="text-gray-600 text-sm">Prayer time reminders</p>
              </div>
            </div>
            <Switch.Root
              checked={appState.notifications}
              onCheckedChange={(checked) => setAppState((prev: any) => ({ ...prev, notifications: checked }))}
              className="w-11 h-6 bg-gray-300 rounded-full relative data-[state=checked]:bg-blue-500 transition-colors"
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full transition-transform duration-100 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[22px] shadow-lg" />
            </Switch.Root>
          </div>
        </GlassCard>

        {/* Prayer Statistics */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="text-gray-600" size={20} />
              <div>
                <span className="text-gray-800 font-medium">{t.prayerTracker}</span>
                <p className="text-gray-600 text-sm">Track your daily prayers</p>
              </div>
            </div>
            <div className="flex gap-1">
              {prayerTimes.slice(0, 5).map((prayer: any, index: number) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${prayer.passed ? "bg-green-500" : "bg-gray-300"}`}
                  title={prayer.name}
                />
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Qibla Direction */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Compass className="text-gray-600" size={20} />
              <div>
                <span className="text-gray-800 font-medium">{t.qiblaDirection}</span>
                <p className="text-gray-600 text-sm">Direction to Kaaba</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-green-600">{appState.qiblaDirection}°</span>
              <p className="text-gray-500 text-xs">Northeast</p>
            </div>
          </div>
        </GlassCard>

        {/* Islamic Calendar */}
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="text-gray-600" size={20} />
              <div>
                <span className="text-gray-800 font-medium">{t.islamicCalendar}</span>
                <p className="text-gray-600 text-sm">
                  {appState.hijriDate ? (
                    <>
                      {appState.hijriDate.day} {appState.hijriDate.month.en} {appState.hijriDate.year} AH
                    </>
                  ) : (
                    "Islamic Date"
                  )}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
