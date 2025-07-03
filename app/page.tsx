"use client"

import React from "react"
import type { ReactNode } from "react"
import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react"
import {
  Home,
  Clock,
  Compass,
  BookOpen,
  RotateCcw,
  Users,
  FileText,
  Settings,
  Wifi,
  WifiOff,
  Battery,
  Signal,
} from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { useApiCache } from "@/hooks/useApiCache"
import { useSupabase } from "@/hooks/useSupabase"
import { useAI } from "@/hooks/useAI"
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { setCachedData } from "@/utils/cacheUtils"

// Lazy load screen components for optimal performance
const HomeScreen = lazy(() => import("@/components/screens/HomeScreen"))
const PrayerScreen = lazy(() => import("@/components/screens/PrayerScreen"))
const QiblaScreen = lazy(() => import("@/components/screens/QiblaScreen"))
const QuranScreen = lazy(() => import("@/components/screens/QuranScreen"))
const ZikrScreen = lazy(() => import("@/components/screens/ZikrScreen"))
const CommunityScreen = lazy(() => import("@/components/screens/CommunityScreen"))
const HadithScreen = lazy(() => import("@/components/screens/HadithScreen"))
const SettingsScreen = lazy(() => import("@/components/screens/SettingsScreen"))

type Screen = "home" | "prayer" | "qibla" | "quran" | "zikr" | "community" | "hadith" | "settings"
type Language = "en" | "ar" | "sorani" | "badini"
type Theme = "dark" | "light"

interface PrayerTime {
  name: string
  time: string
  timestamp: number
  passed: boolean
  arabic: string
  kurdish?: string
}

