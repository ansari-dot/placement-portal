import express from 'express';
import {
  loginController,
  signupController,
  logoutController,
  getMeController,
  heartbeatController,
  getPresenceController,
} from './auth.controller.js';
import { authenticate, softAuth } from '../../core/guards/auth.guard.js';
import { authRateLimiter } from '../../core/middlewares/rateLimiter.middleware.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { loginSchema, signupSchema } from './auth.dto.js';

const router = express.Router();

router.post('/login', authRateLimiter, validateBody(loginSchema), loginController);
router.post('/signup', authRateLimiter, validateBody(signupSchema), signupController);
router.post('/logout', softAuth, logoutController);
router.get('/me', authenticate, getMeController);
router.post('/heartbeat', authenticate, heartbeatController);
router.get('/presence', authenticate, getPresenceController);

export default router;
