import jwt from 'jsonwebtoken';
import UserModel from '../../modules/user/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

/**
 * Hard authentication guard — blocks request if no valid active session token is found.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.portal_token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Please log in first.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (!user || user.isDeleted || user.status !== 'Active' || user.approved === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive, pending approval, disabled, or no longer exists.',
        code: user?.status === 'Pending' ? 'ACCOUNT_PENDING_APPROVAL' : 'ACCOUNT_UNAVAILABLE',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

/**
 * Account approval check middleware.
 */
export const requireApprovedAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.isDeleted) {
    return res.status(401).json({ success: false, message: 'Account has been deleted.' });
  }

  if (req.user.status === 'Pending' || req.user.approved === false) {
    return res.status(403).json({
      success: false,
      message: 'Account is pending administrator approval.',
      code: 'ACCOUNT_PENDING_APPROVAL',
    });
  }

  if (req.user.status === 'Rejected') {
    return res.status(403).json({
      success: false,
      message: 'Account registration was rejected.',
      code: 'ACCOUNT_REJECTED',
    });
  }

  if (req.user.status !== 'Active') {
    return res.status(403).json({
      success: false,
      message: 'Account is not active or has been disabled.',
      code: 'ACCOUNT_INACTIVE',
    });
  }

  next();
};

/**
 * Soft auth guard — attaches req.user if a valid token is present, but never blocks.
 */
export const softAuth = async (req, res, next) => {
  try {
    if (req.user) return next();
    let token = req.cookies?.portal_token;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (user && !user.isDeleted && user.status === 'Active' && user.approved !== false) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

// Aliases for full backwards compatibility
export const protectRoute = authenticate;
