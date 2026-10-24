import { StudentService } from './student.service.js';
import {
  buildTemplateWorkbook,
  processBulkImport,
  processBulkDocuments,
} from './student.bulk.service.js';
import { sanitizeStudentDataForRole } from '../../core/utils/rbacSanitizer.js';

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
    const student = await StudentService.createStudent(req.body, { actingUser: req.user });
    res.status(201).json({
      message: 'Student created successfully',
      success: true,
      data: sanitizeStudentDataForRole(student, req.user?.role),
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
    const student = await StudentService.updateStudent(req.params.id, req.body, req.user);
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
    await StudentService.deleteStudent(req.params.id, req.user);
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
    const students = await StudentService.getAllStudentsUnfiltered(req.user);
    res.status(200).json({
      message: 'All students fetched successfully',
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

export const repairStudentRtoController = async (req, res, next) => {
  try {
    const StudentModel = (await import('./student.model.js')).default;
    const RtoModel = (await import('../rto/rto.model.js')).default;
    const PaymentModel = (await import('../payment/payment.model.js')).default;

    const allRtos = await RtoModel.find({}, { _id: 1, name: 1, code: 1 }).lean();
    const rtoIdToDoc = new Map(allRtos.map(r => [String(r._id), r]));
    const rtoNameToDoc = new Map(allRtos.map(r => [r.name.trim().toLowerCase(), r]));

    // Find all students with missing or unlinked RTO
    const broken = await StudentModel.find({
      $or: [
        { assignedRto: '' },
        { assignedRto: { $exists: false } },
        { rtoId: null },
        { rtoId: { $exists: false } },
      ],
      studentType: { $ne: 'Independent Student' },
    }).lean();

    const payments = await PaymentModel.find(
      { student: { $in: broken.map(s => s._id) } },
      { student: 1, rto: 1 }
    ).lean();
    const payMap = new Map(
      payments.filter(p => p.rto && p.rto !== 'Independent Student').map(p => [String(p.student), p.rto])
    );

    const ops = [];
    const repaired = [];

    // Optional default RTO passed in body or single RTO fallback
    const requestedRto = req.body?.rtoName || req.body?.defaultRto;
    const fallbackRto = requestedRto
      ? rtoNameToDoc.get(String(requestedRto).trim().toLowerCase())
      : (allRtos.length === 1 ? allRtos[0] : null);

    for (const s of broken) {
      let matchedDoc = null;

      // 1. By existing rtoId
      if (s.rtoId && rtoIdToDoc.has(String(s.rtoId))) {
        matchedDoc = rtoIdToDoc.get(String(s.rtoId));
      }
      // 2. By existing assignedRto
      if (!matchedDoc && s.assignedRto && rtoNameToDoc.has(s.assignedRto.trim().toLowerCase())) {
        matchedDoc = rtoNameToDoc.get(s.assignedRto.trim().toLowerCase());
      }
      // 3. By institute
      if (!matchedDoc && s.institute && rtoNameToDoc.has(s.institute.trim().toLowerCase())) {
        matchedDoc = rtoNameToDoc.get(s.institute.trim().toLowerCase());
      }
      // 4. By payment record
      const payRtoName = payMap.get(String(s._id));
      if (!matchedDoc && payRtoName && rtoNameToDoc.has(payRtoName.trim().toLowerCase())) {
        matchedDoc = rtoNameToDoc.get(payRtoName.trim().toLowerCase());
      }
      // 5. Fallback to default/requested RTO if provided
      if (!matchedDoc && fallbackRto) {
        matchedDoc = fallbackRto;
      }

      if (matchedDoc) {
        ops.push({
          updateOne: {
            filter: { _id: s._id },
            update: {
              $set: {
                assignedRto: matchedDoc.name,
                rtoId: matchedDoc._id,
                studentType: 'RTO Student',
              },
            },
          },
        });
        repaired.push({ id: s.studentId, name: `${s.firstName} ${s.lastName}`, rto: matchedDoc.name });
      }
    }

    if (ops.length > 0) {
      await StudentModel.bulkWrite(ops);
      // Re-sync pricing in background
      try {
        const { syncChargeableStudents } = await import('../payment/payment.service.js');
        syncChargeableStudents().catch(() => {});
      } catch (_) {}
    }

    res.json({
      success: true,
      message: `Repaired ${ops.length} student${ops.length === 1 ? '' : 's'}`,
      repaired,
      skipped: broken.length - ops.length,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAssignRtoController = async (req, res, next) => {
  try {
    const { studentIds, rtoId, rtoName } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of studentIds' });
    }

    const StudentModel = (await import('./student.model.js')).default;
    const RtoModel = (await import('../rto/rto.model.js')).default;

    let targetRto = null;
    if (rtoId) {
      targetRto = await RtoModel.findById(rtoId);
    }
    if (!targetRto && rtoName) {
      targetRto = await RtoModel.findOne({ name: { $regex: `^${String(rtoName).trim()}$`, $options: 'i' } });
    }
    if (!targetRto) {
      return res.status(404).json({ success: false, message: 'Selected RTO not found' });
    }

    const mongoose = (await import('mongoose')).default;
    const validObjectIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const bizIds = studentIds.filter((id) => typeof id === 'string' && id.trim());

    const result = await StudentModel.updateMany(
      {
        $or: [
          { _id: { $in: validObjectIds } },
          { studentId: { $in: bizIds } },
        ],
      },
      {
        $set: {
          assignedRto: targetRto.name,
          rtoId: targetRto._id,
          studentType: 'RTO Student',
        },
      }
    );

    // Re-sync payment pricing so 100% and 30% prices update immediately
    try {
      const { syncChargeableStudents } = await import('../payment/payment.service.js');
      syncChargeableStudents().catch(() => {});
    } catch (_) {}

    res.json({
      success: true,
      message: `Assigned ${targetRto.name} to ${result.modifiedCount} student${result.modifiedCount === 1 ? '' : 's'}`,
      rtoName: targetRto.name,
      rtoId: targetRto._id,
      modifiedCount: result.modifiedCount,
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

export const bulkUpdateStatusController = async (req, res, next) => {
  try {
    const { studentIds, status, placementStatus } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of studentIds' });
    }

    const StudentModel = (await import('./student.model.js')).default;
    const mongoose = (await import('mongoose')).default;
    const validObjectIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const bizIds = studentIds.filter((id) => typeof id === 'string' && id.trim());

    const updateFields = {};
    if (status) updateFields.status = status;
    if (placementStatus) updateFields.placementStatus = placementStatus;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide status or placementStatus to update' });
    }

    const result = await StudentModel.updateMany(
      {
        $or: [
          { _id: { $in: validObjectIds } },
          { studentId: { $in: bizIds } },
        ],
      },
      { $set: updateFields }
    );

    res.json({
      success: true,
      message: `Updated status for ${result.modifiedCount} student(s)`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDeleteStudentsController = async (req, res, next) => {
  try {
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of studentIds' });
    }

    const StudentModel = (await import('./student.model.js')).default;
    const WorkflowModel = (await import('../workflow/workflow.model.js')).default;
    const mongoose = (await import('mongoose')).default;

    const validObjectIds = studentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const bizIds = studentIds.filter((id) => typeof id === 'string' && id.trim());

    const result = await StudentModel.deleteMany({
      $or: [
        { _id: { $in: validObjectIds } },
        { studentId: { $in: bizIds } },
      ],
    });

    try {
      const allWorkflows = await WorkflowModel.find();
      const allIdStrings = new Set([
        ...validObjectIds.map(String),
        ...bizIds.map(String),
      ]);
      for (const wf of allWorkflows) {
        let modified = false;
        if (Array.isArray(wf.requests)) {
          const orig = wf.requests.length;
          wf.requests = wf.requests.filter(r => !allIdStrings.has(String(r.studentId)));
          if (wf.requests.length !== orig) modified = true;
        }
        if (Array.isArray(wf.appointments)) {
          const orig = wf.appointments.length;
          wf.appointments = wf.appointments.filter(a => !allIdStrings.has(String(a.studentId)));
          if (wf.appointments.length !== orig) modified = true;
        }
        if (Array.isArray(wf.internships)) {
          const orig = wf.internships.length;
          wf.internships = wf.internships.filter(i => !allIdStrings.has(String(i.studentId)));
          if (wf.internships.length !== orig) modified = true;
        }
        if (modified) await wf.save();
      }
    } catch (_) {}

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} student(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    next(error);
  }
};
