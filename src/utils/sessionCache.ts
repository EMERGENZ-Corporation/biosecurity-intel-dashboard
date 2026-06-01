// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 EMERGENZ Corporation
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttlMs: number
}

export function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() - entry.timestamp < entry.ttlMs) return entry.data
    sessionStorage.removeItem(key)
    return null
  } catch {
    return null
  }
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttlMs }
    sessionStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // sessionStorage unavailable (private browse, quota exceeded) — silently skip
  }
}

export function clearCache(key: string): void {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // ignore
  }
}

/** Returns true if the key was set more recently than ttlMs ago. */
export function isFresh(key: string): boolean {
  return getCached(key) !== null
}
