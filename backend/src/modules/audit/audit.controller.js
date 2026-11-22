import { AuditService } from './audit.service.js';

export const getUserLogsController = async (req, res, next) => {
  try {
    const { logs, pagination } = await AuditService.getLogs(req.query);
    res.status(200).json({
      success: true,
      data: logs,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const revertUserLogController = async (req, res, next) => {
  try {
    const result = await AuditService.revertLog(req.params.id, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
