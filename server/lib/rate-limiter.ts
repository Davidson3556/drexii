/**
 * Simple in-memory sliding-window rate limiter.
 * Resets per key after `windowMs` milliseconds.
 *
 * Not persistent across server restarts — fine for development/hackathon.
 * For production, swap the Map for a Redis store.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 *
 * @param key     Unique identifier (userId or IP address)
 * @param limit   Max requests allowed in the window (default 20)
 * @param windowMs Window duration in ms (default 10 minutes)
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 10 * 60 * 1000
): { allowed: boolean, remaining: number, resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

/** Expose current window info without incrementing (for headers). */
export function getRateLimitInfo(
  key: string,
  limit = 20,
  windowMs = 10 * 60 * 1000
): { remaining: number, resetAt: number } {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    return { remaining: limit, resetAt: now + windowMs }
  }
  return { remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt }
}
