const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateMap) {
    if (now > value.resetAt) {
      rateMap.delete(key);
    }
  }
}, 60_000);

/**
 * Simple in-memory rate limiter.
 * @param key - unique identifier (e.g. IP + endpoint)
 * @param limit - max requests per window
 * @param windowMs - time window in milliseconds
 * @returns { success: boolean, remaining: number }
 */
export function rateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: limit - entry.count };
}
