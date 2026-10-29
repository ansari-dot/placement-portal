import express from 'express';
import {
  createReviewController,
  createPublicReviewController,
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
import { createReviewSchema, createPublicReviewSchema, updateReviewStatusSchema } from './review.dto.js';

const router = express.Router();

// Public endpoints for webmantis-placement website
router.get('/public', apiRateLimiter, getPublicApprovedReviewsController);
router.post('/public', apiRateLimiter, validateBody(createPublicReviewSchema), createPublicReviewController);
router.post('/submit', apiRateLimiter, validateBody(createPublicReviewSchema), createPublicReviewController);

// Authenticated user actions
router.post('/', authenticate, validateBody(createReviewSchema), createReviewController);
router.get('/my', authenticate, getMyReviewsController);

// Administrator moderation endpoints
const isAdmin = requireRoles('Administrator', 'Admin');
router.get('/admin', authenticate, isAdmin, getAllReviewsAdminController);
router.patch('/admin/:id/status', authenticate, isAdmin, validateBody(updateReviewStatusSchema), updateReviewStatusController);
router.delete('/admin/:id', authenticate, isAdmin, deleteReviewController);

export default router;
