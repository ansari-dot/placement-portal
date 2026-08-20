import express from 'express';
import {
  getAllJobsController,
  createJobController,
  getJobStatsController,
  deleteJobController,
  updateJobController,
} from '../controller/job.controller.js';

const router = express.Router();

router.get('/', getAllJobsController);
router.post('/', createJobController);
router.get('/stats', getJobStatsController);
router.delete('/:id', deleteJobController);
router.patch('/:id', updateJobController);

export default router;
