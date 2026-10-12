import express from 'express';
import {
  createAttendanceController,
  getAllAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
} from './attendance.controller.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createAttendanceSchema, updateAttendanceSchema } from './attendance.dto.js';
import { authenticate } from '../../core/guards/auth.guard.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllAttendanceController);
router.post('/', validateBody(createAttendanceSchema), createAttendanceController);
router.put('/:id', validateBody(updateAttendanceSchema), updateAttendanceController);
router.patch('/:id', validateBody(updateAttendanceSchema), updateAttendanceController);
router.delete('/:id', deleteAttendanceController);

export default router;
