import express from 'express';
import {
  loginController,
  logoutController,
  getMeController,
  heartbeatController,
  getPresenceController,
} from '../controller/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/me', protectRoute, getMeController);
router.post('/heartbeat', protectRoute, heartbeatController);
router.get('/presence', protectRoute, getPresenceController);

export default router;
