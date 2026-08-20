import express from 'express';
import {
  getAllNotificationsController,
  createNotificationController,
  markReadController,
  markAllReadController,
  deleteNotificationController,
  clearAllNotificationsController,
} from '../controller/notification.controller.js';

const router = express.Router();

router.get('/', getAllNotificationsController);
router.post('/', createNotificationController);
router.patch('/read-all', markAllReadController);
router.patch('/:id/read', markReadController);
router.delete('/clear-all', clearAllNotificationsController);
router.delete('/:id', deleteNotificationController);

export default router;
