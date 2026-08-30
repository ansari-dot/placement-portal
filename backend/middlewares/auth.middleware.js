import jwt from 'jsonwebtoken';
import UserModel from '../model/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

// Hard auth — blocks request if no valid token
export const protectRoute = async (req, res, next) => {
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

    if (!user || user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'User account is inactive or no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

// Soft auth — attaches req.user if a valid token is present, but NEVER blocks.
// Lets endpoints work anonymously while still being able to filter by coordinator
// when a logged-in user is making the request.
export const softAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.portal_token;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next(); // no token — proceed without req.user

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);

    if (user && user.status === 'Active') req.user = user;
    next();
  } catch {
    next(); // invalid/expired token — proceed without req.user
  }
};
