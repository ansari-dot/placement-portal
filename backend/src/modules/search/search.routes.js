import { Router } from 'express';
import { globalSearchController } from './search.controller.js';
import { authenticate } from '../../core/guards/auth.guard.js';

const router = Router();

router.get('/', authenticate, globalSearchController);

export default router;
