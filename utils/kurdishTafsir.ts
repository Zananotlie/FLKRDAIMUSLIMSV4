"use client"

interface TafsirVerse {
  sura: number
  aya: number
  translation: string
  footnotes?: string
}

interface TafsirSura {
  sura: number
  verses: TafsirVerse[]
}

const TAFSIR_API_BASE = "https://quranenc.com/api/v1/translation"
const KURDISH_TRANSLATION_KEY = "kurdish_bamoki"

export async function fetchKurdishTafsirSura(suraNumber: number): Promise<TafsirSura | null> {
  try {
    const response = await fetch(`${TAFSIR_API_BASE}/sura/${KURDISH_TRANSLATION_KEY}/${suraNumber}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.result && Array.isArray(data.result)) {
      return {
        sura: suraNumber,
        verses: data.result.map((verse: any) => ({
          sura: verse.sura,
          aya: verse.aya,
          translation: verse.translation,
          footnotes: verse.footnotes,
        })),
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching Kurdish tafsir for sura ${suraNumber}:`, error)
    return null
  }
}

export async function fetchKurdishTafsirVerse(suraNumber: number, ayaNumber: number): Promise<TafsirVerse | null> {
  try {
    const response = await fetch(`${TAFSIR_API_BASE}/aya/${KURDISH_TRANSLATION_KEY}/${suraNumber}/${ayaNumber}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (data.result) {
      return {
        sura: data.result.sura,
        aya: data.result.aya,
        translation: data.result.translation,
        footnotes: data.result.footnotes,
      }
    }

    return null
  } catch (error) {
    console.error(`Error fetching Kurdish tafsir for verse ${suraNumber}:${ayaNumber}:`, error)
    return null
  }
}

// Fallback Kurdish translations for offline use
export const OFFLINE_KURDISH_TAFSIR: { [key: string]: TafsirVerse[] } = {
  "1": [
    {
      sura: 1,
      aya: 1,
      translation: "بە ناوی ئەللاهی میهرەبان و بەزەیی",
      footnotes: "سورەتی فاتیحە - کردنەوە",
    },
    {
      sura: 1,
      aya: 2,
      translation: "ستایش بۆ ئەللاه کە پەروەردگاری جیهانیانە",
      footnotes: "هەموو ستایش و پەسن تەنها بۆ ئەللاهە",
    },
    {
      sura: 1,
      aya: 3,
      translation: "میهرەبان و بەزەیی",
      footnotes: "ئەللاه زۆر میهرەبان و بەزەییە",
    },
    {
      sura: 1,
      aya: 4,
      translation: "خاوەنی ڕۆژی لێپرسینەوە",
      footnotes: "ڕۆژی قیامەت و حیساب",
    },
    {
      sura: 1,
      aya: 5,
      translation: "تەنها تۆ دەپەرستین و تەنها لە تۆ یارمەتی دەخوازین",
      footnotes: "پەرستن و یارمەتی خواستن تەنها لە ئەللاهە",
    },
    {
      sura: 1,
      aya: 6,
      translation: "ئێمە بە ڕێگای ڕاست بەڕێوە ببە",
      footnotes: "ڕێگای ئیسلام و ئیمان",
    },
    {
      sura: 1,
      aya: 7,
      translation: "ڕێگای ئەوانەی نیعمەتت پێ بەخشیوون، نەک ئەوانەی تووڕەیی لەسەریانە و نەک ئەوانەی گومڕان",
      footnotes: "ڕێگای پێغەمبەران و ڕاستگۆکان، نەک جولەکە و نەصارا",
    },
  ],
}

export function getOfflineKurdishTafsir(suraNumber: number): TafsirVerse[] {
  return OFFLINE_KURDISH_TAFSIR[suraNumber.toString()] || []
}

export async function getKurdishTafsirWithFallback(suraNumber: number): Promise<TafsirVerse[]> {
  try {
    const onlineTafsir = await fetchKurdishTafsirSura(suraNumber)
    if (onlineTafsir) {
      return onlineTafsir.verses
    }
  } catch (error) {
    console.log("Using offline Kurdish tafsir")
  }

  return getOfflineKurdishTafsir(suraNumber)
}
