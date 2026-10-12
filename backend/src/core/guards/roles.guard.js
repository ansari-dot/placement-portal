/**
 * Role-based authorization guard.
 * Supports any number of allowed roles.
 */
export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of: ${allowedRoles.join(', ')}.`,
    });
  }

  next();
};

/**
 * Convenience admin guard.
 */
export const requireAdmin = requireRoles('Administrator');
