import express from 'express';
import {
  loginController,
  logoutController,
  getMeController,
} from '../controller/auth.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', loginController);
router.post('/logout', logoutController);
router.get('/me', protectRoute, getMeController);

export default router;
