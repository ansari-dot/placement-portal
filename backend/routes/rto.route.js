import express from 'express';
import { 
  getAllRTOsController, 
  createRTOController, 
  getRTOStatsController, 
  deleteRTOController,
  getRTOByIdController,
  updateRTOController,
  getMyRTOsController,
} from '../controller/rto.controller.js';
import { softAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getAllRTOsController);
router.post('/', softAuth, createRTOController);
router.get('/stats', getRTOStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', softAuth, getMyRTOsController);
router.get('/:id', getRTOByIdController);
router.put('/:id', updateRTOController);
router.delete('/:id', deleteRTOController);

export default router;
