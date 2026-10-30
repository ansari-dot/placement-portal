import mongoose from 'mongoose';
import RtoModel from '../../modules/rto/rto.model.js';
import IndustryModel from '../../modules/industry/industry.model.js';
import StudentModel from '../../modules/student/student.model.js';
import WorkflowModel from '../../modules/workflow/workflow.model.js';
import {
  sanitizeAppointmentForRole,
  sanitizeInternshipRequestForRole,
  sanitizeInternshipForRole,
  sanitizeStudentDataForRole,
} from './rbacSanitizer.js';

/**
 * Builds a database query filter for the Student collection based on the acting user's role.
 */
export const getStudentQueryScope = async (user) => {
  if (!user) return { _id: null };

  const role = user.role;
  const userEmail = (user.email || '').toLowerCase().trim();

  // Administrators have global access
  if (role === 'Administrator' || role === 'Admin') {
    return {};
  }

  // Coordinators only see their assigned students
  if (role === 'Coordinator' || role === 'Placement Coordinator') {
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
    return { $or: coordMatches };
  }

  // RTO Managers only see students registered under their own RTO
  if (role === 'RTO Manager' || role === 'RTO') {
    let rtoName = user.rtoName;
    let rtoId = user.rtoId;

    if (!rtoName && userEmail) {
      const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
      if (matchedRto) {
        rtoName = matchedRto.name;
        rtoId = matchedRto._id;
      }
    }
    if (!rtoName && user.requestedOrgName) {
      const matchedRto = await RtoModel.findOne({
        name: { $regex: `^${user.requestedOrgName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (matchedRto) {
        rtoName = matchedRto.name;
        rtoId = matchedRto._id;
      } else {
        rtoName = user.requestedOrgName;
      }
    }

    const rtoConditions = [];
    if (rtoName) {
      const cleanName = rtoName.trim();
      const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      rtoConditions.push({ assignedRto: { $regex: `^${escaped}$`, $options: 'i' } });
      rtoConditions.push({ institute: { $regex: `^${escaped}$`, $options: 'i' } });
    }
    if (rtoId) {
      rtoConditions.push({ rtoId });
      if (mongoose.Types.ObjectId.isValid(rtoId)) {
        rtoConditions.push({ rtoId: new mongoose.Types.ObjectId(rtoId) });
      }
    }

    return rtoConditions.length > 0 ? { $or: rtoConditions } : { _id: null };
  }

  // Students only see their own record
  if (role === 'Student') {
    const studentConditions = [];
    if (userEmail) {
      const escaped = userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      studentConditions.push({ emailAddress: { $regex: `^${escaped}$`, $options: 'i' } });
    }
    if (user.studentIdRef && mongoose.Types.ObjectId.isValid(user.studentIdRef)) {
      studentConditions.push({ _id: new mongoose.Types.ObjectId(user.studentIdRef) });
    }
    if (user.requestedStudentId) {
      studentConditions.push({ studentId: user.requestedStudentId.trim() });
    }
    return studentConditions.length > 0 ? { $or: studentConditions } : { _id: null };
  }

  // Industry users only see students assigned to their facility or with orientation appointments
  if (role === 'Industry' || role === 'Industry/Host') {
    let facilityName = user.facilityName;
    let industryId = user.industryId;

    if (!facilityName && industryId) {
      const matchedInd = await IndustryModel.findById(industryId);
      if (matchedInd) facilityName = matchedInd.name;
    }
    if (!facilityName && userEmail) {
      const matchedInd = await IndustryModel.findOne({ contactEmail: userEmail });
      if (matchedInd) {
        facilityName = matchedInd.name;
        industryId = matchedInd._id;
      }
    }
    if (!facilityName && user.requestedFacilityName) {
      const matchedInd = await IndustryModel.findOne({
        name: { $regex: `^${user.requestedFacilityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (matchedInd) {
        facilityName = matchedInd.name;
        industryId = matchedInd._id;
      } else {
        facilityName = user.requestedFacilityName;
      }
    }

    if (!facilityName) return { _id: null };

    const cleanFac = facilityName.trim();
    const escapedFac = cleanFac.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find student IDs linked through appointments or internships with this facility
    const workflows = await WorkflowModel.find({
      $or: [
        { 'appointments.company': { $regex: `^${escapedFac}$`, $options: 'i' } },
        { 'internships.company': { $regex: `^${escapedFac}$`, $options: 'i' } },
      ],
    }).lean();

    const allowedStudentIds = new Set();
    workflows.forEach((wf) => {
      (wf.appointments || []).forEach((appt) => {
        if (appt.company && appt.company.trim().toLowerCase() === cleanFac.toLowerCase()) {
          if (appt.studentId) allowedStudentIds.add(appt.studentId.trim());
        }
      });
      (wf.internships || []).forEach((intern) => {
        if (intern.company && intern.company.trim().toLowerCase() === cleanFac.toLowerCase()) {
          if (intern.studentId) allowedStudentIds.add(intern.studentId.trim());
        }
      });
    });

    const studentIdArray = Array.from(allowedStudentIds);
    return {
      $or: [
        { studentId: { $in: studentIdArray } },
        { placementSite: { $regex: escapedFac, $options: 'i' } },
      ],
    };
  }

  return { _id: null };
};

/**
 * Checks if a specific student document is accessible by the acting user.
 */
export const canUserAccessStudent = async (user, studentDoc) => {
  if (!user || !studentDoc) return false;
  const role = user.role;
  if (role === 'Administrator' || role === 'Admin') return true;

  const scope = await getStudentQueryScope(user);
  const match = await StudentModel.findOne({ _id: studentDoc._id, ...scope }).lean();
  return Boolean(match);
};

/**
 * Filters and sanitizes workflow subdocuments for the acting user.
 */
export const filterWorkflowForUser = async (workflow, user) => {
  if (!workflow) return workflow;
  const role = user?.role;

  const wfObj = typeof workflow.toObject === 'function' ? workflow.toObject() : JSON.parse(JSON.stringify(workflow));

  if (!user || role === 'Administrator' || role === 'Admin') {
    return wfObj;
  }

  // Get allowed students for the acting user
  const studentScope = await getStudentQueryScope(user);
  const allowedStudents = await StudentModel.find(studentScope, { _id: 1, studentId: 1, firstName: 1, lastName: 1, name: 1 }).lean();

  const allowedStudentIdSet = new Set();
  const allowedStudentNameSet = new Set();

  allowedStudents.forEach((stu) => {
    if (stu._id) allowedStudentIdSet.add(String(stu._id).toLowerCase());
    if (stu.studentId) allowedStudentIdSet.add(String(stu.studentId).toLowerCase().trim());
    const fullName = `${stu.firstName || ''} ${stu.lastName || ''}`.trim().toLowerCase();
    const name = String(stu.name || fullName).trim().toLowerCase();
    if (name) allowedStudentNameSet.add(name);
  });

  const isStudentAllowed = (stuId, stuName) => {
    const sId = String(stuId || '').toLowerCase().trim();
    const sName = String(stuName || '').toLowerCase().trim();
    return allowedStudentIdSet.has(sId) || allowedStudentNameSet.has(sName);
  };

  // Filter students list in workflow
  if (Array.isArray(wfObj.students)) {
    wfObj.students = wfObj.students
      .filter((s) => isStudentAllowed(s._id || s.id || s.studentId, s.name))
      .map((s) => sanitizeStudentDataForRole(s, role));
  }

  // Filter and sanitize requests
  if (Array.isArray(wfObj.requests)) {
    wfObj.requests = wfObj.requests
      .filter((r) => isStudentAllowed(r.studentId, r.student))
      .map((r) => sanitizeInternshipRequestForRole(r, role));
  }

  // Filter and sanitize appointments
  if (Array.isArray(wfObj.appointments)) {
    let filteredAppts = wfObj.appointments.filter((a) => isStudentAllowed(a.studentId, a.student));

    // If Industry user, only see appointments for their own facility
    if (role === 'Industry' || role === 'Industry/Host') {
      const facName = (user.facilityName || '').trim().toLowerCase();
      if (facName) {
        filteredAppts = filteredAppts.filter((a) => (a.company || '').trim().toLowerCase() === facName);
      }
    }

    wfObj.appointments = filteredAppts.map((a) => sanitizeAppointmentForRole(a, role));
  }

  // Filter and sanitize internships
  if (Array.isArray(wfObj.internships)) {
    let filteredInterns = wfObj.internships.filter((i) => isStudentAllowed(i.studentId, i.student));

    // If Industry user, only see internships for their own facility
    if (role === 'Industry' || role === 'Industry/Host') {
      const facName = (user.facilityName || '').trim().toLowerCase();
      if (facName) {
        filteredInterns = filteredInterns.filter((i) => (i.company || '').trim().toLowerCase() === facName);
      }
    }

    wfObj.internships = filteredInterns.map((i) => sanitizeInternshipForRole(i, role));
  }

  return wfObj;
};

/**
 * Builds database query filter for the Attendance collection based on the acting user's role.
 */
export const getAttendanceQueryScope = async (user) => {
  if (!user) return { _id: null };

  const role = user.role;
  const userEmail = (user.email || '').toLowerCase().trim();

  // Admin sees all non-deleted attendance
  if (role === 'Administrator' || role === 'Admin') {
    return { isDeleted: false };
  }

  // Industry users only see attendance for their facility
  if (role === 'Industry' || role === 'Industry/Host') {
    let facilityName = user.facilityName;
    let industryId = user.industryId;

    if (!facilityName && industryId) {
      const matchedInd = await IndustryModel.findById(industryId);
      if (matchedInd) facilityName = matchedInd.name;
    }
    if (!facilityName && userEmail) {
      const matchedInd = await IndustryModel.findOne({ contactEmail: userEmail });
      if (matchedInd) {
        facilityName = matchedInd.name;
        industryId = matchedInd._id;
      }
    }
    if (!facilityName && user.requestedFacilityName) {
      const matchedInd = await IndustryModel.findOne({
        name: { $regex: `^${user.requestedFacilityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
      if (matchedInd) {
        facilityName = matchedInd.name;
        industryId = matchedInd._id;
      } else {
        facilityName = user.requestedFacilityName;
      }
    }

    const matchers = [];
    if (facilityName) {
      const escapedFac = facilityName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchers.push({ facilityName: { $regex: `^${escapedFac}$`, $options: 'i' } });
    }
    if (industryId) {
      matchers.push({ industry: industryId });
      if (mongoose.Types.ObjectId.isValid(industryId)) {
        matchers.push({ industry: new mongoose.Types.ObjectId(industryId) });
      }
    }

    return matchers.length > 0 ? { isDeleted: false, $or: matchers } : { _id: null };
  }

  // RTO Managers only see attendance for their students
  if (role === 'RTO Manager' || role === 'RTO') {
    const studentScope = await getStudentQueryScope(user);
    const myStudents = await StudentModel.find(studentScope, { _id: 1, studentId: 1 }).lean();
    const myObjectIds = myStudents.map((s) => s._id).filter(Boolean);
    const myStudentIds = myStudents.map((s) => s.studentId).filter(Boolean);

    return {
      isDeleted: false,
      $or: [{ student: { $in: myObjectIds } }, { studentId: { $in: myStudentIds } }],
    };
  }

  // Students only see their own attendance
  if (role === 'Student') {
    const myStudent = await StudentModel.findOne({ emailAddress: userEmail }, { _id: 1, studentId: 1 }).lean();
    if (!myStudent) return { _id: null };

    return {
      isDeleted: false,
      $or: [{ student: myStudent._id }, { studentId: myStudent.studentId }],
    };
  }

  // Coordinators see attendance for assigned students
  if (role === 'Coordinator' || role === 'Placement Coordinator') {
    const studentScope = await getStudentQueryScope(user);
    const myStudents = await StudentModel.find(studentScope, { _id: 1, studentId: 1 }).lean();
    const myObjectIds = myStudents.map((s) => s._id).filter(Boolean);
    const myStudentIds = myStudents.map((s) => s.studentId).filter(Boolean);

    return {
      isDeleted: false,
      $or: [{ student: { $in: myObjectIds } }, { studentId: { $in: myStudentIds } }],
    };
  }

  return { _id: null };
};
