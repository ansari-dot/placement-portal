/**
 * Canonical role alias mappings to ensure seamless compatibility between
 * project database conventions and security specification role names.
 */
const ROLE_ALIASES = {
  Administrator: ['Administrator', 'Admin'],
  Admin: ['Administrator', 'Admin'],
  Coordinator: ['Coordinator', 'Placement Coordinator'],
  'Placement Coordinator': ['Coordinator', 'Placement Coordinator'],
  'RTO Manager': ['RTO Manager', 'RTO'],
  RTO: ['RTO Manager', 'RTO'],
  Industry: ['Industry', 'Industry/Host'],
  'Industry/Host': ['Industry', 'Industry/Host'],
  Student: ['Student'],
  Staff: ['Staff'],
};

/**
 * Role-based authorization guard.
 * Supports any number of allowed roles, dynamically resolving role aliases.
 */
export const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const userRole = req.user.role;
  const expandedAllowed = new Set();

  for (const role of allowedRoles) {
    expandedAllowed.add(role);
    if (ROLE_ALIASES[role]) {
      ROLE_ALIASES[role].forEach((alias) => expandedAllowed.add(alias));
    }
  }

  if (!expandedAllowed.has(userRole)) {
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
export const requireAdmin = requireRoles('Administrator', 'Admin');
