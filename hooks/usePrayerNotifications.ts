"use client"

import { useCallback } from "react"

export function usePrayerNotifications() {
  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      return permission === "granted"
    }
    return false
  }, [])

  const scheduleNotification = useCallback((prayerName: string, timestamp: number, message: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      const now = Date.now()
      const delay = timestamp - now

      if (delay > 0) {
        setTimeout(() => {
          new Notification(`Prayer Time: ${prayerName}`, {
            body: message,
            icon: "/icon-192x192.png",
            badge: "/icon-192x192.png",
            tag: `prayer-${prayerName}`,
            requireInteraction: true,
            actions: [
              {
                action: "dismiss",
                title: "Dismiss",
              },
            ],
          })

          // Play notification sound
          try {
            const audio = new Audio("/notification.mp3")
            audio.volume = 0.5
            audio.play().catch(() => {
              // Fallback to system notification sound
            })
          } catch (error) {
            console.log("Notification sound not available")
          }
        }, delay)
      }
    }
  }, [])

  const playAdhan = useCallback(async (prayerName: string) => {
    try {
      // Different Adhan sounds for different prayers
      const adhanFiles = {
        Fajr: "/adhan-fajr.mp3",
        Dhuhr: "/adhan-regular.mp3",
        Asr: "/adhan-regular.mp3",
        Maghrib: "/adhan-regular.mp3",
        Isha: "/adhan-regular.mp3",
      }

      const audioFile = adhanFiles[prayerName as keyof typeof adhanFiles] || "/adhan-regular.mp3"
      const audio = new Audio(audioFile)
      audio.volume = 0.8
      await audio.play()

      // Show visual notification
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(`🕌 ${prayerName} Prayer Time`, {
          body: `بانگەکان بەدەنگی مەلاکان - It's time for ${prayerName} prayer`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: `adhan-${prayerName}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        })
      }

      // Vibrate if supported
      if ("vibrate" in navigator) {
        navigator.vibrate([1000, 500, 1000, 500, 1000])
      }
    } catch (error) {
      console.log("Could not play Adhan:", error)
    }
  }, [])

  return {
    requestPermission,
    scheduleNotification,
    playAdhan,
  }
}
