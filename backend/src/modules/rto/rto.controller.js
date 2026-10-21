import { RtoService } from './rto.service.js';

export const getAllRTOsController = async (req, res, next) => {
  try {
    const rtos = await RtoService.getAllRtos(req.query, req.user);
    res.status(200).json({ success: true, data: rtos });
  } catch (error) {
    next(error);
  }
};

export const getRTOByIdController = async (req, res, next) => {
  try {
    const rto = await RtoService.getRtoById(req.params.id, req.user);
    res.status(200).json({ success: true, data: rto });
  } catch (error) {
    next(error);
  }
};

export const createRTOController = async (req, res, next) => {
  try {
    const rto = await RtoService.createRto(req.body, req.user);
    res.status(201).json({ success: true, message: 'RTO created successfully', data: rto });
  } catch (error) {
    next(error);
  }
};

export const updateRTOController = async (req, res, next) => {
  try {
    const rto = await RtoService.updateRto(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, message: 'RTO updated successfully', data: rto });
  } catch (error) {
    next(error);
  }
};

export const getRTOStatsController = async (req, res, next) => {
  try {
    const stats = await RtoService.getRtoStats(req.user);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const deleteRTOController = async (req, res, next) => {
  try {
    await RtoService.deleteRto(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'RTO deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMyRTOsController = async (req, res, next) => {
  try {
    const rtos = await RtoService.getMyRtos(req.user);
    res.status(200).json({ success: true, data: rtos });
  } catch (error) {
    next(error);
  }
};
