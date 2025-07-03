"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Compass, MapPin, Navigation, Target } from "lucide-react"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { calculateQiblaDirection, getQiblaCompassDirection, getDistanceToKaaba } from "@/utils/qiblaCalculation"
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

export default function QiblaScreen({ appState, t }: any) {
  const [qiblaDirection, setQiblaDirection] = useState(195.0)
  const [compassDirection, setCompassDirection] = useState("NE")
  const [distanceToKaaba, setDistanceToKaaba] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deviceOrientation, setDeviceOrientation] = useState(0)

  // Calculate Qibla direction based on location
  const calculateQibla = useCallback((latitude: number, longitude: number) => {
    const direction = calculateQiblaDirection(latitude, longitude)
    const compassDir = getQiblaCompassDirection(direction)
    const distance = getDistanceToKaaba(latitude, longitude)

    setQiblaDirection(direction)
    setCompassDirection(compassDir)
    setDistanceToKaaba(distance)

    // Save to offline storage
    saveOfflineData({ qiblaDirection: direction })
  }, [])

  // Get user location and calculate Qibla
  const initializeQibla = useCallback(async () => {
    setLoading(true)

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            const location = {
              latitude,
              longitude,
              city: "Current Location",
              country: "",
            }

            setCurrentLocation(location)
            calculateQibla(latitude, longitude)
            setLoading(false)
          },
          (error) => {
            console.error("Geolocation error:", error)
            // Use offline data or default location
            const offlineData = getOfflineData()
            if (offlineData.location) {
              setCurrentLocation(offlineData.location)
              calculateQibla(offlineData.location.latitude, offlineData.location.longitude)
            } else {
              // Default to Erbil, Kurdistan
              const defaultLat = 36.1911
              const defaultLng = 44.0093
              setCurrentLocation({
                latitude: defaultLat,
                longitude: defaultLng,
                city: "Erbil",
                country: "Kurdistan",
              })
              calculateQibla(defaultLat, defaultLng)
            }
            setLoading(false)
          },
        )
      } else {
        // Use default location
        const defaultLat = 36.1911
        const defaultLng = 44.0093
        setCurrentLocation({
          latitude: defaultLat,
          longitude: defaultLng,
          city: "Erbil",
          country: "Kurdistan",
        })
        calculateQibla(defaultLat, defaultLng)
        setLoading(false)
      }
    } catch (error) {
      console.error("Error initializing Qibla:", error)
      setLoading(false)
    }
  }, [calculateQibla])

  // Handle device orientation for compass
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceOrientation(event.alpha)
      }
    }

    if (window.DeviceOrientationEvent) {
      window.addEventListener("deviceorientation", handleOrientation)
      return () => window.removeEventListener("deviceorientation", handleOrientation)
    }
  }, [])

  // Initialize on component mount
  useEffect(() => {
    initializeQibla()
  }, [initializeQibla])

  return (
    <div className="space-y-6 animate-in slide-in-from-left duration-500">
      <h2 className="text-3xl font-bold text-gray-800 text-center">{t.qiblaDirection}</h2>

      {loading ? (
        <LoadingSkeleton lines={1} height="h-72" />
      ) : (
        <>
          {/* Main Compass */}
          <GlassCard className="p-8">
            <div className="relative w-80 h-80 mx-auto">
              {/* Compass Background */}
              <div className="absolute inset-0 rounded-full border-4 border-white/30 bg-gradient-to-br from-white/10 to-transparent" />

              {/* Outer Ring with Degrees */}
              <div className="absolute inset-2 rounded-full border-2 border-white/20">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((degree) => (
                  <div
                    key={degree}
                    className="absolute w-1 h-6 bg-white/40"
                    style={{
                      top: "10px",
                      left: "50%",
                      transformOrigin: "50% 150px",
                      transform: `translateX(-50%) rotate(${degree}deg)`,
                    }}
                  />
                ))}
              </div>

              {/* Direction Markers */}
              <div className="absolute inset-8 rounded-full">
                {[
                  { dir: "N", angle: 0, color: "text-red-500" },
                  { dir: "E", angle: 90, color: "text-gray-600" },
                  { dir: "S", angle: 180, color: "text-gray-600" },
                  { dir: "W", angle: 270, color: "text-gray-600" },
                ].map(({ dir, angle, color }) => (
                  <div
                    key={dir}
                    className={`absolute font-bold text-xl ${color}`}
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                    }}
                  >
                    {dir}
                  </div>
                ))}
              </div>

              {/* Qibla Direction Indicator */}
              <div
                className="absolute inset-12 rounded-full flex items-center justify-center transform transition-transform duration-1000"
                style={{ transform: `rotate(${qiblaDirection - deviceOrientation}deg)` }}
              >
                <div className="w-2 h-24 bg-gradient-to-t from-green-600 to-green-400 rounded-full shadow-lg relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Target size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              {/* Center Compass */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
                <Compass size={32} className="text-white" />
              </div>

              {/* North Indicator */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-red-500 rounded-full shadow-lg" />
            </div>
          </GlassCard>

          {/* Qibla Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard className="p-6 text-center">
              <Navigation className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Direction</h3>
              <div className="text-3xl font-bold text-green-600 mb-1">{qiblaDirection.toFixed(1)}°</div>
              <p className="text-gray-600">{compassDirection}</p>
            </GlassCard>

            <GlassCard className="p-6 text-center">
              <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Distance to Kaaba</h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">{distanceToKaaba.toLocaleString()}</div>
              <p className="text-gray-600">kilometers</p>
            </GlassCard>
          </div>

          {/* Location Info */}
          {currentLocation && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <MapPin size={16} />
                <span>
                  {currentLocation.city}
                  {currentLocation.country && `, ${currentLocation.country}`}
                </span>
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                {currentLocation.latitude.toFixed(4)}°, {currentLocation.longitude.toFixed(4)}°
              </div>
            </GlassCard>
          )}

          {/* Instructions */}
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">How to Use</h3>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                  1
                </div>
                <p>Hold your device flat and level</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                  2
                </div>
                <p>Turn your body until the green arrow points to the top</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center font-bold">
                  3
                </div>
                <p>You are now facing the Qibla direction</p>
              </div>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  )
}
