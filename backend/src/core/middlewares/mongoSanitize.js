/**
 * NoSQL Injection Sanitization Middleware
 * Recursively strips keys starting with '$' or containing '.' from req.body, req.query, and req.params
 * to prevent MongoDB operator injection.
 */

const sanitizeObject = (target) => {
  if (!target || typeof target !== 'object') return target;

  if (Array.isArray(target)) {
    return target.map(sanitizeObject);
  }

  for (const key of Object.keys(target)) {
    // Prohibit MongoDB query operators like $gt, $ne, $where
    if (key.startsWith('$') || key.includes('.')) {
      delete target[key];
    } else if (typeof target[key] === 'object' && target[key] !== null) {
      sanitizeObject(target[key]);
    }
  }

  return target;
};

export const mongoSanitize = (req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  next();
};

export default mongoSanitize;
