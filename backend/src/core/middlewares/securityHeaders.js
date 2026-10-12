/**
 * Security Headers Middleware
 * Adds essential HTTP security headers recommended by OWASP
 */
export const securityHeaders = (req, res, next) => {
  // Prevent browser MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking by forbidding iframe embedding from foreign origins
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Enable browser cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTP Strict Transport Security (HSTS) in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove Express fingerprinting
  res.removeHeader('X-Powered-By');

  next();
};

export default securityHeaders;
