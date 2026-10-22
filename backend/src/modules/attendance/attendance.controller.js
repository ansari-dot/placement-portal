import { AttendanceService } from './attendance.service.js';

export const createAttendanceController = async (req, res, next) => {
  try {
    const attendance = await AttendanceService.createAttendance(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Attendance record saved successfully',
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttendanceController = async (req, res, next) => {
  try {
    const records = await AttendanceService.getAllAttendance(req.query, req.user);
    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAttendanceController = async (req, res, next) => {
  try {
    const record = await AttendanceService.updateAttendance(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAttendanceController = async (req, res, next) => {
  try {
    await AttendanceService.deleteAttendance(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
