import mongoose from 'mongoose';
import AttendanceModel from './attendance.model.js';
import StudentModel from '../student/student.model.js';
import IndustryModel from '../industry/industry.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from '../../core/errors/AppError.js';
import { getAttendanceQueryScope } from '../../core/utils/rbacScope.js';
import { sanitizeAttendanceForRole } from '../../core/utils/rbacSanitizer.js';

export class AttendanceService {
  /**
   * Helper to parse 12-hour or 24-hour time string into minutes since midnight.
   */
  static parseTimeToMinutes(tStr) {
    if (!tStr || typeof tStr !== 'string') return null;
    const match = tStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return null;

    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();

    if (m < 0 || m > 59) return null;

    if (period) {
      if (h < 1 || h > 12) return null;
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
    } else {
      if (h < 0 || h > 23) return null;
    }

    return h * 60 + m;
  }

  /**
   * Calculates total working hours strictly on the server.
   * Never trusts client-supplied total hours.
   */
  /**
   * Calculates total working hours strictly on the server.
   * Never trusts client-supplied total hours.
   * Correctly handles break duration deduction.
   */
  static calculateHours(startTime, finishTime, breakMinutes = 0) {
    const stMins = this.parseTimeToMinutes(startTime);
    const ftMins = this.parseTimeToMinutes(finishTime);

    if (stMins === null || ftMins === null) {
      throw new BadRequestError('Invalid time format. Please provide time as HH:MM AM/PM or HH:MM.');
    }

    if (ftMins <= stMins) {
      throw new BadRequestError('Finish time must be strictly after start time. Overnight shifts are not supported.');
    }

    const durationMinutes = ftMins - stMins;
    const breakM = Number(breakMinutes) || 0;
    if (breakM < 0) {
      throw new BadRequestError('Break duration cannot be negative.');
    }
    if (breakM >= durationMinutes) {
      throw new BadRequestError('Break duration cannot be greater than or equal to total shift duration.');
    }

    const netMinutes = durationMinutes - breakM;
    const hours = Number((netMinutes / 60).toFixed(2));

    if (hours > 24) {
      throw new BadRequestError('Attendance duration cannot exceed 24 hours.');
    }

    return hours;
  }

