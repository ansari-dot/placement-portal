import express from 'express';
import {
  getAllNotificationsController,
  createNotificationController,
  markReadController,
  markAllReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from './notification.controller.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createNotificationSchema } from './notification.dto.js';
import { softAuth } from '../../core/guards/auth.guard.js';

const router = express.Router();

router.use(softAuth);

router.get('/', getAllNotificationsController);
router.post('/', validateBody(createNotificationSchema), createNotificationController);
router.patch('/read-all', markAllReadController);
router.patch('/:id/read', markReadController);
router.delete('/clear-all', clearAllNotificationsController);
router.delete('/:id', deleteNotificationController);

export default router;
