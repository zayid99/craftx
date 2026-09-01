// Simple in-memory rate limiter. Correct and sufficient as long as CraftX
// runs as a single persistent Node process (true for Hostinger VPS/Managed
// Node.js Hosting). If this ever moves to multiple instances behind a load
// balancer, this would need to move to a shared store (e.g. Redis) instead,
// since each instance would otherwise track its own separate counts.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup so the map doesn't grow unbounded with stale entries
// from users who only ever made one request.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks and increments a fixed-window rate limit for the given key.
 * @param key Unique identifier for this limit bucket, e.g. `ideas:${userId}`
 * @param maxRequests Max requests allowed within the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}