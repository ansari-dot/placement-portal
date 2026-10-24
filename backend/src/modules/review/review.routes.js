import express from 'express';
import {
  createReviewController,
  getMyReviewsController,
  getAllReviewsAdminController,
  updateReviewStatusController,
  deleteReviewController,
  getPublicApprovedReviewsController,
} from './review.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireRoles } from '../../core/guards/roles.guard.js';
import { apiRateLimiter } from '../../core/middlewares/rateLimiter.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createReviewSchema, updateReviewStatusSchema } from './review.dto.js';

const router = express.Router();

// Public endpoint for homepage slider (approved reviews only)
router.get('/public', apiRateLimiter, getPublicApprovedReviewsController);

// Authenticated user actions
router.post('/', authenticate, validateBody(createReviewSchema), createReviewController);
router.get('/my', authenticate, getMyReviewsController);

// Administrator moderation endpoints
const isAdmin = requireRoles('Administrator', 'Admin');
router.get('/admin', authenticate, isAdmin, getAllReviewsAdminController);
router.patch('/admin/:id/status', authenticate, isAdmin, validateBody(updateReviewStatusSchema), updateReviewStatusController);
router.delete('/admin/:id', authenticate, isAdmin, deleteReviewController);

export default router;
