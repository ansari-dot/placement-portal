import express from 'express';
import { getUserLogsController } from '../controller/userLog.controller.js';
import { protectRoute, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protectRoute, requireAdmin, getUserLogsController);

export default router;
