import express from 'express';
import {
  getAllUsersController,
  getUserStatsController,
  createUserController,
  updateUserController,
  deleteUserController,
  getScoreStatsController,
  getPendingUsersController,
  approveUserController,
  rejectUserController,
  getOnboardingEligibleUsersController,
} from './user.controller.js';
import { authenticate, softAuth } from '../../core/guards/auth.guard.js';
import { requireAdmin } from '../../core/guards/roles.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from './user.dto.js';

const router = express.Router();

router.get('/score-stats', softAuth, getScoreStatsController);
router.get('/onboarding-eligible', authenticate, getOnboardingEligibleUsersController);

router.use(authenticate, requireAdmin);

router.get('/', getAllUsersController);
router.get('/stats', getUserStatsController);
router.get('/pending', getPendingUsersController);
router.post('/', validateBody(createUserSchema), createUserController);
router.put('/:id', validateBody(updateUserSchema), updateUserController);
router.patch('/:id', validateBody(updateUserSchema), updateUserController);
router.patch('/:id/approve', approveUserController);
router.patch('/:id/reject', rejectUserController);
router.delete('/:id', deleteUserController);

export default router;
