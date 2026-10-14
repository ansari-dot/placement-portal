import { StudentService } from './student.service.js';
import {
  buildTemplateWorkbook,
  processBulkImport,
  processBulkDocuments,
} from './student.bulk.service.js';

export const downloadBulkTemplateController = async (req, res, next) => {
  try {
    const wb = await buildTemplateWorkbook();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="student_bulk_import_template.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

export const bulkImportStudentsController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an Excel (.xlsx) file.' });
    }
    const commit = String(req.query.commit || req.body?.commit) === 'true';
    const report = await processBulkImport(req.file.buffer, { commit, actingUser: req.user });
    res.status(200).json({
      success: true,
      message: commit
        ? `${report.created} of ${report.total} students imported`
        : `${report.valid} of ${report.total} rows are ready to import`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUploadDocumentsController = async (req, res, next) => {
  try {
    // Optional parallel array of relative paths (folder uploads: STU12/police.pdf)
    let paths = req.body?.paths;
    if (typeof paths === 'string') paths = [paths];
    const files = (req.files || []).map((f, i) => ({
      ...f,
      relativeName: Array.isArray(paths) && paths[i] ? paths[i] : f.originalname,
    }));
    const report = await processBulkDocuments(files);
    res.status(200).json({
      success: true,
      message: `${report.attached} of ${report.total} documents attached`,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

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