interface LocationData {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

interface HijriDate {
  date: string
  day: string
  month: { number: number; en: string; ar: string }
  year: string
  weekday: { en: string; ar: string }
}

interface QuranVerse {
  number: number
  text: string
  translation: string
  audio: string
  kurdishTafsir?: string
}

interface IslamicQuote {
  text: string
  source: string
  arabic?: string
  kurdish?: string
}

interface AppState {
  currentScreen: Screen
  language: Language
  theme: Theme
  zikrCount: number
  zikrType: "subhanallah" | "alhamdulillah" | "allahuakbar"
  showChat: boolean
  currentTime: Date
  qiblaDirection: number
  prayerTimes: PrayerTime[]
  nextPrayer: { name: string; timeRemaining: string; arabic: string; kurdish?: string } | null
  location: LocationData | null
  hijriDate: HijriDate | null
  dailyVerse: QuranVerse | null
  dailyHadith: IslamicQuote | null
  notifications: boolean
  isOnline: boolean
  batteryLevel: number
  isLoadingPrayerTimes: boolean
  isLoadingQibla: boolean
  user: any
  isAuthenticated: boolean
  chatMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
}

// Enhanced translations with Kurdish support
const translations = {
  en: {
    appName: "FLKRD Muslims",
    greeting: "Assalamu Alaikum",
    home: "Home",
    prayer: "Prayer",
    qibla: "Qibla",
    quran: "Quran",
    zikr: "Zikr",
    community: "Community",
    hadith: "Hadith",
    settings: "Settings",
    dailyAyah: "Daily Ayah",
    prayerTimes: "Prayer Times",
    nextPrayer: "Next Prayer",
    qiblaDirection: "Qibla Direction",
    tasbeeh: "Digital Tasbeeh",
    reset: "Reset",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    notifications: "Notifications",
    playAdhan: "Play Adhan",
    loading: "Loading...",
    retry: "Retry",
    subhanallah: "Subhan Allah",
    alhamdulillah: "Alhamdulillah",
    allahuakbar: "Allahu Akbar",
    signIn: "Sign In",
    signOut: "Sign Out",
    profile: "Profile",
    createPost: "Create Post",
    like: "Like",
    share: "Share",
    comment: "Comment",
    upload: "Upload",
    video: "Video",
    image: "Image",
    signInWithGoogle: "Continue with Google",
    welcome: "Welcome to FLKRD Muslims",
    islamicCommunity: "Your Islamic Community",
    prayerReminder: "Prayer Reminder",
    adhanPlaying: "Adhan is playing...",
    timeForPrayer: "It's time for",
    quickAccess: "Quick Access",
    islamicTools: "Islamic Tools",
    readQuran: "Read Quran",
    findQibla: "Find Qibla",
    digitalTasbeeh: "Digital Tasbeeh",
    islamicCalendar: "Islamic Calendar",
    prayerTracker: "Prayer Tracker",
    islamicQuotes: "Islamic Quotes",
    prayerAlerts: "Prayer Alerts",
    adhanSettings: "Adhan Settings",
    qiblaCompass: "Qibla Compass",
    prayerHistory: "Prayer History",
    islamicDate: "Islamic Date",
    moonPhases: "Moon Phases",
    prayerReminders: "Prayer Reminders",
    customAdhan: "Custom Adhan",
    vibrationAlert: "Vibration Alert",
    soundAlert: "Sound Alert",
    visualAlert: "Visual Alert",
    autoSilent: "Auto Silent Mode",
    prayerStats: "Prayer Statistics",
    streakCounter: "Prayer Streak",
    missedPrayers: "Missed Prayers",
    prayerGoals: "Prayer Goals",
    chat: "Chat",
    typeMessage: "Type a message...",
    send: "Send",
  },
  ar: {
    appName: "مسلمون FLKRD",
    greeting: "السلام عليكم",
    home: "الرئيسية",
    prayer: "الصلاة",
    qibla: "القبلة",
    quran: "القرآن",
    zikr: "الذكر",
    community: "المجتمع",
    hadith: "الحديث",
    settings: "الإعدادات",
    dailyAyah: "آية اليوم",
    prayerTimes: "أوقات الصلاة",
    nextPrayer: "الصلاة القادمة",
    qiblaDirection: "اتجاه القبلة",
    tasbeeh: "التسبيح الرقمي",
    reset: "إعادة تعيين",
    language: "اللغة",
    theme: "المظهر",
    darkMode: "الوضع المظلم",
    lightMode: "الوضع المضيء",
    notifications: "الإشعارات",
    playAdhan: "تشغيل الأذان",
    loading: "جاري التحميل...",
    retry: "إعادة المحاولة",
    subhanallah: "سبحان الله",
    alhamdulillah: "الحمد لله",
    allahuakbar: "الله أكبر",
    signIn: "تسجيل الدخول",
    signOut: "تسجيل الخروج",
    profile: "الملف الشخصي",
    createPost: "إنشاء منشور",
    like: "إعجاب",
    share: "مشاركة",
    comment: "تعليق",
    upload: "رفع",
    video: "فيديو",
    image: "صورة",
    signInWithGoogle: "المتابعة مع جوجل",
    welcome: "مرحباً بك في مسلمون FLKRD",
    islamicCommunity: "مجتمعك الإسلامي",
    prayerReminder: "تذكير الصلاة",
    adhanPlaying: "يتم تشغيل الأذان...",
    timeForPrayer: "حان وقت",
    quickAccess: "الوصول السريع",
    islamicTools: "الأدوات الإسلامية",
    readQuran: "قراءة القرآن",
    findQibla: "العثور على القبلة",
    digitalTasbeeh: "التسبيح الرقمي",
    islamicCalendar: "التقويم الإسلامي",
    prayerTracker: "متتبع الصلاة",
    islamicQuotes: "الاقتباسات الإسلامية",
    prayerAlerts: "تنبيهات الصلاة",
    adhanSettings: "إعدادات الأذان",
    qiblaCompass: "بوصلة القبلة",
    prayerHistory: "تاريخ الصلاة",
    islamicDate: "التاريخ الإسلامي",
    moonPhases: "أطوار القمر",
    prayerReminders: "تذكيرات الصلاة",
    customAdhan: "أذان مخصص",
    vibrationAlert: "تنبيه الاهتزاز",
    soundAlert: "تنبيه صوتي",
    visualAlert: "تنبيه بصري",
    autoSilent: "وضع الصمت التلقائي",
    prayerStats: "إحصائيات الصلاة",
    streakCounter: "عداد الصلاة المتتالية",
    missedPrayers: "الصلوات الفائتة",
    prayerGoals: "أهداف الصلاة",
    chat: "الدردشة",
    typeMessage: "اكتب رسالة...",
    send: "إرسال",
  },
  sorani: {
    appName: "موسڵمانانی FLKRD",
    greeting: "سەلامو عەلەیکوم",
    home: "ماڵەوە",
    prayer: "نوێژ",
    qibla: "قیبلە",
    quran: "قورئان",
    zikr: "زیکر",
    community: "کۆمەڵگا",
    hadith: "حەدیس",
    settings: "ڕێکخستنەکان",
    dailyAyah: "ئایەتی ڕۆژانە",
    prayerTimes: "کاتەکانی نوێژ",
    nextPrayer: "نوێژی داهاتوو",
    qiblaDirection: "ئاراستەی قیبلە",
    tasbeeh: "تەسبیحی دیجیتاڵ",
    reset: "ڕێکخستنەوە",
    language: "زمان",
    theme: "ڕووکار",
    darkMode: "دۆخی تاریک",
    lightMode: "دۆخی ڕووناک",
    notifications: "ئاگادارکردنەوەکان",
    playAdhan: "لێدانی ئەزان",
    loading: "بارکردن...",
    retry: "دووبارەکردنەوە",
    subhanallah: "سوبحان الله",
    alhamdulillah: "ئەلحەمدولیللاه",
    allahuakbar: "ئەللاهو ئەکبەر",
    signIn: "چوونە ژوورەوە",
    signOut: "چوونە دەرەوە",
    profile: "پڕۆفایل",
    createPost: "دروستکردنی پۆست",
    like: "حەز",
    share: "هاوبەشکردن",
    comment: "لێدوان",
    upload: "بارکردن",
    video: "ڤیدیۆ",
    image: "وێنە",
    signInWithGoogle: "بەردەوامبوون لەگەڵ گووگڵ",
    welcome: "بەخێربێیت بۆ موسڵمانانی FLKRD",
    islamicCommunity: "کۆمەڵگای ئیسلامیت",
    prayerReminder: "بیرخستنەوەی نوێژ",
    adhanPlaying: "ئەزان لێدەدرێت...",
    timeForPrayer: "کاتی",
    quickAccess: "دەستپێگەیشتنی خێرا",
    islamicTools: "ئامرازە ئیسلامیەکان",
    readQuran: "خوێندنەوەی قورئان",
    findQibla: "دۆزینەوەی قیبلە",
    digitalTasbeeh: "تەسبیحی دیجیتاڵ",
    islamicCalendar: "ڕۆژژمێری ئیسلامی",
    prayerTracker: "شوێنکەوتووی نوێژ",
    islamicQuotes: "وتەی ئیسلامی",
    prayerAlerts: "ئاگادارکردنەوەی نوێژ",
    adhanSettings: "ڕێکخستنی ئەزان",
    qiblaCompass: "پیشاندەری قیبلە",
    prayerHistory: "مێژووی نوێژ",
    islamicDate: "بەرواری ئیسلامی",
    moonPhases: "قۆناغەکانی مانگ",
    prayerReminders: "بیرخستنەوەی نوێژ",
    customAdhan: "ئەزانی تایبەت",
    vibrationAlert: "ئاگادارکردنەوەی لەرین",
    soundAlert: "ئاگادارکردنەوەی دەنگ",
    visualAlert: "ئاگادارکردنەوەی بینراو",
    autoSilent: "دۆخی بێدەنگی خۆکار",
    prayerStats: "ئامارەکانی نوێژ",
    streakCounter: "ژمێرەری نوێژی بەردەوام",
    missedPrayers: "نوێژە لەدەستچووەکان",
    prayerGoals: "ئامانجەکانی نوێژ",
    chat: "گفتوگۆ",
    typeMessage: "پەیامێک بنووسە...",
    send: "ناردن",
  },
  badini: {
    appName: "موسڵمانێن FLKRD",
    greeting: "سەلامو عەلەیکوم",
    home: "ماڵ",
    prayer: "نیماز",
    qibla: "قیبلە",
    quran: "قورئان",
    zikr: "زیکر",
    community: "کۆمەڵگە",
    hadith: "حەدیس",
    settings: "ڕێکخستن",
    dailyAyah: "ئایەتا ڕۆژانە",
    prayerTimes: "دەمێن نیمازێ",
    nextPrayer: "نیمازا داهاتی",
    qiblaDirection: "ئاراستەیا قیبلەیێ",
    tasbeeh: "تەسبیحا دیجیتاڵ",
    reset: "نوکردن",
    language: "زمان",
    theme: "ڕەنگ",
    darkMode: "دۆخا تاریک",
    lightMode: "دۆخا ڕووناک",
    notifications: "ئاگاهکرن",
    playAdhan: "لێدانا ئەزانێ",
    loading: "بارکرن...",
    retry: "دووبارەکرن",
    subhanallah: "سوبحان الله",
    alhamdulillah: "ئەلحەمدولیللاه",
    allahuakbar: "ئەللاهو ئەکبەر",
    signIn: "کەتنە ژوورێ",
    signOut: "دەرکەتن",
    profile: "پڕۆفایل",
    createPost: "دروستکرنا پۆستێ",
    like: "حەز",
    share: "پارڤەکرن",
    comment: "لێدوان",
    upload: "بارکرن",
    video: "ڤیدیۆ",
    image: "وێنە",
    signInWithGoogle: "بەردەوامبوون لەگەڵ گووگڵ",
    welcome: "بەخێربێن بۆ موسڵمانێن FLKRD",
    islamicCommunity: "کۆمەڵگەیا ئیسلامی یا تە",
    prayerReminder: "بیرخستنا نیمازێ",
    adhanPlaying: "ئەزان لێدەدرێت...",
    timeForPrayer: "دەما",
    quickAccess: "دەستپێگەیشتنا خێرا",
    islamicTools: "ئامرازێن ئیسلامی",
    readQuran: "خوێندنا قورئانێ",
    findQibla: "دۆزینا قیبلەیێ",
    digitalTasbeeh: "تەسبیحا دیجیتاڵ",
    islamicCalendar: "ڕۆژژمێرا ئیسلامی",
    prayerTracker: "شوێنکەوتووا نیمازێ",
    islamicQuotes: "وتەیێن ئیسلامی",
    prayerAlerts: "ئاگاهکرنا نیمازێ",
    adhanSettings: "ڕێکخستنا ئەزانێ",
    qiblaCompass: "پیشاندەرا قیبلەیێ",
    prayerHistory: "مێژووا نیمازێ",
    islamicDate: "بەرواری ئیسلامی",
    moonPhases: "قۆناغێن هەیڤێ",
    prayerReminders: "بیرخستنا نیمازێ",
    customAdhan: "ئەزانا تایبەت",
    vibrationAlert: "ئاگاهکرنا لەرینێ",
    soundAlert: "ئاگاهکرنا دەنگێ",
    visualAlert: "ئاگاهکرنا بینراو",
    autoSilent: "دۆخا بێدەنگی خۆکار",
    prayerStats: "ئامارێن نیمازێ",
    streakCounter: "ژمێرەرا نیمازا بەردەوام",
    missedPrayers: "نیمازێن لەدەستچوویی",
    prayerGoals: "ئامانجێن نیمازێ",
    chat: "گفتوگۆ",
    typeMessage: "پەیامێک بنووسە...",
    send: "ناردن",
  },
}

// Enhanced API Configuration
const API_CONFIG = {
  PRAYER_TIMES: "https://api.aladhan.com/v1/timings",
  QURAN: "https://api.alquran.cloud/v1",
  QURAN_KURDISH: "https://quranenc.com/api/v1/translations/list/ku?localization=ku",
  QURAN_TRANSLATIONS: "https://quranenc.com/api/v1/translations/list",
  HADITH_BACKUP: "https://hadithapi.com/api",
  QIBLA: "https://api.aladhan.com/v1/qibla",
  GEOCODING: "https://api.bigdatacloud.net/data/reverse-geocode-client",
}

// Fallback hadith collection for offline use
const FALLBACK_HADITHS = [
  {
    text: "The Prophet (ﷺ) said: 'The best of people are those who benefit others.'",
    source: "Sahih Bukhari",
    arabic: "قال النبي صلى الله عليه وسلم: خير الناس أنفعهم للناس",
    kurdish: "پێغەمبەر (د.خ) فەرمووی: باشترین خەڵک ئەوانەن کە سوودی خەڵکی لێ دەبێت",
  },
  {
    text: "The Prophet (ﷺ) said: 'A Muslim is one from whose tongue and hand people are safe.'",
    source: "Sahih Bukhari",
    arabic: "قال النبي صلى الله عليه وسلم: المسلم من سلم المسلمون من لسانه ويده",
    kurdish: "پێغەمبەر (د.خ) فەرمووی: موسڵمان ئەوەیە کە موسڵمانان لە زمان و دەستی ئەمن بن",
  },
  {
    text: "The Prophet (ﷺ) said: 'The believer is not one who eats his fill while his neighbor goes hungry.'",
    source: "Al-Adab Al-Mufrad",
    arabic: "قال النبي صلى الله عليه وسلم: ليس المؤمن الذي يشبع وجاره جائع",
    kurdish: "پێغەمبەر (د.خ) فەرمووی: مؤمن ئەوە نییە کە تێر بخوات و دراوسێکەی برسی بێت",
  },
]

// Memoized components for performance
const StatusBar = React.memo(() => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if ("getBattery" in navigator) {
      ;(navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100))
        battery.addEventListener("levelchange", () => {
          setBatteryLevel(Math.round(battery.level * 100))
        })
      })
    }
  }, [])

  return (
    <div className="flex justify-between items-center px-6 py-2 text-gray-600 text-sm status-bar">
      <div className="flex items-center gap-1">
        <span className="font-medium">
          {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
        <Signal size={14} />
        <div className="flex items-center gap-1">
          <Battery size={14} />
          <span className="text-xs">{batteryLevel}%</span>
        </div>
      </div>
    </div>
  )
})

