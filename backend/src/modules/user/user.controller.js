import { UserService } from './user.service.js';

export const getAllUsersController = async (req, res, next) => {
  try {
    const users = await UserService.getAllUsers(req.query);
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingUsersController = async (req, res, next) => {
  try {
    const pendingUsers = await UserService.getPendingUsers();
    res.status(200).json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const approveUserController = async (req, res, next) => {
  try {
    const user = await UserService.approveUser(req.params.id);
    res.status(200).json({
      success: true,
      message: `${user.name}'s account has been approved`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectUserController = async (req, res, next) => {
  try {
    const user = await UserService.rejectUser(req.params.id);
    res.status(200).json({
      success: true,
      message: `${user.name}'s registration request has been rejected`,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStatsController = async (req, res, next) => {
  try {
    const stats = await UserService.getUserStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const createUserController = async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const user = await UserService.updateUser(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const user = await UserService.deleteUser(req.params.id);
    res.status(200).json({
      success: true,
      message: `${user.name} was deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const getScoreStatsController = async (req, res, next) => {
  try {
    const rows = await UserService.getScoreStats(req.user);
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};

export const getOnboardingEligibleUsersController = async (req, res, next) => {
  try {
    const users = await UserService.getOnboardingEligibleUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
