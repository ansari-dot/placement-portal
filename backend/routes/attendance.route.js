import express from 'express';
import {
  createAttendanceController,
  getAllAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
} from '../controller/attendance.controller.js';
import { protectRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllAttendanceController);
router.post('/', createAttendanceController);
router.put('/:id', updateAttendanceController);
router.patch('/:id', updateAttendanceController);
router.delete('/:id', deleteAttendanceController);

export default router;
