import mongoose from 'mongoose';
import StudentModel from './student.model.js';
import RtoModel from '../rto/rto.model.js';
import IndustryModel from '../industry/industry.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import NotificationModel from '../notification/notification.model.js';
import { purgeStudentFromWorkflows } from '../workflow/workflow.service.js';
import { sanitizeStudentDataForRole } from '../../core/utils/rbacSanitizer.js';
import { getStudentQueryScope } from '../../core/utils/rbacScope.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/AppError.js';
import {
  STUDENT_LIFECYCLE_STATUSES,
  calculateLifecycleStatus,
  updateStudentLifecycleStatus,
  getStatusConfig,
} from './studentStatus.service.js';

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

  static async createStudent(studentData, { silent = false, actingUser } = {}) {
    const role = actingUser?.role;
    const isRto = role === 'RTO Manager' || role === 'RTO';

    if (isRto) {
      let userRtoName = actingUser.rtoName;
      let userRtoId = actingUser.rtoId;
      const userEmail = actingUser.email?.toLowerCase()?.trim();

      if (!userRtoName && userEmail) {
        const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
        if (matchedRto) {
          userRtoName = matchedRto.name;
          userRtoId = matchedRto._id;
        }
      }
      if (!userRtoName && actingUser.requestedOrgName) {
        const matchedRto = await RtoModel.findOne({
          name: { $regex: `^${actingUser.requestedOrgName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
        });
        if (matchedRto) {
          userRtoName = matchedRto.name;
          userRtoId = matchedRto._id;
        } else {
          userRtoName = actingUser.requestedOrgName;
        }
      }

      if (!userRtoName) {
        throw new ForbiddenError('RTO Manager account is not associated with an approved RTO organisation.');
      }

      // Automatically bind student to authenticated RTO — never trust client payload for tenant binding!
      studentData.assignedRto = userRtoName;
      studentData.institute = userRtoName;
      studentData.rtoId = userRtoId;
      studentData.studentType = 'RTO Student';

      // Strip coordinator and industry fields to prevent unauthorized assignment
      delete studentData.assignedCoordinator;
      delete studentData.assignedCoordinatorName;
      delete studentData.assignedCoordinatorAt;
      delete studentData.assignedCoordinatorEmail;
      delete studentData.coordinatorHistory;
      delete studentData.contactedIndustries;
      delete studentData.placementSite;
      delete studentData.preferredIndustry;
    } else {
      // Dynamic RTO resolution & registration for non-RTO managers (Admins, Coordinators, Direct Enrollment)
      const rawRtoName = (studentData.assignedRto || studentData.institute || '').trim();

      if (studentData.studentType === 'Independent Student') {
        if (!rawRtoName) {
          studentData.assignedRto = 'Independent Student';
          studentData.institute = studentData.institute || 'Independent Student';
        }
      } else if (studentData.studentType === 'RTO Student' && !rawRtoName) {
        studentData.studentType = 'Awaiting RTO Assignment';
      }

      if (rawRtoName && rawRtoName !== 'Independent Student' && rawRtoName !== 'Unassigned') {
        const escaped = rawRtoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matchedRto = await RtoModel.findOne({ name: { $regex: `^${escaped}$`, $options: 'i' } });

        if (matchedRto) {
          studentData.rtoId = matchedRto._id;
          studentData.assignedRto = matchedRto.name;
          studentData.institute = matchedRto.name;
        } else {
          // New RTO entered — dynamically register in RtoModel so suggestions return it in future
          try {
            const newRto = await RtoModel.create({
              name: rawRtoName,
              status: 'Active',
              shortDescription: `Registered via student enrollment (${studentData.studentType || 'Student'})`,
            });
            studentData.rtoId = newRto._id;
            studentData.assignedRto = newRto.name;
            studentData.institute = newRto.name;
          } catch (_) {
            studentData.assignedRto = rawRtoName;
            studentData.institute = rawRtoName;
          }
        }
      }
    }

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

    // Set initial lifecycle status
    try {
      await updateStudentLifecycleStatus(
        student._id,
        STUDENT_LIFECYCLE_STATUSES.REGISTERED,
        {
          reason: 'Student registration completed',
          triggeredBy: 'system',
          triggeringEvent: 'student_created',
        }
      );
    } catch (statusErr) {
      console.error('[StudentService] Failed to set initial lifecycle status:', statusErr.message);
    }

    if (silent) return student;

    try {
      const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'A new student';
      await NotificationModel.create({
        title: 'New Student Added',
        desc: `${studentName} was successfully added to student roster`,
        type: 'student',
        link: '/my-students',
        targetRoles: ['Administrator', 'Admin', 'Coordinator', 'Placement Coordinator', 'Staff', 'RTO', 'RTO Manager'],
        rtoName: student.assignedRto || student.institute || '',
        studentName,
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

    const isAdmin = role === 'Administrator' || role === 'Admin';
    const isCoordinator = role === 'Coordinator' || role === 'Placement Coordinator';
    const isRto = role === 'RTO Manager' || role === 'RTO';
    const isIndustry = role === 'Industry' || role === 'Industry/Host';
    const isStudent = role === 'Student';

    if (user && !isAdmin) {
      if (isCoordinator) {
        const coordMatches = [
          { assignedCoordinator: user._id },
          { assignedCoordinator: String(user._id) },
        ];
        if (mongoose.Types.ObjectId.isValid(user._id)) {
          coordMatches.push({ assignedCoordinator: new mongoose.Types.ObjectId(user._id) });
        }
        if (user.name) {
          coordMatches.push({ assignedCoordinatorName: { $regex: `^${user.name.trim()}$`, $options: 'i' } });
        }
        if (user.email) {
          coordMatches.push({ assignedCoordinatorEmail: user.email.toLowerCase().trim() });
        }
        filter = { $or: coordMatches };
      } else if (isRto) {
        filter = await getStudentQueryScope(user);
      } else if (isStudent) {
        const studentMatches = [];
        if (userEmail) {
          const escaped = userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          studentMatches.push({ emailAddress: { $regex: `^${escaped}$`, $options: 'i' } });
        }
        if (user.studentIdRef && mongoose.Types.ObjectId.isValid(user.studentIdRef)) {
          studentMatches.push({ _id: new mongoose.Types.ObjectId(user.studentIdRef) });
        }
        if (user.requestedStudentId) {
          studentMatches.push({ studentId: user.requestedStudentId.trim() });
        }
        filter = studentMatches.length > 0 ? { $or: studentMatches } : { _id: null };
      } else if (isIndustry) {
        filter = await getStudentQueryScope(user);
      } else {
        filter = { assignedCoordinator: user._id };
      }
    } else if (user && isAdmin) {
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

    // Fetch workflow data once for all students
    let workflows = [];
    try {
      workflows = await WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean();
    } catch (wfErr) {
      console.error('[StudentService] Failed to fetch workflow data for status calculation:', wfErr.message);
    }
    const allRequests = workflows.flatMap(wf => wf.requests || []);
    const allAppointments = workflows.flatMap(wf => wf.appointments || []);
    const allInternships = workflows.flatMap(wf => wf.internships || []);

    // Derive live dynamic statuses from workflows so student status is never stale
    try {
      const allAppts = workflows.flatMap((wf) => wf.appointments || []);
      const allInts = workflows.flatMap((wf) => wf.internships || []);

      const apptsByStudent = new Map();
      allAppts.forEach((a) => {
        const keys = [a.studentId, String(a._id || ''), a.student?.trim().toLowerCase()].filter(Boolean);
        keys.forEach((k) => {
          if (!apptsByStudent.has(k)) apptsByStudent.set(k, []);
          apptsByStudent.get(k).push(a);
        });
      });

      const intsByStudent = new Map();
      allInts.forEach((i) => {
        const keys = [i.studentId, String(i._id || ''), i.student?.trim().toLowerCase()].filter(Boolean);
        keys.forEach((k) => {
          if (!intsByStudent.has(k)) intsByStudent.set(k, []);
          intsByStudent.get(k).push(i);
        });
      });

      const now = new Date();
      rawStudents.forEach((s) => {
        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const sName = (s.name || sFullName).trim().toLowerCase();
        const keys = [s.studentId, String(s._id || ''), sName, sFullName].filter(Boolean);

        const studentAppts = keys.flatMap((k) => apptsByStudent.get(k) || []);
        const studentInts = keys.flatMap((k) => intsByStudent.get(k) || []);

        if (studentInts.length > 0 || studentAppts.length > 0) {
          if (
            studentInts.some((i) => ['Completed', 'Placement Completed'].includes(i.status)) ||
            studentAppts.some((a) => ['Completed', 'Placement Completed'].includes(a.status))
          ) {
            s.placementStatus = 'Placement Completed';
          } else if (
            studentInts.some((i) => ['Active', 'Placement Started', 'Joined', 'Waiting to Join'].includes(i.status)) ||
            studentAppts.some(
              (a) =>
                !['Cancelled', 'Withdrawn', 'Declined', 'Industry Rejected'].includes(a.status) &&
                (a.status === 'Confirmed' || a.appointmentOutcome === 'successful') &&
                a.commencementDate &&
                new Date(a.commencementDate) <= now
            )
          ) {
            s.placementStatus = 'Placement Started';
          } else if (
            studentAppts.some(
              (a) =>
                !['Cancelled', 'Withdrawn', 'Declined', 'Industry Rejected'].includes(a.status) &&
                a.appointmentOutcome === 'successful' &&
                !a.commencementDate
            )
          ) {
            s.placementStatus = 'Appointment Successful';
          } else if (studentAppts.some((a) => ['Scheduled', 'Rescheduled'].includes(a.status))) {
            s.placementStatus = 'Appointment Scheduled';
          }

          const latestAppt = studentAppts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))[0];
          if (latestAppt) {
            if (!s.appointmentDate && latestAppt.date) s.appointmentDate = latestAppt.date;
            if (!s.appointmentTime && latestAppt.time) s.appointmentTime = latestAppt.time;
            if (!s.commencementDate && latestAppt.commencementDate) s.commencementDate = latestAppt.commencementDate;
          }

          const latestInt = studentInts.sort((a, b) => new Date(b.start || b.startDate || 0) - new Date(a.start || a.startDate || 0))[0];
          if (latestInt) {
            if (!s.commencementDate && (latestInt.start || latestInt.startDate)) {
              s.commencementDate = latestInt.start || latestInt.startDate;
            }
          }
        }

        // Calculate lifecycle status from workflow data
        try {
          s.lifecycleStatus = calculateLifecycleStatus(s, {
            requests: allRequests,
            appointments: allAppointments,
            internships: allInternships,
          });
        } catch (lifecycleErr) {
          console.error('[StudentService] Failed to calculate lifecycle status for student:', s.studentId, lifecycleErr.message);
        }
      });
    } catch (_) {
      // Non-blocking fallback
    }

    return rawStudents.map((s) => sanitizeStudentDataForRole(s, user?.role));
  }

  static async getAllStudentsUnfiltered(user) {
    const role = user?.role;
    const isAdmin = role === 'Administrator' || role === 'Admin';
    if (user && !isAdmin) {
      return await this.getAllStudents(user);
    }
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

    if (user && role !== 'Administrator' && role !== 'Admin') {
      if (role === 'Student') {
        const isOwnRecord =
          (student.emailAddress && student.emailAddress.toLowerCase().trim() === userEmail) ||
          (user.studentIdRef && user.studentIdRef.toString() === student._id.toString()) ||
          (user.requestedStudentId && student.studentId && user.requestedStudentId.trim().toLowerCase() === student.studentId.trim().toLowerCase());
        if (!isOwnRecord) {
          throw new NotFoundError('Student not found');
        }
      } else if (role === 'Coordinator' || role === 'Placement Coordinator') {
        const assignedId = student.assignedCoordinator ? student.assignedCoordinator.toString() : '';
        const userId = user._id ? user._id.toString() : '';
        const matchesCoordId = assignedId && userId && assignedId === userId;
        const matchesCoordName =
          user.name &&
          student.assignedCoordinatorName &&
          student.assignedCoordinatorName.trim().toLowerCase() === user.name.trim().toLowerCase();

        if (!matchesCoordId && !matchesCoordName) {
          throw new NotFoundError('Student not found');
        }
      } else if (role === 'RTO Manager' || role === 'RTO') {
        let userRtoName = user.rtoName;
        let userRtoId = user.rtoId;
        if (!userRtoName && userEmail) {
          const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
          if (matchedRto) {
            userRtoName = matchedRto.name;
            userRtoId = matchedRto._id;
          }
        }
        if (!userRtoName && user.requestedOrgName) {
          const matchedRto = await RtoModel.findOne({
            name: { $regex: `^${user.requestedOrgName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          });
          if (matchedRto) {
            userRtoName = matchedRto.name;
            userRtoId = matchedRto._id;
          } else {
            userRtoName = user.requestedOrgName;
          }
        }
        const matchesRtoName =
          userRtoName &&
          student.assignedRto &&
          student.assignedRto.trim().toLowerCase() === userRtoName.trim().toLowerCase();
        const matchesInstitute =
          userRtoName &&
          student.institute &&
          student.institute.trim().toLowerCase() === userRtoName.trim().toLowerCase();
        const matchesRtoId =
          userRtoId &&
          student.rtoId &&
          student.rtoId.toString() === userRtoId.toString();

        if (!matchesRtoName && !matchesInstitute && !matchesRtoId) {
          throw new NotFoundError('Student not found');
        }
      } else if (role === 'Industry' || role === 'Industry/Host') {
        let facilityName = user.facilityName;
        let industryId = user.industryId;

        if (!facilityName && industryId) {
          const matchedInd = await IndustryModel.findById(industryId);
          if (matchedInd) facilityName = matchedInd.name;
        }
        if (!facilityName && userEmail) {
          const matchedInd = await IndustryModel.findOne({ contactEmail: userEmail });
          if (matchedInd) facilityName = matchedInd.name;
        }
        if (!facilityName && user.requestedFacilityName) {
          const matchedInd = await IndustryModel.findOne({
            name: { $regex: `^${user.requestedFacilityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          });
          if (matchedInd) facilityName = matchedInd.name;
          else facilityName = user.requestedFacilityName;
        }

        let isAssigned = false;
        if (facilityName) {
          const facLower = facilityName.trim().toLowerCase();
          const escaped = facilityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          if (student.placementSite && String(student.placementSite).toLowerCase().includes(facLower)) {
            isAssigned = true;
          } else {
            const hasAppointment = await WorkflowModel.findOne({
              $or: [
                { appointments: { $elemMatch: { studentId: student.studentId, company: { $regex: `^${escaped}$`, $options: 'i' } } } },
                { internships: { $elemMatch: { studentId: student.studentId, company: { $regex: `^${escaped}$`, $options: 'i' } } } },
              ],
            }).lean();
            if (hasAppointment) isAssigned = true;
          }
        }

        if (!isAssigned) {
          throw new NotFoundError('Student not found');
        }
      }
    }

    return sanitizeStudentDataForRole(student, role);
  }

  static async updateStudent(id, studentData, actingUser) {
    const role = actingUser?.role;
    const isAdmin = role === 'Administrator' || role === 'Admin';

    if (actingUser && !isAdmin) {
      // Validates resource ownership for non-admin actors (Coord, RTO, Industry, Student)
      // Throws 404 NotFound if resource is not owned/assigned, preventing cross-tenant enumeration!
      await this.getStudentById(id, actingUser);

      // Student can update their own permitted personal, places, preferences, and compliance document fields
      if (role === 'Student') {
        const allowedStudentFields = [
          'preferredName',
          'firstName',
          'middleName',
          'lastName',
          'dateOfBirth',
          'gender',
          'nationality',
          'language',
          'phoneNumber',
          'phoneCode',
          'alternatePhone',
          'altPhoneCode',
          'whatsappNumber',
          'waPhoneCode',
          'address',
          'suburb',
          'state',
          'postCode',
          'country',
          'emergencyContactName',
          'emergencyContactRelationship',
          'emergencyContactPhone',
          // Placement preferences & places
          'preferredLocation',
          'placementRadius',
          'placementSite',
          'preferredIndustry',
          'availabilityDays',
          'availabilityFrom',
          'availabilityTo',
          'willingToRelocate',
          'transport',
          'licenceNumber',
          'visaStatus',
          'visaSubclass',
          'visaExpiryDate',
          'workRights',
          'workExperience',
          'englishProficiency',
          'placementNotes',
          // Education and course credentials
          'courseQualification',
          'specialisation',
          'courseLevel',
          'studyMode',
          'campus',
          'startDate',
          'expectedEndDate',
          'currentYearSemester',
          'attendanceStatus',
          'academicStatus',
          'gpa',
          'previousQualification',
          'yearOfCompletion',
          'placementHours',
          'courses',
          // Additional info
          'heardAboutUs',
          'hasResume',
          'additionalNotes',
          'cprDoc',
          // Documents / Dox uploads
          'policeCheckDoc',
          'covidCheckDoc',
          'ndisDoc',
          'resumeDoc',
          'resumeFile',
          'wwccDoc',
          'passportDoc',
          'drivingLicenceDoc',
          'infectionControlDoc',
          'handHygieneDoc',
          'cbrDoc',
          'additionalDocuments',
          'documents',
        ];
        const sanitizedUpdate = {};
        for (const key of allowedStudentFields) {
          if (studentData[key] !== undefined) {
            sanitizedUpdate[key] = studentData[key];
          }
        }
        studentData = sanitizedUpdate;
      } else if (role === 'Industry' || role === 'Industry/Host') {
        // Industry users can only update permitted placement lifecycle fields
        const allowedIndustryFields = [
          'placementStatus',
          'appointmentDate',
          'appointmentTime',
          'commencementDate',
          'completionDate',
          'notes',
        ];
        const sanitizedUpdate = {};
        for (const key of allowedIndustryFields) {
          if (studentData[key] !== undefined) {
            sanitizedUpdate[key] = studentData[key];
          }
        }
        studentData = sanitizedUpdate;
      } else if (role === 'RTO Manager' || role === 'RTO') {
        // RTO Managers cannot reassign student to another RTO or assign coordinators/industries
        delete studentData.assignedRto;
        delete studentData.institute;
        delete studentData.rtoId;
        delete studentData.studentType;
        delete studentData.assignedCoordinator;
        delete studentData.assignedCoordinatorName;
        delete studentData.assignedCoordinatorAt;
        delete studentData.assignedCoordinatorEmail;
        delete studentData.coordinatorHistory;
        delete studentData.contactedIndustries;
        delete studentData.placementSite;
        delete studentData.preferredIndustry;
      }

      // Chronology validation if dates are being updated
      if (studentData.commencementDate && studentData.completionDate) {
        const startT = new Date(studentData.commencementDate).getTime();
        const endT = new Date(studentData.completionDate).getTime();
        if (!isNaN(startT) && !isNaN(endT) && endT < startT) {
          throw new BadRequestError('Completion date cannot be before commencement date.');
        }
      }
    }

    // If assignedRto or institute is provided, auto-resolve rtoId or dynamically register new RTO
    const cleanRtoName = (studentData.assignedRto || studentData.institute || '').trim();
    if (cleanRtoName && cleanRtoName !== 'Independent Student' && cleanRtoName !== 'Unassigned') {
      try {
        const escaped = cleanRtoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matchedRto = await RtoModel.findOne({
          name: { $regex: `^${escaped}$`, $options: 'i' },
        });
        if (matchedRto) {
          studentData.assignedRto = matchedRto.name;
          studentData.institute = matchedRto.name;
          studentData.rtoId = matchedRto._id;
        } else {
          try {
            const newRto = await RtoModel.create({
              name: cleanRtoName,
              status: 'Active',
              shortDescription: `Registered via student profile update (${studentData.studentType || 'Student'})`,
            });
            studentData.assignedRto = newRto.name;
            studentData.institute = newRto.name;
            studentData.rtoId = newRto._id;
          } catch (_) {
            studentData.assignedRto = cleanRtoName;
            studentData.institute = cleanRtoName;
          }
        }
      } catch (_) {}
    }

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

    // Refresh payment price if RTO, fee or course changed
    if (student && (studentData.assignedRto || studentData.courseQualification || studentData.independentFee != null)) {
      try {
        const { syncChargeableStudents } = await import('../payment/payment.service.js');
        syncChargeableStudents().catch(() => {});
      } catch (_) {}
    }

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Immediately sync payment record so RTO/fee changes reflect in payments page
    import('../payment/payment.service.js')
      .then(({ syncSingleStudentPayment }) => {
        syncSingleStudentPayment(student.toObject ? student.toObject() : student).catch((err) =>
          console.error('[StudentService] Payment sync after update failed:', err.message)
        );
      })
      .catch(() => {});

    // Sync placement dates / status into workflow internships, appointments, and payments if present
    if (student && (studentData.commencementDate || studentData.completionDate || studentData.placementStatus)) {
      try {
        const studentBizId = String(student.studentId || '').trim();
        const studentDbId = String(student._id || student.id || '').trim();
        const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const isCompleted = ['Placement Completed', 'Completed'].includes(studentData.placementStatus);

        // Update lifecycle status based on workflow data
        try {
          const workflows = await WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean();
          const correctLifecycleStatus = calculateLifecycleStatus(student, {
            requests: workflows.flatMap(wf => wf.requests || []),
            appointments: workflows.flatMap(wf => wf.appointments || []),
            internships: workflows.flatMap(wf => wf.internships || []),
          });
          
          if (student.lifecycleStatus !== correctLifecycleStatus) {
            await updateStudentLifecycleStatus(
              student._id,
              correctLifecycleStatus,
              {
                reason: 'Automated lifecycle status update based on workflow data',
                triggeredBy: 'system',
                triggeringEvent: 'workflow_data_sync',
              }
            );
          }
        } catch (lifecycleErr) {
          console.error('[StudentService] Failed to update lifecycle status:', lifecycleErr.message);
        }

        const stuMatchConditions = [
          ...(studentBizId ? [{ studentId: studentBizId }, { studentId: new RegExp(`^${studentBizId}$`, 'i') }] : []),
          ...(studentDbId && mongoose.Types.ObjectId.isValid(studentDbId) ? [{ _id: studentDbId }] : []),
          ...(studentName ? [{ student: studentName }, { student: new RegExp(`^${studentName}$`, 'i') }, { name: studentName }] : []),
        ];

        // 1. Update WorkflowModel embedded internships & appointments
        const workflows = await WorkflowModel.find({
          $or: [
            ...(studentBizId ? [{ 'internships.studentId': studentBizId }, { 'appointments.studentId': studentBizId }] : []),
            ...(studentName ? [{ 'internships.student': new RegExp(`^${studentName}$`, 'i') }, { 'appointments.student': new RegExp(`^${studentName}$`, 'i') }] : []),
          ],
        });

        for (const wf of workflows) {
          let wfModified = false;
          (wf.internships || []).forEach((i) => {
            const matches =
              (studentBizId && String(i.studentId || '').trim().toLowerCase() === studentBizId.toLowerCase()) ||
              (studentName && String(i.student || '').trim().toLowerCase() === studentName.toLowerCase());
            if (matches) {
              if (studentData.commencementDate) i.start = studentData.commencementDate;
              if (studentData.completionDate) i.end = studentData.completionDate;
              if (studentData.placementStatus) {
                i.status = isCompleted ? 'Completed' : studentData.placementStatus;
                if (isCompleted) i.progress = 100;
              }
              wfModified = true;
            }
          });

          (wf.appointments || []).forEach((a) => {
            const matches =
              (studentBizId && String(a.studentId || '').trim().toLowerCase() === studentBizId.toLowerCase()) ||
              (studentName && String(a.student || '').trim().toLowerCase() === studentName.toLowerCase());
            if (matches) {
              if (studentData.commencementDate) a.commencementDate = studentData.commencementDate;
              if (studentData.completionDate) a.expectedCompletionDate = studentData.completionDate;
              if (isCompleted) {
                a.status = 'Completed';
                a.appointmentOutcome = 'successful';
              } else if (studentData.placementStatus === 'Placement Started') {
                a.status = 'Confirmed';
              }
              wfModified = true;
            }
          });

          if (wfModified) {
            await wf.save({ validateBeforeSave: false });
          }
        }

        // 2. Update standalone AppointmentModel
        if (isCompleted) {
          try {
            const AppointmentModel = (await import('../appointment/appointment.model.js')).default;
            if (AppointmentModel) {
              await AppointmentModel.updateMany(
                {
                  $or: [
                    ...(studentBizId ? [{ studentId: studentBizId }, { studentId: new RegExp(`^${studentBizId}$`, 'i') }] : []),
                    ...(studentName ? [{ student: studentName }, { student: new RegExp(`^${studentName}$`, 'i') }] : []),
                  ],
                },
                { status: 'Completed', appointmentOutcome: 'successful' },
                { runValidators: false }
              );
            }
          } catch (_) {}
        }

        // 3. Update PaymentModel & trigger sync
        try {
          const PaymentModel = (await import('../payment/payment.model.js')).default;
          if (PaymentModel && studentData.placementStatus) {
            await PaymentModel.updateMany(
              {
                $or: [
                  ...(studentBizId ? [{ studentId: studentBizId }] : []),
                  ...(studentDbId && mongoose.Types.ObjectId.isValid(studentDbId) ? [{ student: studentDbId }] : []),
                ],
              },
              { placementStatus: studentData.placementStatus },
              { runValidators: false }
            );
          }
          const { syncChargeableStudents } = await import('../payment/payment.service.js');
          await syncChargeableStudents();
        } catch (_) {}
      } catch (_) {}
    }

    // Sync student name & phone to linked User account
    if (student && (studentData.firstName || studentData.lastName || studentData.phoneNumber)) {
      try {
        const UserModel = (await import('../user/user.model.js')).default;
        const newFullName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const userUpdates = {};
        if (newFullName) userUpdates.name = newFullName;
        if (student.phoneNumber) userUpdates.phone = student.phoneNumber;
        await UserModel.updateMany(
          { $or: [{ studentIdRef: student._id }, { email: student.emailAddress?.toLowerCase()?.trim() }] },
          { $set: userUpdates }
        );
      } catch (_) {}
    }

    return sanitizeStudentDataForRole(student, role);
  }

  static async deleteStudent(id, actingUser) {
    const role = actingUser?.role;
    const isAdmin = role === 'Administrator' || role === 'Admin';
    if (actingUser && !isAdmin) {
      throw new ForbiddenError('Only Administrators can delete students.');
    }
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
