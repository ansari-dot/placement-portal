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
import { CANONICAL_STATUSES } from './canonicalStatus.constants.js';
import { resolveCanonicalStudentStatus } from './canonicalStatus.service.js';

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
      const nameCounts = new Map();
      rawStudents.forEach((stu) => {
        const sName = (stu.name || `${stu.firstName || ''} ${stu.lastName || ''}`.trim()).toLowerCase();
        if (sName) nameCounts.set(sName, (nameCounts.get(sName) || 0) + 1);
      });

      const canonicalContext = {
        requests: allRequests,
        appointments: allAppointments,
        internships: allInternships,
        nameCounts,
      };

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

      const requestsByStudent = new Map();
      allRequests.forEach((r) => {
        const keys = [r.studentId, String(r._id || ''), r.student?.trim().toLowerCase()].filter(Boolean);
        keys.forEach((k) => {
          if (!requestsByStudent.has(k)) requestsByStudent.set(k, []);
          requestsByStudent.get(k).push(r);
        });
      });

      const now = new Date();
      rawStudents.forEach((s) => {
        // Resolve authoritative canonical lifecycle status as single source of truth
        try {
          const canonicalRes = resolveCanonicalStudentStatus(s, canonicalContext, now);
          s.canonicalStatus = canonicalRes.canonicalStatus;
          s.canonicalPlacementStatus = canonicalRes.canonicalStatus;
          s.canonicalReason = canonicalRes.reason;
          s.placementStatus = canonicalRes.canonicalStatus;
        } catch (cErr) {
          s.canonicalStatus = s.placementStatus || CANONICAL_STATUSES.AWAITING;
          s.canonicalPlacementStatus = s.canonicalStatus;
        }

        const sFullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
        const sName = (s.name || sFullName).trim().toLowerCase();
        const keys = [s.studentId, String(s._id || ''), sName, sFullName].filter(Boolean);

        const studentAppts = keys.flatMap((k) => apptsByStudent.get(k) || []);
        const studentInts = keys.flatMap((k) => intsByStudent.get(k) || []);

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

        // Merge contactedIndustries from matching workflow requests
        const studentRequests = keys.flatMap((k) => requestsByStudent.get(k) || []);
        const rawStudentContacts = Array.isArray(s.contactedIndustries) ? [...s.contactedIndustries] : [];
        const seenStudentOrgs = new Set(
          rawStudentContacts.map((c) => (c.organizationName || c.name || '').trim().toLowerCase()).filter(Boolean)
        );
        studentRequests.forEach((r) => {
          (r.contactedIndustries || []).forEach((c) => {
            const org = (c.organizationName || c.name || '').trim().toLowerCase();
            if (org && !seenStudentOrgs.has(org)) {
              seenStudentOrgs.add(org);
              rawStudentContacts.push(c);
            } else if (!org && c) {
              rawStudentContacts.push(c);
            }
          });
        });
        s.contactedIndustries = rawStudentContacts;

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
    return await this.getAllStudents(user);
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

    // Merge contacted industries from Workflow requests
    try {
      const studentKeys = [
        student._id ? String(student._id) : '',
        student.studentId,
        student.name,
        `${student.firstName || ''} ${student.lastName || ''}`.trim()
      ].filter(Boolean).map(k => k.toLowerCase());

      const workflows = await WorkflowModel.find({
        $or: [
          { 'requests.studentId': { $in: [student._id ? String(student._id) : '', student.studentId].filter(Boolean) } },
          { 'requests.name': { $regex: new RegExp(`^${(student.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { 'requests.student': { $regex: new RegExp(`^${(student.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
        ]
      }).lean();

      const existingContacts = Array.isArray(student.contactedIndustries) ? [...student.contactedIndustries] : [];
      const seenOrgNames = new Set(
        existingContacts.map(c => (c.organizationName || c.name || '').trim().toLowerCase()).filter(Boolean)
      );

      let hasNewContacts = false;
      workflows.forEach(wf => {
        (wf.requests || []).forEach(r => {
          const rKeys = [r.studentId, r.name, r.student].filter(Boolean).map(k => String(k).trim().toLowerCase());
          const matches = rKeys.some(k => studentKeys.includes(k));
          if (matches && Array.isArray(r.contactedIndustries)) {
            r.contactedIndustries.forEach(c => {
              const orgName = (c.organizationName || c.name || '').trim().toLowerCase();
              if (orgName && !seenOrgNames.has(orgName)) {
                seenOrgNames.add(orgName);
                existingContacts.push(c);
                hasNewContacts = true;
              } else if (!orgName && c) {
                existingContacts.push(c);
                hasNewContacts = true;
              }
            });
          }
        });
      });

      student.contactedIndustries = existingContacts;

      if (hasNewContacts) {
        await StudentModel.findByIdAndUpdate(student._id, {
          $set: { contactedIndustries: existingContacts }
        });
      }
    } catch (wfErr) {
      console.error('[StudentService] Failed to merge workflow contacts in getStudentById:', wfErr.message);
    }

    const sObj = student.toObject ? student.toObject() : student;
    if (
      sObj.snoozed === true ||
      sObj.internshipPriority === 'Snooze' ||
      sObj.internshipPriority === 'Inactive' ||
      sObj.status === 'Inactive'
    ) {
      sObj.placementStatus = 'N/A';
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

    return sanitizeStudentDataForRole(sObj, role);
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

    // Enforce placementStatus: Snooze and Inactive students must strictly be 'N/A'
    if (
      studentData.snoozed === true ||
      studentData.internshipPriority === 'Snooze' ||
      studentData.internshipPriority === 'Inactive' ||
      studentData.status === 'Inactive'
    ) {
      studentData.placementStatus = 'N/A';
    } else if (
      studentData.status === 'Active' &&
      ['Normal', 'Urgent'].includes(studentData.internshipPriority)
    ) {
      if (!studentData.placementStatus || studentData.placementStatus === 'N/A') {
        studentData.placementStatus = 'In Progress';
      }
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

    // Sync placement dates / status into workflow internships, appointments, requests, and payments if present
    if (student && (studentData.commencementDate || studentData.completionDate || studentData.placementStatus || studentData.status || studentData.snoozed !== undefined || studentData.internshipPriority !== undefined)) {
      try {
        const studentBizId = String(student.studentId || '').trim();
        const studentDbId = String(student._id || student.id || '').trim();
        const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const isCompleted = ['Placement Completed', 'Completed'].includes(studentData.placementStatus);
        const isInactive = ['Inactive', 'Suspended', 'Graduated'].includes(studentData.status) || studentData.internshipPriority === 'Inactive';

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

        // 1. Update WorkflowModel embedded internships, appointments & requests
        const workflows = await WorkflowModel.find({
          $or: [
            ...(studentBizId ? [{ 'internships.studentId': studentBizId }, { 'appointments.studentId': studentBizId }, { 'requests.studentId': studentBizId }] : []),
            ...(studentDbId ? [{ 'internships.studentId': studentDbId }, { 'appointments.studentId': studentDbId }, { 'requests.studentId': studentDbId }] : []),
            ...(studentName ? [{ 'internships.student': new RegExp(`^${studentName}$`, 'i') }, { 'appointments.student': new RegExp(`^${studentName}$`, 'i') }, { 'requests.student': new RegExp(`^${studentName}$`, 'i') }] : []),
          ],
        });

        for (const wf of workflows) {
          let wfModified = false;
          (wf.internships || []).forEach((i) => {
            const matches =
              (studentBizId && String(i.studentId || '').trim().toLowerCase() === studentBizId.toLowerCase()) ||
              (studentDbId && String(i.studentId || '').trim().toLowerCase() === studentDbId.toLowerCase()) ||
              (studentName && String(i.student || '').trim().toLowerCase() === studentName.toLowerCase());
            if (matches) {
              if (studentData.commencementDate) i.start = studentData.commencementDate;
              if (studentData.completionDate) i.end = studentData.completionDate;
              if (studentData.placementStatus) {
                i.status = isCompleted ? 'Completed' : studentData.placementStatus;
                if (isCompleted) i.progress = 100;
              }
              // If student account status is Inactive/Suspended/Graduated, mark workflow items as inactive
              if (isInactive && !['Completed', 'Placement Completed'].includes(i.status)) {
                i.status = 'Inactive';
                i.progress = 0;
              }
              wfModified = true;
            }
          });

          (wf.appointments || []).forEach((a) => {
            const matches =
              (studentBizId && String(a.studentId || '').trim().toLowerCase() === studentBizId.toLowerCase()) ||
              (studentDbId && String(a.studentId || '').trim().toLowerCase() === studentDbId.toLowerCase()) ||
              (studentName && String(a.student || '').trim().toLowerCase() === studentName.toLowerCase());
            if (matches) {
              if (studentData.commencementDate) a.commencementDate = studentData.commencementDate;
              if (studentData.completionDate) a.expectedCompletionDate = studentData.completionDate;
              if (isCompleted) {
                a.status = 'Completed';
                a.appointmentOutcome = 'successful';
              } else if (['Withdrawn', 'Student Withdraw', 'Student Withdrawn'].includes(studentData.placementStatus)) {
                a.status = 'Withdrawn';
                a.appointmentOutcome = 'student_withdrawal';
              } else if (['Industry Rejected', 'Declined'].includes(studentData.placementStatus)) {
                a.status = 'Industry Rejected';
                a.appointmentOutcome = 'industry_rejected';
              } else if (['Student Missed Appointment', 'No Show'].includes(studentData.placementStatus)) {
                a.status = 'No Show';
                a.appointmentOutcome = 'student_missed';
              } else if (studentData.placementStatus === 'Not Suitable Site') {
                a.status = 'Not Suitable Site';
                a.appointmentOutcome = 'not_suitable_site';
              } else if (studentData.placementStatus === 'Placement Started') {
                a.status = 'Confirmed';
              }
              // If student account status is Inactive/Suspended/Graduated, mark appointments as inactive
              if (isInactive && !['Completed', 'Placement Completed'].includes(a.status)) {
                a.status = 'Inactive';
                a.appointmentOutcome = 'inactive';
              }
              wfModified = true;
            }
          });

          (wf.requests || []).forEach((r) => {
            const matches =
              (studentBizId && String(r.studentId || '').trim().toLowerCase() === studentBizId.toLowerCase()) ||
              (studentDbId && String(r.studentId || '').trim().toLowerCase() === studentDbId.toLowerCase()) ||
              (studentName && String(r.student || '').trim().toLowerCase() === studentName.toLowerCase());
            if (matches) {
              if (Array.isArray(studentData.contactedIndustries) && studentData.contactedIndustries.length > 0) {
                if (!r.contactedIndustries) r.contactedIndustries = [];
                const existingOrgNames = new Set(r.contactedIndustries.map(c => (c.organizationName || c.name || '').trim().toLowerCase()));
                studentData.contactedIndustries.forEach(c => {
                  const cOrg = (c.organizationName || c.name || '').trim().toLowerCase();
                  if (cOrg && !existingOrgNames.has(cOrg)) {
                    existingOrgNames.add(cOrg);
                    r.contactedIndustries.push(c);
                    wfModified = true;
                  }
                });
                if (r.status === 'New' || r.status === 'On Hold') {
                  r.status = 'Industry Contacted';
                  wfModified = true;
                }
              }
              if (['Withdrawn', 'Student Withdraw', 'Student Withdrawn', 'Industry Rejected', 'Declined', 'Not Suitable Site', 'Student Missed Appointment'].includes(studentData.placementStatus)) {
                r.status = studentData.placementStatus;
                r.returnedToStep1 = true;
                wfModified = true;
              }
              if (studentData.snoozed === true || studentData.internshipPriority === 'Snooze') {
                r.priority = 'Snooze';
                r.returnedToStep1 = true;
                r.status = 'On Hold';
                wfModified = true;
              } else if (studentData.internshipPriority === 'Inactive' || studentData.status === 'Inactive') {
                r.priority = 'Inactive';
                r.returnedToStep1 = true;
                r.status = 'On Hold';
                wfModified = true;
              } else if (['Normal', 'Urgent'].includes(studentData.internshipPriority)) {
                r.priority = studentData.internshipPriority;
                r.returnedToStep1 = false;
                if (r.status === 'On Hold') r.status = 'New';
                wfModified = true;
              } else if (studentData.snoozed === false && r.priority === 'Snooze') {
                r.priority = 'Normal';
                r.returnedToStep1 = false;
                if (r.status === 'On Hold') r.status = 'New';
                wfModified = true;
              }
            }
          });

          if (wfModified) {
            await wf.save({ validateBeforeSave: false });
          }
        }

        // 2. Update standalone AppointmentModel
        if (studentData.placementStatus) {
          try {
            const AppointmentModel = (await import('../appointment/appointment.model.js')).default;
            if (AppointmentModel) {
              const apptUpdate = {};
              if (isCompleted) {
                apptUpdate.status = 'Completed';
                apptUpdate.appointmentOutcome = 'successful';
              } else if (['Withdrawn', 'Student Withdraw', 'Student Withdrawn'].includes(studentData.placementStatus)) {
                apptUpdate.status = 'Withdrawn';
                apptUpdate.appointmentOutcome = 'student_withdrawal';
              } else if (['Industry Rejected', 'Declined'].includes(studentData.placementStatus)) {
                apptUpdate.status = 'Industry Rejected';
                apptUpdate.appointmentOutcome = 'industry_rejected';
              } else if (['Student Missed Appointment', 'No Show'].includes(studentData.placementStatus)) {
                apptUpdate.status = 'No Show';
                apptUpdate.appointmentOutcome = 'student_missed';
              } else if (studentData.placementStatus === 'Not Suitable Site') {
                apptUpdate.status = 'Not Suitable Site';
                apptUpdate.appointmentOutcome = 'not_suitable_site';
              } else if (studentData.placementStatus === 'Placement Started') {
                apptUpdate.status = 'Confirmed';
              }
              if (Object.keys(apptUpdate).length > 0) {
                await AppointmentModel.updateMany(
                  {
                    $or: [
                      ...(studentBizId ? [{ studentId: studentBizId }, { studentId: new RegExp(`^${studentBizId}$`, 'i') }] : []),
                      ...(studentName ? [{ student: studentName }, { student: new RegExp(`^${studentName}$`, 'i') }] : []),
                    ],
                  },
                  { $set: apptUpdate },
                  { runValidators: false }
                );
              }
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

  static async syncAllWorkflowContactsToStudents() {
    try {
      const workflows = await WorkflowModel.find({}, { requests: 1 }).lean();
      const allRequests = workflows.flatMap((w) => w.requests || []);
      const requestsWithContacts = allRequests.filter(
        (r) => Array.isArray(r.contactedIndustries) && r.contactedIndustries.length > 0
      );
      if (requestsWithContacts.length === 0) return 0;

      let syncedCount = 0;
      for (const req of requestsWithContacts) {
        const studentKeys = [req.studentId, req.student, req.name].filter(Boolean);
        if (studentKeys.length === 0) continue;

        const orConditions = [];
        if (req.studentId) {
          orConditions.push({ studentId: req.studentId });
          if (mongoose.Types.ObjectId.isValid(req.studentId)) {
            orConditions.push({ _id: req.studentId });
          }
        }
        if (req.name) {
          orConditions.push({ name: req.name });
          orConditions.push({ name: { $regex: new RegExp(`^${req.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }
        if (req.student && req.student !== req.name) {
          orConditions.push({ name: req.student });
          orConditions.push({ name: { $regex: new RegExp(`^${req.student.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
        }

        const matchedStudents = await StudentModel.find({ $or: orConditions });
        for (const stu of matchedStudents) {
          const currentContacts = Array.isArray(stu.contactedIndustries) ? [...stu.contactedIndustries] : [];
          const seenOrgs = new Set(
            currentContacts.map((c) => (c.organizationName || c.name || '').trim().toLowerCase()).filter(Boolean)
          );
          let modified = false;
          for (const c of req.contactedIndustries) {
            const org = (c.organizationName || c.name || '').trim().toLowerCase();
            if (org && !seenOrgs.has(org)) {
              seenOrgs.add(org);
              currentContacts.push(c);
              modified = true;
            } else if (!org && c) {
              currentContacts.push(c);
              modified = true;
            }
          }
          if (modified) {
            await StudentModel.findByIdAndUpdate(stu._id, {
              $set: {
                contactedIndustries: currentContacts,
                placementStatus: stu.placementStatus === 'Awaiting' ? 'Industry Contacted' : stu.placementStatus,
              },
            });
            syncedCount++;
          }
        }
      }
      return syncedCount;
    } catch (err) {
      console.error('[StudentService] syncAllWorkflowContactsToStudents error:', err.message);
      return 0;
    }
  }
}
