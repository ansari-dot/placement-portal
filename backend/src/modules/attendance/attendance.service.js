import AttendanceModel from './attendance.model.js';
import StudentModel from '../student/student.model.js';
import IndustryModel from '../industry/industry.model.js';
import { NotFoundError } from '../../core/errors/AppError.js';

export class AttendanceService {
  static calculateHours(startTime, finishTime, providedHours) {
    let calculatedHours = Number(providedHours);
    if ((!calculatedHours || calculatedHours <= 0) && startTime && finishTime) {
      try {
        const parseTime = (tStr) => {
          const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
          if (!match) return 0;
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const period = match[3]?.toUpperCase();
          if (period === 'PM' && h < 12) h += 12;
          if (period === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        const startMins = parseTime(startTime);
        const finishMins = parseTime(finishTime);
        if (finishMins > startMins) {
          calculatedHours = Number(((finishMins - startMins) / 60).toFixed(2));
        }
      } catch {
        calculatedHours = 8;
      }
    }
    if (!calculatedHours || calculatedHours <= 0) calculatedHours = 8;
    return calculatedHours;
  }

  static async createAttendance(data, user) {
    const { studentId, date, startTime, finishTime, totalHours, status, notes, facilityName } = data;

    // Resolve student
    let studentDoc = await StudentModel.findById(studentId);
    if (!studentDoc && studentId) {
      studentDoc = await StudentModel.findOne({ studentId });
    }

    if (!studentDoc) {
      throw new NotFoundError('Student not found');
    }

    // Resolve Industry facility if logged-in user is Industry or facility is provided
    let industryDoc = null;
    let finalFacilityName = facilityName || '';

    if (user?.role === 'Industry') {
      if (user.facilityName) finalFacilityName = user.facilityName;
      if (user.industryId) {
        industryDoc = await IndustryModel.findById(user.industryId);
      }
    }

    if (!finalFacilityName && user?.email) {
      const matchedInd = await IndustryModel.findOne({
        contactEmail: user.email.toLowerCase().trim(),
      });
      if (matchedInd) {
        industryDoc = matchedInd;
        finalFacilityName = matchedInd.name;
      }
    }

    const calculatedHours = this.calculateHours(startTime, finishTime, totalHours);

    const studentFullName = [studentDoc.firstName, studentDoc.middleName, studentDoc.lastName]
      .filter(Boolean)
      .join(' ');

    return await AttendanceModel.create({
      student: studentDoc._id,
      studentId: studentDoc.studentId || studentDoc._id.toString(),
      studentName: studentFullName,
      industry: industryDoc?._id || null,
      facilityName: finalFacilityName || 'Host Facility',
      date,
      startTime: startTime || '09:00 AM',
      finishTime: finishTime || '05:00 PM',
      totalHours: calculatedHours,
      status: status || 'Present',
      notes: notes || '',
      recordedBy: user?._id || null,
      recordedByName: user?.name || 'Industry User',
    });
  }

  static async getAllAttendance(queryFilters, user) {
    const { studentId, date, status, search } = queryFilters;
    const query = {};

    if (studentId) {
      query.$or = [{ student: studentId }, { studentId }];
    }

    if (date) {
      query.date = date;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { facilityName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Role-based security scoping
    if (user) {
      const { role, email, facilityName, rtoName } = user;

      if (role === 'Industry') {
        const indName = facilityName || (await IndustryModel.findOne({ contactEmail: email?.toLowerCase() }))?.name;
        if (indName) {
          query.facilityName = { $regex: indName.trim(), $options: 'i' };
        }
      } else if (role === 'RTO Manager') {
        const myRtoName = rtoName || (await StudentModel.findOne({ emailAddress: email?.toLowerCase() }))?.assignedRto;
        if (myRtoName) {
          const myStudentIds = (
            await StudentModel.find({ assignedRto: { $regex: myRtoName.trim(), $options: 'i' } }).select('_id studentId')
          ).flatMap((s) => [s._id, s.studentId].filter(Boolean));
          query.student = { $in: myStudentIds };
        }
      } else if (role === 'Student') {
        const myStudentDoc = await StudentModel.findOne({ emailAddress: email?.toLowerCase() });
        if (myStudentDoc) {
          query.student = myStudentDoc._id;
        } else {
          return [];
        }
      }
    }

    return await AttendanceModel.find(query).sort({ date: -1, createdAt: -1 });
  }

  static async updateAttendance(id, updateData) {
    const record = await AttendanceModel.findById(id);
    if (!record) {
      throw new NotFoundError('Attendance record not found');
    }

    if (updateData.startTime || updateData.finishTime || updateData.totalHours) {
      const st = updateData.startTime || record.startTime;
      const ft = updateData.finishTime || record.finishTime;
      updateData.totalHours = this.calculateHours(st, ft, updateData.totalHours || record.totalHours);
    }

    Object.assign(record, updateData);
    await record.save();
    return record;
  }

  static async deleteAttendance(id) {
    const deleted = await AttendanceModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundError('Attendance record not found');
    }
    return true;
  }
}
