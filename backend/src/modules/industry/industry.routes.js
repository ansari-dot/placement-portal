import express from 'express';
import {
  getAllIndustriesController,
  createIndustryController,
  updateIndustryController,
  getIndustryStatsController,
  deleteIndustryController,
  getMyIndustriesController,
  industryAutocompleteController,
} from './industry.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';
import { requireRoles } from '../../core/guards/roles.guard.js';
import { autocompleteRateLimiter } from '../../core/middlewares/rateLimiter.middleware.js';

const router = express.Router();

// Public rate-limited autocomplete route for industry registration
router.get('/autocomplete', autocompleteRateLimiter, industryAutocompleteController);

router.use(authenticate);


const canManageIndustries = requireRoles('Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff');
const isAdminOnly = requireRoles('Administrator', 'Admin');

router.get('/', getAllIndustriesController);
router.post('/', canManageIndustries, createIndustryController);
router.get('/stats', getIndustryStatsController);
// Must be before /:id to avoid route param collision
router.get('/my', getMyIndustriesController);
router.put('/:id', canManageIndustries, updateIndustryController);
router.delete('/:id', isAdminOnly, deleteIndustryController);

export default router;