StatusBar.displayName = "StatusBar"

const LiquidButton = React.memo(
  ({
    children,
    onClick,
    className = "",
    variant = "primary",
    disabled = false,
  }: {
    children: ReactNode
    onClick?: () => void
    className?: string
    variant?: "primary" | "secondary" | "glass" | "transparent"
    disabled?: boolean
  }) => {
    const variants = useMemo(
      () => ({
        primary: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
        secondary: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
        glass: "bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 backdrop-blur-xl",
        transparent: "bg-transparent hover:bg-white/10 text-gray-700 backdrop-blur-sm",
      }),
      [],
    )

    const handleClick = useCallback(() => {
      if (!disabled && onClick) {
        if ("vibrate" in navigator) {
          navigator.vibrate([10])
        }
        onClick()
      }
    }, [disabled, onClick])

    return (
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${variants[variant]}
          rounded-2xl px-6 py-3 font-medium
          transform transition-all duration-200 ease-out
          hover:scale-105 active:scale-95
          shadow-lg hover:shadow-xl
          relative overflow-hidden
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {children}
      </button>
    )
  },
)

LiquidButton.displayName = "LiquidButton"

const GlassCard = React.memo(
  ({
    children,
    className = "",
    interactive = false,
    onClick,
    loading = false,
  }: {
    children: ReactNode
    className?: string
    interactive?: boolean
    onClick?: () => void
    loading?: boolean
  }) => {
    const handleClick = useCallback(() => {
      if (interactive && onClick && !loading) {
        if ("vibrate" in navigator) {
          navigator.vibrate([10])
        }
        onClick()
      }
    }, [interactive, onClick, loading])

    if (loading) {
      return <LoadingSkeleton className={className} />
    }

    return (
      <div
        onClick={handleClick}
        className={`
          bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 
          shadow-2xl relative overflow-hidden
          ${
            interactive
              ? "cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/90 active:scale-95"
              : ""
          }
          ${className}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        {children}
      </div>
    )
  },
)

GlassCard.displayName = "GlassCard"

const FloatingOrb = React.memo(
  ({ delay = 0, size = "w-32 h-32", color = "bg-blue-500/20" }: { delay?: number; size?: string; color?: string }) => (
    <div
      className={`absolute ${size} ${color} rounded-full blur-3xl animate-pulse`}
      style={{ animationDelay: `${delay}ms`, animationDuration: "4s" }}
    />
  ),
)

FloatingOrb.displayName = "FloatingOrb"

// Enhanced macOS-style navigation button with animations
const NavigationButton = React.memo(
  ({
    screen,
    icon: Icon,
    label,
    isActive,
    onClick,
  }: {
    screen: Screen
    icon: any
    label: string
    isActive: boolean
    onClick: (screen: Screen) => void
  }) => {
    const [isPressed, setIsPressed] = useState(false)

    const handleClick = useCallback(() => {
      if ("vibrate" in navigator) {
        navigator.vibrate([10])
      }
      setIsPressed(true)
      setTimeout(() => setIsPressed(false), 150)
      onClick(screen)
    }, [screen, onClick])

    return (
      <button
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        className={`
          relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ease-out
          min-w-[48px] min-h-[48px] p-3
          ${
            isActive
              ? "bg-white/30 backdrop-blur-xl shadow-lg scale-110 border border-white/40"
              : "hover:bg-white/20 backdrop-blur-sm hover:scale-105"
          }
          ${isPressed ? "scale-95" : ""}
        `}
        aria-label={label}
        title={label}
      >
        {/* Liquid glass effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

        {/* Icon with enhanced styling */}
        <div className={`relative z-10 transition-all duration-300 ${isActive ? "scale-110" : ""}`}>
          <Icon
            size={20}
            className={`transition-colors duration-300 ${isActive ? "text-blue-600 drop-shadow-sm" : "text-gray-600"}`}
          />
        </div>

        {/* Label - hidden on small screens, shown on larger */}
        <span
          className={`
            text-xs mt-1 hidden sm:block transition-all duration-300 font-medium
            ${isActive ? "text-blue-600 scale-105" : "text-gray-600"}
          `}
        >
          {label}
        </span>

        {/* Active indicator with liquid animation */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse shadow-lg" />
          </div>
        )}

        {/* Ripple effect on press */}
        {isPressed && <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping pointer-events-none" />}
      </button>
    )
  },
)

NavigationButton.displayName = "NavigationButton"

export default function FLKRDMuslims() {
  // Performance monitoring
  usePerformanceMonitor()

  // Supabase integration
  const { user, signInWithGoogle, signOut, isLoading } = useSupabase()

  // State management
  const [appState, setAppState] = useState<AppState>({
    currentScreen: "home",
    language: "en",
    theme: "light",
    zikrCount: 0,
    zikrType: "subhanallah",
    showChat: false,
    currentTime: new Date(),
    qiblaDirection: 195.0, // Set to 195 degrees as requested
    prayerTimes: [],
    nextPrayer: null,
    location: null,
    hijriDate: null,
    dailyVerse: null,
    dailyHadith: null,
    notifications: false,
    isOnline: true,
    batteryLevel: 100,
    isLoadingPrayerTimes: false,
    isLoadingQibla: false,
    isAuthenticated: user !== null,
    chatMessages: [],
  })

  // API caching
  const { getCachedData: getApiCachedData, setCachedData: setApiCachedData } = useApiCache()

  // AI integration
  const { generateResponse, moderateContent } = useAI()

  // Prayer notifications
  const { requestPermission, scheduleNotification, playAdhan } = usePrayerNotifications()

  // Function to update the current screen
  const setCurrentScreen = useCallback((screen: Screen) => {
    setAppState((prevState) => ({ ...prevState, currentScreen: screen }))
  }, [])

  // Function to fetch daily hadith
  const fetchDailyHadith = useCallback(async () => {
    try {
      const randomIndex = Math.floor(Math.random() * FALLBACK_HADITHS.length)
      const hadith = FALLBACK_HADITHS[randomIndex]

      const processedHadith = {
        text: hadith.text,
        source: hadith.source,
        arabic: hadith.arabic,
        kurdish: hadith.kurdish,
      }

      setCachedData(
        `daily-hadith-${new Date().toDateString()}-${appState.language}`,
        processedHadith,
        24 * 60 * 60 * 1000,
      )
      setAppState((prev) => ({ ...prev, dailyHadith: processedHadith }))
    } catch (error) {
      console.error("Error fetching daily hadith:", error)
      const fallbackHadith = FALLBACK_HADITHS[0]
      setAppState((prev) => ({ ...prev, dailyHadith: fallbackHadith }))
    }
  }, [appState.language])

  // Function to handle chat message submission
  const submitChatMessage = useCallback(
    async (message: string) => {
      const userMessage = { role: "user" as const, content: message, timestamp: new Date() }
      setAppState((prevState) => ({ ...prevState, chatMessages: [...prevState.chatMessages, userMessage] }))

      try {
        const response = await generateResponse(message, appState.language)
        const assistantMessage = { role: "assistant" as const, content: response.response, timestamp: new Date() }
        setAppState((prevState) => ({ ...prevState, chatMessages: [...prevState.chatMessages, assistantMessage] }))
      } catch (error) {
        console.error("Error generating AI response:", error)
        const errorMessage = {
          role: "assistant" as const,
          content: "Sorry, I'm having trouble responding right now.",
          timestamp: new Date(),
        }
        setAppState((prevState) => ({ ...prevState, chatMessages: [...prevState.chatMessages, errorMessage] }))
      }
    },
    [generateResponse, appState.language],
  )

  // Function to toggle chat visibility
  const toggleChat = useCallback(() => {
    setAppState((prevState) => ({ ...prevState, showChat: !prevState.showChat }))
  }, [])

  // Effect to fetch daily hadith on component mount
  useEffect(() => {
    fetchDailyHadith()
  }, [fetchDailyHadith])

  // Effect to update authentication status
  useEffect(() => {
    setAppState((prev) => ({ ...prev, isAuthenticated: user !== null }))
  }, [user])

  // Effect to update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setAppState((prev) => ({ ...prev, currentTime: new Date() }))
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Memoized screen props
  const screenProps = useMemo(
    () => ({
      appState,
      setAppState,
      t: translations[appState.language] || translations.en,
      user,
      signInWithGoogle,
      signOut,
      generateResponse,
      moderateContent,
      authLoading: isLoading,
      aiLoading: false,
      playAdhan,
      scheduleNotification,
      fetchDailyHadith,
    }),
    [
      appState,
      user,
      signInWithGoogle,
      signOut,
      generateResponse,
      moderateContent,
      isLoading,
      playAdhan,
      scheduleNotification,
      fetchDailyHadith,
    ],
  )

  const renderScreen = () => {
    const ScreenComponent = {
      home: HomeScreen,
      prayer: PrayerScreen,
      qibla: QiblaScreen,
      quran: QuranScreen,
      zikr: ZikrScreen,
      community: CommunityScreen,
      hadith: HadithScreen,
      settings: SettingsScreen,
    }[appState.currentScreen]

    if (!ScreenComponent) {
      return <LoadingSkeleton className="h-96" />
    }

    return (
      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <ScreenComponent {...screenProps} />
      </Suspense>
    )
  }

  // Translation shorthand
  const t = translations[appState.language] || translations.en

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating background orbs */}
      <FloatingOrb delay={0} size="w-64 h-64" color="bg-blue-400/10" />
      <FloatingOrb delay={2000} size="w-48 h-48" color="bg-purple-400/10" />
      <FloatingOrb delay={4000} size="w-32 h-32" color="bg-pink-400/10" />

      {/* Status Bar */}
      <StatusBar />

      {/* Main Content */}
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 p-6 pb-24">{renderScreen()}</main>

        {/* Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white/20 backdrop-blur-xl border-t border-white/20 px-4 py-2">
          <div className="flex justify-around items-center max-w-md mx-auto">
            <NavigationButton
              screen="home"
              icon={Home}
              label={t.home}
              isActive={appState.currentScreen === "home"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="prayer"
              icon={Clock}
              label={t.prayer}
              isActive={appState.currentScreen === "prayer"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="qibla"
              icon={Compass}
              label={t.qibla}
              isActive={appState.currentScreen === "qibla"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="quran"
              icon={BookOpen}
              label={t.quran}
              isActive={appState.currentScreen === "quran"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="zikr"
              icon={RotateCcw}
              label={t.zikr}
              isActive={appState.currentScreen === "zikr"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="community"
              icon={Users}
              label={t.community}
              isActive={appState.currentScreen === "community"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="hadith"
              icon={FileText}
              label={t.hadith}
              isActive={appState.currentScreen === "hadith"}
              onClick={setCurrentScreen}
            />
            <NavigationButton
              screen="settings"
              icon={Settings}
              label={t.settings}
              isActive={appState.currentScreen === "settings"}
              onClick={setCurrentScreen}
            />
          </div>
        </nav>
      </div>

      {/* Chat Modal */}
      {appState.showChat && (
        <Dialog.Root open={appState.showChat} onOpenChange={toggleChat}>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50" />
            <Dialog.Content className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 max-w-md mx-auto mt-20 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-h-[80vh] overflow-y-auto">
              <Dialog.Title className="text-lg font-medium mb-4 text-gray-800">{t.chat}</Dialog.Title>
              <div className="flex flex-col space-y-4 mb-4 max-h-64 overflow-y-auto">
                {appState.chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  placeholder={t.typeMessage}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement
                      if (input.value.trim()) {
                        submitChatMessage(input.value.trim())
                        input.value = ""
                      }
                    }
                  }}
                />
                <LiquidButton
                  onClick={() => {
                    const input = document.querySelector('input[type="text"]') as HTMLInputElement
                    if (input?.value.trim()) {
                      submitChatMessage(input.value.trim())
                      input.value = ""
                    }
                  }}
                  className="px-4 py-3"
                >
                  {t.send}
                </LiquidButton>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}

      {/* Floating Action Button for Chat */}
      {user && (
        <button
          onClick={toggleChat}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-110 active:scale-95 z-40"
          aria-label="Open Chat"
        >
          <div className="flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>
      )}
    </div>
  )
}
