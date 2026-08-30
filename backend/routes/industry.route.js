import express from 'express';
import { getAllIndustriesController, createIndustryController, updateIndustryController, getIndustryStatsController, deleteIndustryController } from '../controller/industry.controller.js';

const router = express.Router();

router.get('/', getAllIndustriesController);
router.post('/', createIndustryController);
router.get('/stats', getIndustryStatsController);
router.put('/:id', updateIndustryController);
router.delete('/:id', deleteIndustryController);

export default router;
