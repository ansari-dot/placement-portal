import { AuthService } from './auth.service.js';

export const loginController = async (req, res, next) => {
  try {
    const { user, token } = await AuthService.login(req.body);

    res.cookie('portal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60 * 60 * 1000, // 5 hours
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user,
    });
  } catch (error) {
    if (error.code) {
      return res.status(error.statusCode || 403).json({
        success: false,
        code: error.code,
        message: error.message,
      });
    }
    next(error);
  }
};

export const signupController = async (req, res, next) => {
  try {
    const result = await AuthService.signup(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration request submitted successfully! Please wait for admin approval.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    await AuthService.logout(req.user);

    res.clearCookie('portal_token', {
      httpOnly: true,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMeController = async (req, res, next) => {
  try {
    if (req.user?._id) {
      await AuthService.heartbeat(req.user);
    }
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

export const heartbeatController = async (req, res, next) => {
  try {
    const timestamp = await AuthService.heartbeat(req.user);
    res.status(200).json({
      success: true,
      timestamp,
    });
  } catch (error) {
    next(error);
  }
};

export const getPresenceController = async (req, res, next) => {
  try {
    const presence = await AuthService.getPresence(req.user);
    res.status(200).json({
      success: true,
      ...presence,
    });
  } catch (error) {
    next(error);
  }
};

export const rtoAutocompleteController = async (req, res, next) => {
  try {
    const q = String(req.query.q || req.query.query || req.query.search || '');
    const results = await AuthService.autocompleteRtos(q);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const industryAutocompleteController = async (req, res, next) => {
  try {
    const q = String(req.query.q || req.query.query || req.query.search || '');
    const results = await AuthService.autocompleteIndustries(q);
    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};


