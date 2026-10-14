import mongoose from 'mongoose';
import StudentModel from './student.model.js';
import RtoModel from '../rto/rto.model.js';
import IndustryModel from '../industry/industry.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import NotificationModel from '../notification/notification.model.js';
import { purgeStudentFromWorkflows } from '../workflow/workflow.service.js';
import { sanitizeStudentDataForRole } from '../../core/utils/rbacSanitizer.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/AppError.js';

const STUDENT_ID_PREFIX = 'STU';

export class StudentService {
  static async generateStudentId() {
    const escapedPrefix = STUDENT_ID_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexPattern = `^${escapedPrefix}\\d+$`;

    const existingStudents = await StudentModel.find(
      { studentId: { $regex: regexPattern, $options: 'i' } },
      { studentId: 1 }
    ).lean();

    let maxNum = 0;
    const prefixRegex = new RegExp(`^${escapedPrefix}`, 'i');

    existingStudents.forEach((stu) => {
      if (stu.studentId) {
        const suffix = stu.studentId.replace(prefixRegex, '');
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    return `${STUDENT_ID_PREFIX}${maxNum + 1}`;
  }

  static async createStudent(studentData, { silent = false } = {}) {
    const manualId = (studentData.studentId || '').trim();

    if (manualId) {
      const existing = await StudentModel.findOne({ studentId: manualId }).lean();
      if (existing) {
        const err = new BadRequestError(
          `Student ID "${manualId}" is already in use. Please choose a different ID or leave it blank to auto-generate one.`
        );
        err.isDuplicateStudentId = true;
        throw err;
      }
      studentData.studentId = manualId;
    } else {
      studentData.studentId = await this.generateStudentId();
    }

    const student = await StudentModel.create(studentData);

    if (silent) return student;

    try {
      const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'A new student';
      await NotificationModel.create({
        title: 'New Student Added',
        desc: `${studentName} was successfully added to student roster`,
        type: 'student',
        link: '/my-students',
      });
    } catch (nErr) {
      console.error('Failed to create notification on student add:', nErr);
    }

    return student;
  }

  static async buildRbacFilter(user, coordinatorIdQuery) {
    let filter = {};
    const role = user?.role;
    const userEmail = user?.email?.toLowerCase()?.trim();

    if (user && role !== 'Administrator') {
      if (role === 'Coordinator') {
        filter = { assignedCoordinator: user._id };
      } else if (role === 'RTO Manager') {
        let userRtoName = user.rtoName;
        if (!userRtoName && userEmail) {
          const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
          if (matchedRto) userRtoName = matchedRto.name;
        }
        if (userRtoName) {
          filter = { assignedRto: { $regex: `^${userRtoName.trim()}$`, $options: 'i' } };
        } else {
          filter = { _id: null };
        }
      } else if (role === 'Student') {
        filter = {
          $or: [{ emailAddress: userEmail }, { _id: user.studentIdRef || user._id }],
        };
      } else if (role === 'Industry') {
        let facilityName = user.facilityName;
        if (!facilityName && userEmail) {
          const matchedInd = await IndustryModel.findOne({ contactEmail: userEmail });
          if (matchedInd) facilityName = matchedInd.name;
        }
        if (facilityName) {
          const workflows = await WorkflowModel.find({
            $or: [
              { 'appointments.company': { $regex: facilityName.trim(), $options: 'i' } },
              { 'internships.company': { $regex: facilityName.trim(), $options: 'i' } },
              { 'requests.contactedIndustries.organizationName': { $regex: facilityName.trim(), $options: 'i' } },
            ],
          }).lean();

          const assignedStudentIds = new Set();
          for (const wf of workflows) {
            for (const appt of wf.appointments || []) {
              if (appt.company && new RegExp(facilityName.trim(), 'i').test(appt.company)) {
                if (appt.studentId) assignedStudentIds.add(appt.studentId);
              }
            }
            for (const intern of wf.internships || []) {
              if (intern.company && new RegExp(facilityName.trim(), 'i').test(intern.company)) {
                if (intern.studentId) assignedStudentIds.add(intern.studentId);
              }
            }
          }

          filter = {
            $or: [
              { studentId: { $in: Array.from(assignedStudentIds) } },
              { _id: { $in: Array.from(assignedStudentIds).filter((id) => id.length === 24) } },
            ],
          };
        } else {
          filter = { _id: null };
        }
      } else {
        filter = { assignedCoordinator: user._id };
      }
    } else if (user && role === 'Administrator') {
      if (coordinatorIdQuery === 'unassigned') {
        filter = { $or: [{ assignedCoordinator: null }, { assignedCoordinator: { $exists: false } }] };
      } else if (coordinatorIdQuery) {
        filter = { assignedCoordinator: coordinatorIdQuery };
      }
    }

    return filter;
  }

  static async getAllStudents(user, coordinatorIdQuery) {
    const filter = await this.buildRbacFilter(user, coordinatorIdQuery);
    const rawStudents = await StudentModel.find(filter).sort({ createdAt: -1 });
    return rawStudents.map((s) => sanitizeStudentDataForRole(s, user?.role));
  }

  static async getAllStudentsUnfiltered() {
    return await StudentModel.find({}).sort({ createdAt: -1 });
  }

  static async getStudentById(id, user) {
    let student = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await StudentModel.findById(id);
    }
    if (!student) {
      student = await StudentModel.findOne({ studentId: id });
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const role = user?.role;
    const userEmail = user?.email?.toLowerCase()?.trim();

    if (user && role !== 'Administrator') {
      if (role === 'Student') {
        const isOwnRecord =
          (student.emailAddress && student.emailAddress.toLowerCase() === userEmail) ||
          (user.studentIdRef && user.studentIdRef.toString() === student._id.toString());
        if (!isOwnRecord) {
          throw new ForbiddenError('Access denied. You can only view your own student profile.');
        }
      } else if (role === 'RTO Manager') {
        let userRtoName = user.rtoName;
        if (!userRtoName && userEmail) {
          const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
          if (matchedRto) userRtoName = matchedRto.name;
        }
        const matchesRto =
          userRtoName &&
          student.assignedRto &&
          student.assignedRto.trim().toLowerCase() === userRtoName.trim().toLowerCase();
        if (!matchesRto) {
          throw new ForbiddenError('Access denied. You can only view students belonging to your RTO.');
        }
      }
    }

    return sanitizeStudentDataForRole(student, role);
  }

  static async updateStudent(id, studentData) {
    let student = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await StudentModel.findByIdAndUpdate(id, studentData, {
        returnDocument: 'after',
        runValidators: true,
      });
    }
    if (!student) {
      student = await StudentModel.findOneAndUpdate({ studentId: id }, studentData, {
        returnDocument: 'after',
        runValidators: true,
      });
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    return student;
  }

  static async deleteStudent(id) {
    let student = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      student = await StudentModel.findByIdAndDelete(id);
    }
    if (!student) {
      student = await StudentModel.findOneAndDelete({ studentId: id });
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    try {
      await purgeStudentFromWorkflows(student._id ? student._id.toString() : id, student.studentId || id);
    } catch (purgeErr) {
      console.error('Workflow & payment cascade purge failed:', purgeErr.message);
    }

    return true;
  }

  static async assignCoordinator(id, { coordinatorId, coordinatorName }, actingUser) {
    let currentStudent = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      currentStudent = await StudentModel.findById(id);
    }
    if (!currentStudent) {
      currentStudent = await StudentModel.findOne({ studentId: id });
    }

    if (!currentStudent) {
      throw new NotFoundError('Student not found');
    }

    const previousCoordinatorId = currentStudent.assignedCoordinator || null;
    const previousCoordinatorName = currentStudent.assignedCoordinatorName || '';

    let action = 'Assigned';
    if (!coordinatorId) {
      action = 'Removed';
    } else if (previousCoordinatorId) {
      action = 'Changed';
    }

    const historyEntry = {
      coordinatorId: coordinatorId || null,
      coordinatorName: coordinatorName || '',
      action,
      previousCoordinatorName,
      assignedBy: actingUser?.name || actingUser?.email || '',
      assignedByUserId: actingUser?._id || actingUser?.id || null,
      date: new Date(),
    };

    const student = await this.updateStudent(id, {
      assignedCoordinator: coordinatorId || null,
      assignedCoordinatorName: coordinatorName || '',
      assignedCoordinatorAt: coordinatorId ? new Date() : null,
      $push: { coordinatorHistory: historyEntry },
    });

    const message = coordinatorId
      ? action === 'Changed'
        ? `Coordinator changed from ${previousCoordinatorName || 'Unassigned'} to ${coordinatorName || 'coordinator'} successfully`
        : `Student assigned to ${coordinatorName || 'coordinator'} successfully`
      : 'Coordinator unassigned successfully';

    return { student, message };
  }
}