  static async createAttendance(data, user) {
    const {
      student,
      studentId,
      date,
      startTime = '09:00 AM',
      finishTime = '05:00 PM',
      breakMinutes = 0,
      status = 'Present',
      notes = '',
      facilityName,
      placementId,
      placement,
    } = data;

    if (!date || !String(date).trim()) {
      throw new BadRequestError('Attendance date is required.');
    }

    // Resolve student
    let studentDoc = null;
    const lookupId = studentId || student;
    if (lookupId) {
      if (mongoose.Types.ObjectId.isValid(lookupId)) {
        studentDoc = await StudentModel.findById(lookupId);
      }
      if (!studentDoc) {
        studentDoc = await StudentModel.findOne({ studentId: lookupId });
      }
    }

    if (!studentDoc) {
      throw new NotFoundError('Student not found');
    }

    const role = user?.role;
    const userEmail = (user?.email || '').toLowerCase().trim();

    // Resolve Industry facility and verify assignment
    let industryDoc = null;
    let finalFacilityName = facilityName || '';

    if (role === 'Industry' || role === 'Industry/Host') {
      if (user.facilityName) finalFacilityName = user.facilityName;
      if (user.industryId) {
        industryDoc = await IndustryModel.findById(user.industryId);
      }
      if (!finalFacilityName && userEmail) {
        const matchedInd = await IndustryModel.findOne({ contactEmail: userEmail });
        if (matchedInd) {
          industryDoc = matchedInd;
          finalFacilityName = matchedInd.name;
        }
      }

      if (!finalFacilityName) {
        throw new ForbiddenError('Industry user is not associated with an approved facility.');
      }

      // Verify that this student is assigned to this facility or has an appointment
      const facLower = finalFacilityName.trim().toLowerCase();
      let isAssigned = false;

      if (studentDoc.placementSite && String(studentDoc.placementSite).toLowerCase().includes(facLower)) {
        isAssigned = true;
      } else {
        const hasAssignment = await WorkflowModel.findOne({
          $or: [
            { appointments: { $elemMatch: { studentId: studentDoc.studentId, company: { $regex: `^${finalFacilityName.trim()}$`, $options: 'i' } } } },
            { internships: { $elemMatch: { studentId: studentDoc.studentId, company: { $regex: `^${finalFacilityName.trim()}$`, $options: 'i' } } } },
          ],
        }).lean();
        if (hasAssignment) isAssigned = true;
      }

      if (!isAssigned) {
        throw new ForbiddenError('Access denied. You can only record attendance for students assigned to your facility.');
      }
    }

    // Resolve and link the verified placement record
    let linkedPlacement = placement || null;
    let linkedPlacementId = placementId || '';

    if (!linkedPlacement && !linkedPlacementId) {
      // Find active internship / placement record in workflows
      const matchedWf = await WorkflowModel.findOne({
        'internships.studentId': studentDoc.studentId,
      }).lean();

      if (matchedWf && matchedWf.internships) {
        const intern = matchedWf.internships.find((i) => i.studentId === studentDoc.studentId);
        if (intern) {
          linkedPlacement = intern._id || null;
          linkedPlacementId = intern.intId || (intern._id ? intern._id.toString() : '');
        }
      }
    }

    // Calculate hours on server with break deduction
    const calculatedHours = this.calculateHours(startTime, finishTime, breakMinutes);

    // Prevent duplicate attendance for the same student on the same date
    const existingRecord = await AttendanceModel.findOne({
      student: studentDoc._id,
      date: String(date).trim(),
      isDeleted: false,
    });

    if (existingRecord) {
      throw new ConflictError(`Attendance has already been recorded for ${studentDoc.name || 'this student'} on ${date}.`);
    }

    const studentFullName = [studentDoc.firstName, studentDoc.middleName, studentDoc.lastName]
      .filter(Boolean)
      .join(' ') || studentDoc.name || 'Student';

    try {
      const record = await AttendanceModel.create({
        student: studentDoc._id,
        studentId: studentDoc.studentId || studentDoc._id.toString(),
        studentName: studentFullName,
        placement: linkedPlacement,
        placementId: linkedPlacementId,
        industry: industryDoc?._id || null,
        facilityName: finalFacilityName || 'Host Facility',
        date: String(date).trim(),
        startTime,
        finishTime,
        breakMinutes: Number(breakMinutes) || 0,
        totalHours: calculatedHours,
        status,
        notes: notes || '',
        recordedBy: user?._id || null,
        recordedByName: user?.name || 'Authorized User',
        isDeleted: false,
      });

      return sanitizeAttendanceForRole(record, role);
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictError(`Attendance has already been recorded for this student on ${date}.`);
      }
      throw err;
    }
  }

  static async getAllAttendance(queryFilters, user) {
    const { studentId, date, status, search } = queryFilters;

    const baseScope = await getAttendanceQueryScope(user);
    const query = { ...baseScope };

    if (studentId) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ student: studentId }, { studentId }] });
    }

    if (date) {
      query.date = date;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { studentName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { facilityName: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const records = await AttendanceModel.find(query).sort({ date: -1, createdAt: -1 });
    return records.map((rec) => sanitizeAttendanceForRole(rec, user?.role));
  }

  static async updateAttendance(id, updateData, user) {
    const record = await AttendanceModel.findById(id);
    if (!record || record.isDeleted) {
      throw new NotFoundError('Attendance record not found');
    }

    const role = user?.role;
    // Industry can only update attendance for their facility
    if (role === 'Industry' || role === 'Industry/Host') {
      const facName = (user.facilityName || '').trim().toLowerCase();
      if (facName && (record.facilityName || '').trim().toLowerCase() !== facName) {
        throw new NotFoundError('Attendance record not found');
      }
    }

    // Re-calculate hours if times or break duration are changed
    if (updateData.startTime || updateData.finishTime || updateData.breakMinutes !== undefined) {
      const st = updateData.startTime || record.startTime;
      const ft = updateData.finishTime || record.finishTime;
      const bm = updateData.breakMinutes !== undefined ? updateData.breakMinutes : (record.breakMinutes || 0);
      updateData.totalHours = this.calculateHours(st, ft, bm);
    } else {
      // Prevent client tampering with totalHours directly
      delete updateData.totalHours;
    }

    Object.assign(record, updateData);
    await record.save();
    return sanitizeAttendanceForRole(record, role);
  }

  static async deleteAttendance(id, user) {
    const record = await AttendanceModel.findById(id);
    if (!record || record.isDeleted) {
      throw new NotFoundError('Attendance record not found');
    }

    const role = user?.role;
    if (role === 'Industry' || role === 'Industry/Host') {
      const facName = (user.facilityName || '').trim().toLowerCase();
      if (facName && (record.facilityName || '').trim().toLowerCase() !== facName) {
        throw new NotFoundError('Attendance record not found');
      }
    }

    // Soft delete attendance record to preserve audit history
    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = user?._id || null;
    await record.save();

    return true;
  }
}
