import { StudentService } from './student.service.js';

export const createStudentController = async (req, res, next) => {
  try {
    const student = await StudentService.createStudent(req.body);
    res.status(201).json({
      message: 'Student created successfully',
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStudentsController = async (req, res, next) => {
  try {
    const students = await StudentService.getAllStudents(req.user, req.query.coordinatorId);
    res.status(200).json({
      message: 'Students fetched successfully',
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentByIdController = async (req, res, next) => {
  try {
    const student = await StudentService.getStudentById(req.params.id, req.user);
    res.status(200).json({
      message: 'Student fetched successfully',
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentController = async (req, res, next) => {
  try {
    const student = await StudentService.updateStudent(req.params.id, req.body);
    res.status(200).json({
      message: 'Student updated successfully',
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStudentController = async (req, res, next) => {
  try {
    await StudentService.deleteStudent(req.params.id);
    res.status(200).json({
      message: 'Student deleted successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllStudentsUnfilteredController = async (req, res, next) => {
  try {
    const students = await StudentService.getAllStudentsUnfiltered();
    res.status(200).json({
      message: 'All students fetched successfully',
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const assignCoordinatorController = async (req, res, next) => {
  try {
    const { student, message } = await StudentService.assignCoordinator(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({
      message,
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};
