import express from 'express';
import { getAllIndustriesController, createIndustryController, getIndustryStatsController, deleteIndustryController } from '../controller/industry.controller.js';

const router = express.Router();

router.get('/', getAllIndustriesController);
router.post('/', createIndustryController);
router.get('/stats', getIndustryStatsController);
router.delete('/:id', deleteIndustryController);

export default router;
