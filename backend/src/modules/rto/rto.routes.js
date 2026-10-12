import express from 'express';
import {
  getAllRTOsController,
  createRTOController,
  getRTOStatsController,
  deleteRTOController,
  getRTOByIdController,
  updateRTOController,
  getMyRTOsController,
} from './rto.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { createRtoSchema, updateRtoSchema } from './rto.dto.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getAllRTOsController);
router.post('/', validateBody(createRtoSchema), createRTOController);
router.get('/stats', getRTOStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', getMyRTOsController);
router.get('/:id', getRTOByIdController);
router.put('/:id', validateBody(updateRtoSchema), updateRTOController);
router.delete('/:id', deleteRTOController);

export default router;
