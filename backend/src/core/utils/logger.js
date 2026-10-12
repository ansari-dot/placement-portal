/**
 * Structured Application Logger
 * Provides environment-aware, standardized logging with sensitive data masking.
 */

const SENSITIVE_KEYS = ['password', 'token', 'jwt', 'secret', 'authorization', 'cookie', 'smtp_pass'];

const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const masked = {};
  for (const [key, val] of Object.entries(data)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      masked[key] = '***REDACTED***';
    } else if (typeof val === 'object' && val !== null) {
      masked[key] = maskSensitiveData(val);
    } else {
      masked[key] = val;
    }
  }
  return masked;
};

const formatLog = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(meta ? { meta: maskSensitiveData(meta) } : {}),
  };

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  const metaStr = meta ? ` ${JSON.stringify(maskSensitiveData(meta))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (msg, meta) => console.log(formatLog('info', msg, meta)),
  warn: (msg, meta) => console.warn(formatLog('warn', msg, meta)),
  error: (msg, meta) => console.error(formatLog('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(formatLog('debug', msg, meta));
    }
  },
};

export default logger;
