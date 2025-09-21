import type { Context } from "hono";

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const simpleRateLimit = (
  windowMs: number = 15 * 60 * 1000,
  maxRequests: number = 100,
) => {
  return async (c: Context, next: () => Promise<void>) => {
    // Get client IP (with fallbacks for different deployment scenarios)
    const clientIP =
      c.req.header("CF-Connecting-IP") || // Cloudflare
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() || // General proxy
      c.req.header("X-Real-IP") || // Nginx/Caddy
      c.req.header("X-Forwarded-IP") || // Alternative forwarded IP header
      c.req.header("Remote-Addr") || // Direct connection
      "unknown";

    const now = Date.now();
    const key = `${clientIP}`;
    const record = rateLimitStore.get(key);

    // Clean up expired entries
    if (record && now > record.resetTime) {
      rateLimitStore.delete(key);
    }

    // Check current rate limit
    const currentRecord = rateLimitStore.get(key);
    if (!currentRecord) {
      // First request from this IP
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    } else {
      // Increment request count
      currentRecord.count++;
      if (currentRecord.count > maxRequests) {
        const retryAfter = Math.ceil((currentRecord.resetTime - now) / 1000);
        return c.json({ error: "Too many requests", retryAfter }, 429, {
          "Retry-After": retryAfter.toString(),
        });
      }
    }

    await next();
  };
};
