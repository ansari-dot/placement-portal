import express from 'express';
import { getUserLogsController } from './audit.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireAdmin } from '../../core/guards/roles.guard.js';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getUserLogsController);

export default router;
