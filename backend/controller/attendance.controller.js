import AttendanceModel from '../model/attendance.model.js';
import StudentModel from '../model/student.model.js';
import IndustryModel from '../model/industry.model.js';

export const createAttendanceController = async (req, res) => {
  try {
    const {
      studentId,
      date,
      startTime,
      finishTime,
      totalHours,
      status,
      notes,
      facilityName,
    } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and Date are required',
      });
    }

    // Resolve student
    let studentDoc = await StudentModel.findById(studentId);
    if (!studentDoc && studentId) {
      studentDoc = await StudentModel.findOne({ studentId });
    }

    if (!studentDoc) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Resolve Industry facility if logged-in user is Industry or facility is provided
    let industryDoc = null;
    let finalFacilityName = facilityName || '';

    if (req.user?.role === 'Industry') {
      if (req.user.facilityName) finalFacilityName = req.user.facilityName;
      if (req.user.industryId) {
        industryDoc = await IndustryModel.findById(req.user.industryId);
      }
    }

    if (!finalFacilityName && req.user?.email) {
      const matchedInd = await IndustryModel.findOne({
        contactEmail: req.user.email.toLowerCase().trim(),
      });
      if (matchedInd) {
        industryDoc = matchedInd;
        finalFacilityName = matchedInd.name;
      }
    }

    // Calculate total hours automatically if start and finish times are provided and totalHours not specified
    let calculatedHours = Number(totalHours);
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
      } catch (err) {
        calculatedHours = 8;
      }
    }

    if (!calculatedHours || calculatedHours <= 0) calculatedHours = 8;

    const studentFullName = [studentDoc.firstName, studentDoc.middleName, studentDoc.lastName]
      .filter(Boolean)
      .join(' ');

    const attendance = await AttendanceModel.create({
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
      recordedBy: req.user?._id || null,
      recordedByName: req.user?.name || 'Industry User',
    });

    res.status(201).json({
      success: true,
      message: 'Attendance record saved successfully',
      data: attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAttendanceController = async (req, res) => {
  try {
    const { studentId, date, status, search } = req.query;
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
    if (req.user) {
      const { role, email, facilityName, rtoName } = req.user;

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
          return res.status(200).json({ success: true, data: [] });
        }
      }
    }

    const records = await AttendanceModel.find(query).sort({ date: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAttendanceController = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const record = await AttendanceModel.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    Object.assign(record, updates);
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAttendanceController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AttendanceModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
