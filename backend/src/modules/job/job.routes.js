import express from 'express';
import {
  getAllJobsController,
  createJobController,
  getJobStatsController,
  deleteJobController,
  updateJobController,
} from './job.controller.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createJobSchema, updateJobSchema } from './job.dto.js';
import { softAuth } from '../../core/guards/auth.guard.js';

const router = express.Router();

router.use(softAuth);

router.get('/', getAllJobsController);
router.post('/', validateBody(createJobSchema), createJobController);
router.get('/stats', getJobStatsController);
router.delete('/:id', deleteJobController);
router.patch('/:id', validateBody(updateJobSchema), updateJobController);

export default router;
