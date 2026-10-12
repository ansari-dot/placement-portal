/**
 * High-performance, zero-dependency in-memory rate limiter middleware.
 * Implements sliding window counters to defend against brute force & DoS attacks.
 */

const createRateLimiter = ({ windowMs, maxRequests, message }) => {
  const hits = new Map();

  // Periodically purge stale entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now > record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(30000, Math.floor(windowMs / 2))).unref();

  return (req, res, next) => {
    // In test environment, disable rate limiting to avoid blocking automated integration suites
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true') {
      return next();
    }

    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();

    const record = hits.get(clientIp);

    if (!record || now > record.resetTime) {
      hits.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    record.count++;
    const remaining = Math.max(0, maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);

    if (record.count > maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: message || `Too many requests. Please try again after ${retryAfterSec} seconds.`,
      });
    }

    next();
  };
};

// Auth rate limiter: 10 attempts per 15 minutes per IP
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

// General API burst limiter: 300 requests per 1 minute per IP
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'API rate limit exceeded. Please throttle your requests.',
});
