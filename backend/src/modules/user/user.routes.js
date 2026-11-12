import express from 'express';
import {
  getAllUsersController,
  getUserByIdController,
  getUserStatsController,
  createUserController,
  updateUserController,
  deleteUserController,
  getScoreStatsController,
  getPendingUsersController,
  approveUserController,
  rejectUserController,
  updateUserStatusController,
  reactivateUserController,
  getOnboardingEligibleUsersController,
  getCoordinatorsController,
  getPendingPasswordResetsController,
  approvePasswordResetController,
  rejectPasswordResetController,
} from './user.controller.js';
import { authenticate, softAuth } from '../../core/guards/auth.guard.js';
import { requireAdmin } from '../../core/guards/roles.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from './user.dto.js';

const router = express.Router();

router.get('/score-stats', softAuth, getScoreStatsController);
router.get('/onboarding-eligible', authenticate, getOnboardingEligibleUsersController);
router.get('/coordinators', authenticate, getCoordinatorsController);

router.use(authenticate, requireAdmin);

router.get('/', getAllUsersController);
router.get('/stats', getUserStatsController);
router.get('/pending', getPendingUsersController);
router.get('/signup-requests', getPendingUsersController);
router.get('/pending-password-resets', getPendingPasswordResetsController);
router.post('/:id/approve-password-reset', approvePasswordResetController);
router.post('/:id/reject-password-reset', rejectPasswordResetController);
router.get('/:id', getUserByIdController);
router.post('/', validateBody(createUserSchema), createUserController);
router.put('/:id', validateBody(updateUserSchema), updateUserController);
router.patch('/:id', validateBody(updateUserSchema), updateUserController);
router.post('/:id/approve', approveUserController);
router.patch('/:id/approve', approveUserController);
router.post('/:id/reject', rejectUserController);
router.patch('/:id/reject', rejectUserController);
router.patch('/:id/status', updateUserStatusController);
router.post('/:id/reactivate', reactivateUserController);
router.delete('/:id', deleteUserController);

export default router;
