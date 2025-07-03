"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Search, BookOpen, Play, Pause, Bookmark, Share, Eye, ArrowLeft } from "lucide-react"
import { useApiCache } from "@/hooks/useApiCache"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { getKurdishTafsirWithFallback } from "@/utils/kurdishTafsir"
import { saveOfflineData, getOfflineData } from "@/utils/offlineStorage"

interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
  kurdishName?: string
}

interface Ayah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajda: boolean
  translation?: string
  kurdishTranslation?: string
  audio?: string
}

const GlassCard = React.memo(({ children, className = "", interactive = false, onClick }: any) => (
  <div
    onClick={onClick}
    className={`
      bg-white/80 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl relative overflow-hidden
      ${interactive ? "cursor-pointer transform transition-all duration-300 hover:scale-105 hover:bg-white/90 active:scale-95" : ""}
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    {children}
  </div>
))

GlassCard.displayName = "GlassCard"

const LiquidButton = React.memo(({ children, onClick, variant = "primary", className = "", disabled = false }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white",
    secondary: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white",
    glass: "bg-white/20 hover:bg-white/30 border border-white/30 text-gray-800 backdrop-blur-xl",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        rounded-2xl px-4 py-2 font-medium text-sm
        transform transition-all duration-200 ease-out
        hover:scale-105 active:scale-95
        shadow-lg hover:shadow-xl
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
    </button>
  )
})

LiquidButton.displayName = "LiquidButton"

export default function QuranScreen({ appState, t }: any) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAyahs, setLoadingAyahs] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [playingAyah, setPlayingAyah] = useState<number | null>(null)
  const [view, setView] = useState<"surahs" | "ayahs">("surahs")
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set())
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showKurdishTranslation, setShowKurdishTranslation] = useState(true)
  const [kurdishTafsir, setKurdishTafsir] = useState<any[]>([])

  const { getCachedData, setCachedData } = useApiCache()

  // Kurdish Surah names
  const kurdishSurahNames = {
    sorani: [
      "سورەتی فاتیحە",
      "سورەتی بەقەرە",
      "سورەتی ئالی عیمران",
      "سورەتی نیسا",
      "سورەتی مائیدە",
      "سورەتی ئەنعام",
      "سورەتی ئەعراف",
      "سورەتی ئەنفال",
      "سورەتی تەوبە",
      "سورەتی یونس",
      "سورەتی هود",
      "سورەتی یوسف",
      "سورەتی ڕەعد",
      "سورەتی ئیبراهیم",
      "سورەتی حیجر",
      "سورەتی نەحل",
      "سورەتی ئیسرا",
      "سورەتی کەهف",
      "سورەتی مەریەم",
      "سورەتی تاها",
    ],
    badini: [
      "سورەتا فاتیحەیێ",
      "سورەتا بەقەرەیێ",
      "سورەتا ئالی عیمرانێ",
      "سورەتا نیساێ",
      "سورەتا مائیدەیێ",
      "سورەتا ئەنعامێ",
      "سورەتا ئەعرافێ",
      "سورەتا ئەنفالێ",
      "سورەتا تەوبەیێ",
      "سورەتا یونسێ",
      "سورەتا هودێ",
      "سورەتا یوسفێ",
      "سورەتا ڕەعدێ",
      "سورەتا ئیبراهیمێ",
      "سورەتا حیجرێ",
      "سورەتا نەحلێ",
      "سورەتا ئیسراێ",
      "سورەتا کەهفێ",
      "سورەتا مەریەمێ",
      "سورەتا تاهاێ",
    ],
  }

  // Offline Quran data
  const offlineSurahs: Surah[] = [
    {
      number: 1,
      name: "الفاتحة",
      englishName: "Al-Fatihah",
      englishNameTranslation: "The Opening",
      numberOfAyahs: 7,
      revelationType: "Meccan",
    },
    {
      number: 2,
      name: "البقرة",
      englishName: "Al-Baqarah",
      englishNameTranslation: "The Cow",
      numberOfAyahs: 286,
      revelationType: "Medinan",
    },
    {
      number: 3,
      name: "آل عمران",
      englishName: "Ali 'Imran",
      englishNameTranslation: "Family of Imran",
      numberOfAyahs: 200,
      revelationType: "Medinan",
    },
    {
      number: 4,
      name: "النساء",
      englishName: "An-Nisa",
      englishNameTranslation: "The Women",
      numberOfAyahs: 176,
      revelationType: "Medinan",
    },
    {
      number: 5,
      name: "المائدة",
      englishName: "Al-Ma'idah",
      englishNameTranslation: "The Table Spread",
      numberOfAyahs: 120,
      revelationType: "Medinan",
    },
  ]

  // Fetch all Surahs
  const fetchSurahs = useCallback(async () => {
    const cacheKey = `surahs-${appState.language}`
    const cached = getCachedData(cacheKey)
    if (cached) {
      setSurahs(cached)
      setLoading(false)
      return
    }

    try {
      // Try online first
      const response = await fetch("https://api.alquran.cloud/v1/surah")
      if (response.ok) {
        const data = await response.json()
        const processedSurahs = data.data.map((surah: any, index: number) => ({
          ...surah,
          kurdishName:
            appState.language === "sorani" || appState.language === "badini"
              ? kurdishSurahNames[appState.language]?.[index] || surah.englishName
              : undefined,
        }))
        setSurahs(processedSurahs)
        setCachedData(cacheKey, processedSurahs, 7 * 24 * 60 * 60 * 1000)
        saveOfflineData({ quranSurahs: processedSurahs })
      } else {
        throw new Error("Online fetch failed")
      }
    } catch (error) {
      console.error("Error fetching surahs, using offline data:", error)
      // Use offline data
      const offlineData = getOfflineData()
      const surahsToUse = offlineData.quranSurahs.length > 0 ? offlineData.quranSurahs : offlineSurahs
      setSurahs(surahsToUse)
    } finally {
      setLoading(false)
    }
  }, [getCachedData, setCachedData, appState.language])

  // Fetch Ayahs for a specific Surah
  const fetchAyahs = useCallback(
    async (surahNumber: number) => {
      setLoadingAyahs(true)
      const cacheKey = `ayahs-${surahNumber}-${appState.language}`
      const cached = getCachedData(cacheKey)
      if (cached) {
        setAyahs(cached.ayahs)
        setKurdishTafsir(cached.kurdishTafsir || [])
        setLoadingAyahs(false)
        return
      }

      try {
        // Fetch Arabic text
        const arabicResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}`)
        let arabicData = null
        if (arabicResponse.ok) {
          arabicData = await arabicResponse.json()
        }

        // Fetch English translation
        const translationResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`)
        let translationData = null
        if (translationResponse.ok) {
          translationData = await translationResponse.json()
        }

        // Fetch Kurdish Tafsir
        const kurdishTafsirData = await getKurdishTafsirWithFallback(surahNumber)

        let processedAyahs: Ayah[] = []

        if (arabicData) {
          processedAyahs = arabicData.data.ayahs.map((ayah: any, index: number) => ({
            ...ayah,
            translation: translationData?.data.ayahs[index]?.text || "",
            kurdishTranslation: kurdishTafsirData[index]?.translation || "",
            audio: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
          }))
        } else {
          // Fallback offline data for Al-Fatihah
          if (surahNumber === 1) {
            processedAyahs = [
              {
                number: 1,
                text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                numberInSurah: 1,
                translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
                kurdishTranslation: "بە ناوی ئەللاهی میهرەبان و بەزەیی",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 2,
                text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                numberInSurah: 2,
                translation: "All praise is due to Allah, Lord of the worlds.",
                kurdishTranslation: "ستایش بۆ ئەللاه کە پەروەردگاری جیهانیانە",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 3,
                text: "الرَّحْمَٰنِ الرَّحِيمِ",
                numberInSurah: 3,
                translation: "The Entirely Merciful, the Especially Merciful,",
                kurdishTranslation: "میهرەبان و بەزەیی",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 4,
                text: "مَالِكِ يَوْمِ الدِّينِ",
                numberInSurah: 4,
                translation: "Sovereign of the Day of Recompense.",
                kurdishTranslation: "خاوەنی ڕۆژی لێپرسینەوە",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 5,
                text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
                numberInSurah: 5,
                translation: "It is You we worship and You we ask for help.",
                kurdishTranslation: "تەنها تۆ دەپەرستین و تەنها لە تۆ یارمەتی دەخوازین",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 6,
                text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
                numberInSurah: 6,
                translation: "Guide us to the straight path",
                kurdishTranslation: "ئێمە بە ڕێگای ڕاست بەڕێوە ببە",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
              {
                number: 7,
                text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
                numberInSurah: 7,
                translation:
                  "The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.",
                kurdishTranslation:
                  "ڕێگای ئەوانەی نیعمەتت پێ بەخشیوون، نەک ئەوانەی تووڕەیی لەسەریانە و نەک ئەوانەی گومڕان",
                juz: 1,
                manzil: 1,
                page: 1,
                ruku: 1,
                hizbQuarter: 1,
                sajda: false,
              },
            ]
          }
        }

        setAyahs(processedAyahs)
        setKurdishTafsir(kurdishTafsirData)
        setCachedData(cacheKey, { ayahs: processedAyahs, kurdishTafsir: kurdishTafsirData }, 7 * 24 * 60 * 60 * 1000)
      } catch (error) {
        console.error("Error fetching ayahs:", error)
      } finally {
        setLoadingAyahs(false)
      }
    },
    [getCachedData, setCachedData, appState.language],
  )

  useEffect(() => {
    fetchSurahs()
  }, [fetchSurahs])

  // Handle Surah selection
  const handleSurahSelect = (surah: Surah) => {
    setSelectedSurah(surah)
    setView("ayahs")
    fetchAyahs(surah.number)
  }

  // Handle audio playback
  const handlePlayAudio = (ayah: Ayah) => {
    if (currentAudio) {
      currentAudio.pause()
      setCurrentAudio(null)
      setPlayingAyah(null)
    }

    if (ayah.audio && playingAyah !== ayah.number) {
      const audio = new Audio(ayah.audio)
      audio.playbackRate = playbackSpeed
      audio.volume = 0.8
      audio.play()
      setCurrentAudio(audio)
      setPlayingAyah(ayah.number)

      audio.onended = () => {
        setCurrentAudio(null)
        setPlayingAyah(null)
      }
    }
  }

  // Toggle bookmark
  const toggleBookmark = (ayahNumber: number) => {
    setBookmarkedAyahs((prev) => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(ayahNumber)) {
        newBookmarks.delete(ayahNumber)
      } else {
        newBookmarks.add(ayahNumber)
      }
      return newBookmarks
    })
  }

  // Share ayah
  const shareAyah = async (ayah: Ayah) => {
    const shareText = `${ayah.text}

${ayah.translation}

${ayah.kurdishTranslation ? `${ayah.kurdishTranslation}\n\n` : ""}
- Quran ${selectedSurah?.name} ${ayah.numberInSurah}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quran - ${selectedSurah?.name}`,
          text: shareText,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      navigator.clipboard.writeText(shareText)
      alert("Ayah copied to clipboard!")
    }
  }

  // Filter surahs based on search
  const filteredSurahs = surahs.filter(
    (surah) =>
      surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (surah.kurdishName && surah.kurdishName.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Render Surah item
  const renderSurahItem = (surah: Surah, index: number) => (
    <GlassCard key={surah.number} interactive onClick={() => handleSurahSelect(surah)} className="p-4 mb-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">{surah.number}</span>
          </div>
          <div>
            <h3 className="text-gray-800 font-semibold text-lg">{surah.name}</h3>
            <p className="text-gray-600 text-sm font-medium">{surah.englishName}</p>
            {surah.kurdishName && <p className="text-gray-500 text-sm">{surah.kurdishName}</p>}
            <div className="flex items-center gap-4 mt-1">
              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">
                {surah.numberOfAyahs} verses
              </span>
              <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded-full">{surah.revelationType}</span>
            </div>
          </div>
        </div>
        <BookOpen size={24} className="text-gray-500" />
      </div>
    </GlassCard>
  )

  // Render Ayah item
  const renderAyahItem = (ayah: Ayah, index: number) => (
    <GlassCard key={ayah.number} className="p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full font-medium">
            Verse {ayah.numberInSurah}
          </span>
          <span className="text-gray-500 text-xs">Juz {ayah.juz}</span>
        </div>
        <div className="flex gap-2">
          {ayah.audio && (
            <LiquidButton onClick={() => handlePlayAudio(ayah)} variant="glass" className="p-2">
              {playingAyah === ayah.number ? <Pause size={16} /> : <Play size={16} />}
            </LiquidButton>
          )}
          <LiquidButton
            onClick={() => toggleBookmark(ayah.number)}
            variant="glass"
            className={`p-2 ${bookmarkedAyahs.has(ayah.number) ? "bg-yellow-200" : ""}`}
          >
            <Bookmark size={16} />
          </LiquidButton>
          <LiquidButton onClick={() => shareAyah(ayah)} variant="glass" className="p-2">
            <Share size={16} />
          </LiquidButton>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-gray-800 text-right text-2xl leading-relaxed arabic-text font-medium">{ayah.text}</p>

        {ayah.translation && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-gray-700 leading-relaxed">{ayah.translation}</p>
          </div>
        )}

        {showKurdishTranslation && ayah.kurdishTranslation && (
          <div className="bg-blue-50 rounded-2xl p-4">
            <h4 className="text-gray-700 text-sm font-semibold mb-2">Kurdish Translation:</h4>
            <p className="text-gray-600 leading-relaxed kurdish-text">{ayah.kurdishTranslation}</p>
          </div>
        )}
      </div>
    </GlassCard>
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-500">
        <h2 className="text-3xl font-bold text-gray-800 text-center">{t.quran}</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <LoadingSkeleton key={i} lines={3} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">{t.quran}</h2>
        {view === "ayahs" && (
          <div className="flex gap-2">
            {/* Kurdish Translation Toggle */}
            <LiquidButton
              onClick={() => setShowKurdishTranslation(!showKurdishTranslation)}
              variant={showKurdishTranslation ? "primary" : "glass"}
              className="px-3 py-2"
            >
              <Eye size={16} />
              Kurdish
            </LiquidButton>
            {/* Playback speed control */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-white/80 border border-gray-300 rounded-xl px-3 py-1 text-sm text-gray-700"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
            </select>
            <LiquidButton
              onClick={() => {
                setView("surahs")
                setSelectedSurah(null)
                setAyahs([])
                if (currentAudio) {
                  currentAudio.pause()
                  setCurrentAudio(null)
                  setPlayingAyah(null)
                }
              }}
              variant="glass"
            >
              <ArrowLeft size={16} />
              Back
            </LiquidButton>
          </div>
        )}
      </div>

      {view === "surahs" && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Surahs..."
              className="w-full bg-white/80 border border-gray-300 rounded-2xl pl-12 pr-4 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 backdrop-blur-xl"
            />
          </div>

          {/* Surahs List */}
          <div className="space-y-3">{filteredSurahs.map((surah, index) => renderSurahItem(surah, index))}</div>
        </>
      )}

      {view === "ayahs" && selectedSurah && (
        <>
          {/* Surah Header */}
          <GlassCard className="p-6 text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedSurah.name}</h3>
            <p className="text-gray-600 font-medium">{selectedSurah.englishName}</p>
            {selectedSurah.kurdishName && <p className="text-gray-500">{selectedSurah.kurdishName}</p>}
            <div className="flex justify-center gap-4 mt-3">
              <span className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full">
                {selectedSurah.numberOfAyahs} verses
              </span>
              <span className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-full">
                {selectedSurah.revelationType}
              </span>
            </div>
          </GlassCard>

          {/* Audio Controls */}
          {currentAudio && (
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Playing Verse {playingAyah}</span>
                <div className="flex gap-2">
                  <LiquidButton
                    onClick={() => {
                      if (currentAudio) {
                        currentAudio.pause()
                        setCurrentAudio(null)
                        setPlayingAyah(null)
                      }
                    }}
                    variant="glass"
                    className="px-3 py-1"
                  >
                    Stop
                  </LiquidButton>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Ayahs List */}
          {loadingAyahs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <LoadingSkeleton key={i} lines={4} height="h-6" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">{ayahs.map((ayah, index) => renderAyahItem(ayah, index))}</div>
          )}
        </>
      )}
    </div>
  )
}
