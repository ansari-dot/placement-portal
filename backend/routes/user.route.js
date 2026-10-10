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
} from '../controller/user.controller.js';
import { protectRoute, requireAdmin, softAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public/Soft routes & routes accessible to staff/coordinators (must be before /:id)
router.get('/score-stats', softAuth, getScoreStatsController);
router.get('/onboarding-eligible', protectRoute, getOnboardingEligibleUsersController);

// The Users section, approvals, and account controls are administrator-only.
router.use(protectRoute, requireAdmin);

router.get('/', getAllUsersController);
router.get('/stats', getUserStatsController);
router.get('/pending', getPendingUsersController);
router.post('/', createUserController);
router.put('/:id', updateUserController);
router.patch('/:id', updateUserController);
router.patch('/:id/approve', approveUserController);
router.patch('/:id/reject', rejectUserController);
router.delete('/:id', deleteUserController);

export default router;
