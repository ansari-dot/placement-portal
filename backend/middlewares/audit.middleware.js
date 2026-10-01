import UserLogModel from '../model/userLog.model.js';

const ignoredPaths = new Set(['/auth/login', '/auth/logout', '/auth/heartbeat']);
const sensitiveKey = /password|token|secret|authorization|cookie/i;
const base64Value = /^(data:[^;]+;base64,)?[a-z0-9+/]{500,}={0,2}$/i;

const safeValue = (value, depth = 0) => {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (value?._bsontype === 'ObjectId' || value?._bsontype === 'ObjectID') return value.toString();
  if (typeof value.toObject === 'function') value = value.toObject();
  if (typeof value === 'string') {
    if (base64Value.test(value)) return '[binary data omitted]';
    return value.length > 1500 ? `${value.slice(0, 1500)}… [truncated]` : value;
  }
  if (depth >= 5) return '[nested data omitted]';
  if (Array.isArray(value)) return value.slice(0, 50).map(item => safeValue(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !sensitiveKey.test(key))
      .slice(0, 100)
      .map(([key, item]) => [key, safeValue(item, depth + 1)]));
  }
  return String(value);
};

const resourceName = (path) => {
  if (path === '/auth/signup') return 'user';
  const segments = path.split('?')[0].split('/').filter(Boolean);
  if (segments[0] === 'workflows') {
    if (segments.includes('requests')) return 'placement request';
    if (segments.includes('appointments')) return 'appointment';
    if (segments.includes('internships')) return 'placement';
  }
  const segment = segments[0] || 'portal';
  return segment.replace(/s$/, '') || segment;
};

export const auditMutations = (req, res, next) => {
  const method = req.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || ignoredPaths.has(req.path)) {
    return next();
  }

  const sendJson = res.json.bind(res);
  res.json = (payload) => {
    res.locals.auditResponse = payload;
    return sendJson(payload);
  };

  res.once('finish', () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;

    const actor = req.user;
    const resource = resourceName(req.path);
    const actionVerb = { POST: 'created', PUT: 'updated', PATCH: 'updated', DELETE: 'deleted' }[method];
    const routeId = req.params?.id || req.params?.studentId || req.params?.requestId || req.params?.appointmentId || '';
    const changes = safeValue({
      submitted: { body: req.body || {}, params: req.params || {} },
      result: res.locals.auditResponse || null,
    });

    UserLogModel.create({
      actorId: actor?._id || null,
      actorName: actor?.name || (req.path === '/auth/signup' ? (req.body?.name || 'New signup') : 'Unauthenticated / system'),
      actorEmail: actor?.email || (req.path === '/auth/signup' ? (req.body?.email || '') : ''),
      actorRole: actor?.role || (req.path === '/auth/signup' ? (req.body?.role || '') : ''),
      action: `${resource} ${actionVerb}`,
      method,
      path: req.originalUrl.split('?')[0],
      resource,
      resourceId: String(routeId || req.body?._id || req.body?.id || ''),
      changes,
      statusCode: res.statusCode,
      ipAddress: req.ip || req.socket?.remoteAddress || '',
      userAgent: req.get('user-agent') || '',
    }).catch(error => console.error('[UserLog] Failed to record portal change:', error.message));
  });

  next();
};
