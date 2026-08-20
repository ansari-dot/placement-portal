import express from 'express';
import { getAllRTOsController, createRTOController, getRTOStatsController, deleteRTOController } from '../controller/rto.controller.js';

const router = express.Router();

router.get('/', getAllRTOsController);
router.post('/', createRTOController);
router.get('/stats', getRTOStatsController);
router.delete('/:id', deleteRTOController);

export default router;
