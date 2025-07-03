"use client"

interface CacheItem {
  data: any
  timestamp: number
  expiry: number
}

const cache = new Map<string, CacheItem>()

export function getCachedData(key: string): any | null {
  const item = cache.get(key)
  if (!item) return null

  const now = Date.now()
  if (now > item.expiry) {
    cache.delete(key)
    return null
  }

  return item.data
}

export function setCachedData(key: string, data: any, ttl = 300000): void {
  const now = Date.now()
  cache.set(key, {
    data,
    timestamp: now,
    expiry: now + ttl,
  })
}

export function clearCache(): void {
  cache.clear()
}

export function getCacheSize(): number {
  return cache.size
}

export function removeCachedData(key: string): boolean {
  return cache.delete(key)
}

export function getAllCacheKeys(): string[] {
  return Array.from(cache.keys())
}

export function cleanExpiredCache(): number {
  const now = Date.now()
  let removedCount = 0

  for (const [key, item] of cache.entries()) {
    if (now > item.expiry) {
      cache.delete(key)
      removedCount++
    }
  }

  return removedCount
}

// Auto-cleanup expired cache items every 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      cleanExpiredCache()
    },
    5 * 60 * 1000,
  )
}
