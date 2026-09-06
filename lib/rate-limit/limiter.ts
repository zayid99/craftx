/**
 * In-memory fixed-window rate limiter.
 *
 * Correct as long as CraftX runs as a single persistent Node process (true on
 * Hostinger VPS / Managed Node.js Hosting). Multiple instances behind a load
 * balancer would each track separate counts and this would need a shared store.
 *
 * Disabled in development by default. Rate limiting exists to stop abuse in
 * production, not to make local testing miserable. Set RATE_LIMIT_IN_DEV=true
 * in .env.local when you specifically want to test the limiter itself.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const IS_PROD = process.env.NODE_ENV === "production";
const FORCE_IN_DEV = process.env.RATE_LIMIT_IN_DEV === "true";
const ENABLED = IS_PROD || FORCE_IN_DEV;

if (!ENABLED) {
  console.warn(
    "[RateLimit] DISABLED (development mode). Set RATE_LIMIT_IN_DEV=true to enable."
  );
}

// Periodic cleanup so the map doesn't grow unbounded with stale entries.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Seconds until the window resets. Use for the Retry-After header. */
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  if (!ENABLED) {
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  const existing = store.get(key);

  // No entry, or the previous window has expired -> start a fresh window.
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.resetAt - now) / 1000)
    );

    // Diagnostic: if a limit trips unexpectedly, this line shows the real
    // count and how the window was actually behaving.
    console.warn(
      `[RateLimit] BLOCKED key="${key}" count=${existing.count}/${maxRequests} ` +
        `windowMs=${windowMs} resetsIn=${retryAfterSeconds}s ` +
        `resetAt=${new Date(existing.resetAt).toISOString()} ` +
        `now=${new Date(now).toISOString()}`
    );

    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/** Test/admin helper. Clears one key, or everything when called with no args. */
export function resetRateLimit(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}