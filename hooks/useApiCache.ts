"use client"

import { useCallback } from "react"

interface CacheItem {
  data: any
  timestamp: number
  expiry: number
}

const cache = new Map<string, CacheItem>()

export function useApiCache() {
  const getCachedData = useCallback((key: string) => {
    const item = cache.get(key)
    if (!item) return null

    const now = Date.now()
    if (now > item.expiry) {
      cache.delete(key)
      return null
    }

    return item.data
  }, [])

  const setCachedData = useCallback((key: string, data: any, ttl = 300000) => {
    const now = Date.now()
    cache.set(key, {
      data,
      timestamp: now,
      expiry: now + ttl,
    })
  }, [])

  const clearCache = useCallback(() => {
    cache.clear()
  }, [])

  const getCacheSize = useCallback(() => {
    return cache.size
  }, [])

  return {
    getCachedData,
    setCachedData,
    clearCache,
    getCacheSize,
  }
}
