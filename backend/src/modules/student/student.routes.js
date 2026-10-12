import express from 'express';
import {
  createStudentController,
  getAllStudentsController,
  getAllStudentsUnfilteredController,
  getStudentByIdController,
  updateStudentController,
  deleteStudentController,
  assignCoordinatorController,
} from './student.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { studentSchema } from './student.dto.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validateBody(studentSchema), createStudentController);
router.get('/', getAllStudentsController);
router.get('/all', getAllStudentsUnfilteredController);
router.get('/:id', getStudentByIdController);
router.put('/:id', validateBody(studentSchema.partial()), updateStudentController);
router.patch('/:id/assign-coordinator', assignCoordinatorController);
router.delete('/:id', deleteStudentController);

export default router;
