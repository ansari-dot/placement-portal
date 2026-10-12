import express from 'express';
import {
  getAllIndustriesController,
  createIndustryController,
  updateIndustryController,
  getIndustryStatsController,
  deleteIndustryController,
  getMyIndustriesController,
} from './industry.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllIndustriesController);
router.post('/', createIndustryController);
router.get('/stats', getIndustryStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', getMyIndustriesController);
router.put('/:id', updateIndustryController);
router.delete('/:id', deleteIndustryController);

export default router;
