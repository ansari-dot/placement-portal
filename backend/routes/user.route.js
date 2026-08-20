import express from 'express';
import {
  getAllUsersController,
  getUserStatsController,
  createUserController,
  updateUserController,
  deleteUserController,
} from '../controller/user.controller.js';

const router = express.Router();

router.get('/', getAllUsersController);
router.get('/stats', getUserStatsController);
router.post('/', createUserController);
router.put('/:id', updateUserController);
router.patch('/:id', updateUserController);
router.delete('/:id', deleteUserController);

export default router;
