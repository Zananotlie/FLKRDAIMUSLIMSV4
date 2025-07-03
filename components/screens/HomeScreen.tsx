"use client"

import React from "react"
import { MapPin, Volume2, Clock, Compass, BookOpen, RotateCcw, Heart, Quote } from "lucide-react"
import * as Progress from "@radix-ui/react-progress"
import { Button } from "@/components/ui/button"

const GlassCard = React.memo(({ children, className = "", interactive = false, onClick }: any) => (
  <div
    onClick={onClick}
    className={`
      bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 
      shadow-2xl relative overflow-hidden
      ${interactive ? "cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/90 active:scale-95" : ""}
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

export default function HomeScreen({ appState, setAppState, t }: any) {
  // Add default values to prevent undefined errors
  const safeT = t || {
    greeting: "Assalamu Alaikum",
    welcome: "Welcome to FLKRD Muslims",
    nextPrayer: "Next Prayer",
    dailyAyah: "Daily Ayah",
    quickAccess: "Quick Access",
    islamicTools: "Islamic Tools",
    prayer: "Prayer",
    prayerTimes: "Prayer Times",
    qibla: "Qibla",
    qiblaDirection: "Qibla Direction",
    quran: "Quran",
    readQuran: "Read Quran",
    zikr: "Zikr",
    digitalTasbeeh: "Digital Tasbeeh",
    hadith: "Hadith",
    islamicQuotes: "Islamic Quotes",
    community: "Community",
    islamicCommunity: "Islamic Community",
  }

  const safeAppState = appState || {
    currentTime: new Date(),
    hijriDate: null,
    location: null,
    nextPrayer: null,
    dailyVerse: null,
    language: "en",
  }

  const quickAccessItems = [
    {
      screen: "prayer",
      icon: Clock,
      label: safeT.prayer,
      color: "from-green-500 to-emerald-500",
      description: safeT.prayerTimes,
    },
    {
      screen: "qibla",
      icon: Compass,
      label: safeT.qibla,
      color: "from-blue-500 to-cyan-500",
      description: safeT.qiblaDirection,
    },
    {
      screen: "quran",
      icon: BookOpen,
      label: safeT.quran,
      color: "from-purple-500 to-pink-500",
      description: safeT.readQuran,
    },
    {
      screen: "zikr",
      icon: RotateCcw,
      label: safeT.zikr,
      color: "from-orange-500 to-red-500",
      description: safeT.digitalTasbeeh,
    },
  ]

  const islamicTools = [
    {
      screen: "hadith",
      icon: Quote,
      label: safeT.hadith,
      color: "from-indigo-500 to-purple-500",
      description: safeT.islamicQuotes,
    },
    {
      screen: "community",
      icon: Heart,
      label: safeT.community,
      color: "from-pink-500 to-rose-500",
      description: safeT.islamicCommunity,
    },
  ]

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
      {/* Welcome Section */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          {safeT.greeting}
        </h1>
        <p className="text-2xl font-semibold text-gray-700">{safeT.welcome}</p>
        <div className="space-y-2">
          <p className="text-gray-600 text-lg">
            {safeAppState.currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          {safeAppState.hijriDate && (
            <p className="text-gray-500">
              {safeAppState.hijriDate.day} {safeAppState.hijriDate.month.en} {safeAppState.hijriDate.year} AH
            </p>
          )}
          {safeAppState.location && (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <MapPin size={16} className="animate-pulse" />
              <span>
                {safeAppState.location.city}, {safeAppState.location.country}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Next Prayer Card */}
      {safeAppState.nextPrayer && (
        <GlassCard className="p-6 text-center">
          <h3 className="text-gray-600 mb-2">{safeT.nextPrayer}</h3>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{safeAppState.nextPrayer.name}</h2>
          {safeAppState.language === "ar" && <p className="text-gray-500 mb-3">{safeAppState.nextPrayer.arabic}</p>}
          {(safeAppState.language === "sorani" || safeAppState.language === "badini") &&
            safeAppState.nextPrayer.kurdish && <p className="text-gray-500 mb-3">{safeAppState.nextPrayer.kurdish}</p>}
          <div className="text-3xl font-mono font-bold text-blue-600 mb-4">{safeAppState.nextPrayer.timeRemaining}</div>
          <Progress.Root className="relative overflow-hidden bg-gray-200 rounded-full w-full h-3">
            <Progress.Indicator
              className="bg-gradient-to-r from-blue-500 to-purple-500 w-full h-full transition-transform duration-300 ease-out rounded-full"
              style={{ transform: `translateX(-${Math.random() * 30}%)` }}
            />
          </Progress.Root>
        </GlassCard>
      )}

      {/* Daily Ayah */}
      {safeAppState.dailyVerse && (
        <GlassCard className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">{safeT.dailyAyah}</h3>
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Volume2 size={16} />
            </Button>
          </div>
          <p className="text-gray-800 text-right mb-3 text-xl leading-relaxed arabic-text">
            {safeAppState.dailyVerse.text}
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">{safeAppState.dailyVerse.translation}</p>
        </GlassCard>
      )}

      {/* Quick Access Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 text-center">{safeT.quickAccess}</h3>
        <div className="grid grid-cols-2 gap-4">
          {quickAccessItems.map((item, index) => (
            <GlassCard
              key={item.screen}
              interactive
              onClick={() => setAppState && setAppState((prev: any) => ({ ...prev, currentScreen: item.screen }))}
              className="p-6 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}
              >
                <item.icon size={28} className="text-white" />
              </div>
              <p className="text-gray-800 font-semibold text-center mb-1">{item.label}</p>
              <p className="text-gray-600 text-xs text-center">{item.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Islamic Tools Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 text-center">{safeT.islamicTools}</h3>
        <div className="grid grid-cols-2 gap-4">
          {islamicTools.map((item, index) => (
            <GlassCard
              key={item.screen}
              interactive
              onClick={() => setAppState && setAppState((prev: any) => ({ ...prev, currentScreen: item.screen }))}
              className="p-6 group"
              style={{ animationDelay: `${(index + 4) * 100}ms` }}
            >
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}
              >
                <item.icon size={28} className="text-white" />
              </div>
              <p className="text-gray-800 font-semibold text-center mb-1">{item.label}</p>
              <p className="text-gray-600 text-xs text-center">{item.description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  )
}
