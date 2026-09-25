import express from 'express';
import { getAllIndustriesController, createIndustryController, updateIndustryController, getIndustryStatsController, deleteIndustryController, getMyIndustriesController } from '../controller/industry.controller.js';
import { softAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getAllIndustriesController);
router.post('/', softAuth, createIndustryController);
router.get('/stats', getIndustryStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', softAuth, getMyIndustriesController);
router.put('/:id', updateIndustryController);
router.delete('/:id', deleteIndustryController);

export default router;
