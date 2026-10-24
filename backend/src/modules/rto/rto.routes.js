import express from 'express';
import {
  getAllRTOsController,
  createRTOController,
  getRTOStatsController,
  deleteRTOController,
  getRTOByIdController,
  updateRTOController,
  getMyRTOsController,
  rtoAutocompleteController,
} from './rto.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireRoles } from '../../core/guards/roles.guard.js';
import { validateBody } from '../../core/middlewares/validate.middleware.js';
import { autocompleteRateLimiter } from '../../core/middlewares/rateLimiter.middleware.js';
import { createRtoSchema, updateRtoSchema } from './rto.dto.js';

const router = express.Router();

// Public autocomplete for registration (strictly rate limited & scoped to 50% name rule)
router.get('/autocomplete', autocompleteRateLimiter, rtoAutocompleteController);

router.use(authenticate);

const canManageRtos = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff');
const canEditRtos = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff', 'RTO Manager', 'RTO');
const isAdminOnly = requireRoles('Administrator', 'Admin');

router.get('/', getAllRTOsController);
router.post('/', canManageRtos, validateBody(createRtoSchema), createRTOController);
router.get('/stats', getRTOStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', getMyRTOsController);
router.get('/:id', getRTOByIdController);
router.put('/:id', canEditRtos, validateBody(updateRtoSchema), updateRTOController);
router.delete('/:id', isAdminOnly, deleteRTOController);

export default router;
