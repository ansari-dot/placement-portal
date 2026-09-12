import express from 'express';
import { 
  getAllRTOsController, 
  createRTOController, 
  getRTOStatsController, 
  deleteRTOController,
  getRTOByIdController,
  updateRTOController
} from '../controller/rto.controller.js';

const router = express.Router();

router.get('/', getAllRTOsController);
router.post('/', createRTOController);
router.get('/stats', getRTOStatsController);
router.get('/:id', getRTOByIdController);
router.put('/:id', updateRTOController);
router.delete('/:id', deleteRTOController);

export default router;
