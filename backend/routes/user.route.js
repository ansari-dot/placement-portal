import express from 'express';
import {
  getAllUsersController,
  getUserStatsController,
  createUserController,
  updateUserController,
  deleteUserController,
  getScoreStatsController,
} from '../controller/user.controller.js';
import { softAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getAllUsersController);
router.get('/stats', getUserStatsController);
// Must be before /:id to avoid route param collision
router.get('/score-stats', softAuth, getScoreStatsController);
router.post('/', createUserController);
router.put('/:id', updateUserController);
router.patch('/:id', updateUserController);
router.delete('/:id', deleteUserController);

export default router;
