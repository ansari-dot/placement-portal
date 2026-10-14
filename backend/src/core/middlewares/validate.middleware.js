/**
 * Express middleware for validating request data against a Zod schema.
 */
export const validateBody = (schema) => (req, res, next) => {
  if (!schema) return next();
  const originalKeys = new Set(Object.keys(req.body || {}));
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    const message = errors.map((e) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ') || 'Validation failed';
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }
  // For updates (partial schemas): only keep fields that were actually sent,
  // not fields that Zod filled in via .default() — prevents overwriting DB values
  const parsed = result.data;
  const isPartial = Object.keys(parsed).some(k => !originalKeys.has(k));
  if (isPartial) {
    req.body = Object.fromEntries(Object.entries(parsed).filter(([k]) => originalKeys.has(k)));
  } else {
    req.body = parsed;
  }
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  if (!schema) return next();
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    const message = errors.map((e) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ') || 'Query validation failed';
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }
  req.query = result.data;
  next();
};

export const validateParams = (schema) => (req, res, next) => {
  if (!schema) return next();
  const result = schema.safeParse(req.params);
  if (!result.success) {
    const errors = result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    const message = errors.map((e) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(', ') || 'Params validation failed';
    return res.status(400).json({
      success: false,
      message,
      errors,
    });
  }
  req.params = result.data;
  next();
};
