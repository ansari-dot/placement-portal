import { CANONICAL_STATUSES, isExceptionalStatus } from './canonicalStatus.constants.js';

function parseDate(dStr) {
  if (!dStr) return null;
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? null : d;
}

function parseLocalDateNoon(str) {
  if (!str) return null;
  const parts = String(str).split('T')[0].split('-').map(Number);
  if (parts.length !== 3) return parseDate(str);
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 12, 0, 0);
}

const norm = (v) => String(v || '').trim().toLowerCase();

/**
 * Filter items that strictly belong to this student using verified primary keys
 * (Student Business ID or Database ObjectId, with fallback to unique name).
 */
export function matchStudentItems(items = [], student = {}, nameCounts = null) {
  const sId = norm(student.studentId);
  const sDbId = norm(student._id || student.id);
  const sName = norm(student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim());
  const isNameUnique = nameCounts ? nameCounts.get(sName) === 1 : false;

  return items.filter((item) => {
    if (!item) return false;
    const itemStuId = norm(item.studentId || item.id);
    const itemStuDbId = norm(item.studentDbId);
    const itemStudent = norm(item.student || item.studentName);

    // Primary: Exact ID match (Business ID or MongoDB ObjectId)
    if (sId && (itemStuId === sId || itemStuDbId === sId)) return true;
    if (sDbId && (itemStuDbId === sDbId || itemStuId === sDbId)) return true;

    // Secondary fallback: Only if student name is verified unique across the entire student population
    if (isNameUnique && itemStudent === sName) return true;

    return false;
  });
}

/**
 * Pure business rule resolver for a single student's canonical lifecycle status.
 *
 * @param {Object} student - Student document or plain object
 * @param {Object} context - { requests: [], appointments: [], internships: [], nameCounts: Map }
 * @param {Date} [referenceDate] - Current reference date for commencement checks (defaults to now)
 * @returns {Object} { canonicalStatus: string, reason: string, isExceptional: boolean }
 */
export function resolveCanonicalStudentStatus(student, context = {}, referenceDate = new Date()) {
  if (!student) {
    return {
      canonicalStatus: CANONICAL_STATUSES.AWAITING,
      reason: 'No student data provided.',
      isExceptional: false,
    };
  }

  const todayStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  const rawStatus = student.status || 'Active';
  const rawPriority = student.internshipPriority || 'Normal';
  const isSnoozed = Boolean(student.snoozed || rawPriority === 'Snooze');
  const isInactive = rawStatus === 'Inactive' || rawPriority === 'Inactive';

  // 1. RULE 1: Snooze & Inactive Preservation
  if (isSnoozed) {
    return {
      canonicalStatus: CANONICAL_STATUSES.SNOOZED,
      reason: 'Student profile has active Snooze status.',
      isExceptional: true,
    };
  }
  if (isInactive) {
    return {
      canonicalStatus: CANONICAL_STATUSES.INACTIVE,
      reason: 'Student profile is Inactive.',
      isExceptional: true,
    };
  }

  // 2. Extract verified matching workflow records (Orphaned records are excluded)
  const studentRequests = matchStudentItems(context.requests || [], student, context.nameCounts);
  const studentAppointments = matchStudentItems(context.appointments || [], student, context.nameCounts);
  const studentInternships = matchStudentItems(context.internships || [], student, context.nameCounts);

  // Chronological sorting (newest first)
  const sortedAppts = [...studentAppointments].sort((a, b) => {
    const da = parseDate(a.date || a.updatedAt || a.createdAt) || new Date(0);
    const db = parseDate(b.date || b.updatedAt || b.createdAt) || new Date(0);
    return db - da;
  });

  const sortedInts = [...studentInternships].sort((a, b) => {
    const da = parseDate(a.start || a.updatedAt || a.createdAt) || new Date(0);
    const db = parseDate(b.start || b.updatedAt || b.createdAt) || new Date(0);
    return db - da;
  });

  // 3. RULE 2: Placement Completed
  // Must be supported by verified completion state or reliable end-of-placement evidence
  const completedInt = sortedInts.find((i) => ['Completed', 'Placement Completed'].includes(i.status));
  const completedAppt = sortedAppts.find((a) => ['Completed', 'Placement Completed'].includes(a.status));
  const pastEndDateInt = sortedInts.find((i) => {
    const end = parseLocalDateNoon(i.end);
    return end && end < todayStart && !['Cancelled', 'Withdrawn'].includes(i.status);
  });
  const pastEndDateAppt = sortedAppts.find((a) => {
    const end = parseLocalDateNoon(a.expectedCompletionDate || a.end);
    return end && end < todayStart && !['Cancelled', 'Withdrawn', 'Declined', 'Industry Rejected'].includes(a.status);
  });

  if (completedInt || completedAppt || ((pastEndDateInt || pastEndDateAppt) && ['Placement Completed', 'Completed'].includes(student.placementStatus))) {
    return {
      canonicalStatus: CANONICAL_STATUSES.PLACEMENT_COMPLETED,
      reason: completedInt
        ? `Internship marked Completed (${completedInt.intId || completedInt.id || 'record'}).`
        : completedAppt
        ? `Appointment placement marked Completed (${completedAppt.apptId || completedAppt.id || 'record'}).`
        : `Placement end date elapsed with verified completion.`,
      isExceptional: false,
    };
  }

  // 4. RULE 3: Placement Started
  // Must be supported by actual joining/commencement evidence (never inferred from future end date alone)
  const activeInt = sortedInts.find((i) => {
    if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Declined'].includes(i.status)) return false;
    const start = parseLocalDateNoon(i.start);
    return ['Active', 'Placement Started', 'Joined'].includes(i.status) || (start && start <= todayStart);
  });

  const activeCommencementAppt = sortedAppts.find((a) => {
    if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
    if (a.appointmentOutcome === 'successful' || a.status === 'Confirmed') {
      const commDate = parseLocalDateNoon(a.commencementDate);
      return commDate && commDate <= todayStart;
    }
    return false;
  });

  if (activeInt || activeCommencementAppt) {
    return {
      canonicalStatus: CANONICAL_STATUSES.PLACEMENT_STARTED,
      reason: activeInt
        ? `Placement commenced (start date: ${activeInt.start || 'verified'}).`
        : `Placement commenced (commencement date: ${activeCommencementAppt.commencementDate}).`,
      isExceptional: false,
    };
  }

  // 5. RULE 4: Appointment Successful
  // Interview completed successfully; awaiting placement commencement
  const successfulAppt = sortedAppts.find((a) => {
    if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
    return a.appointmentOutcome === 'successful' || a.status === 'Confirmed';
  });

  if (successfulAppt) {
    const commDate = parseLocalDateNoon(successfulAppt.commencementDate);
    const dateDesc = commDate && commDate > todayStart ? ` (Scheduled start: ${successfulAppt.commencementDate})` : '';
    return {
      canonicalStatus: CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL,
      reason: `Interview confirmed successful${dateDesc}; awaiting placement start.`,
      isExceptional: false,
    };
  }

  // 6. RULE 5: Active Appointment Scheduled
  const scheduledAppt = sortedAppts.find((a) => {
    return (
      ['Scheduled', 'Rescheduled'].includes(a.status) &&
      !['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status) &&
      a.appointmentOutcome !== 'student_withdrawal'
    );
  });

  if (scheduledAppt) {
    return {
      canonicalStatus: CANONICAL_STATUSES.APPOINTMENT_SCHEDULED,
      reason: `Interview scheduled with ${scheduledAppt.company || 'host facility'} for ${scheduledAppt.date || 'upcoming'}.`,
      isExceptional: false,
    };
  }

  // 7. RULE 6: Exceptional Appointment Outcomes (Terminal / Withdrawal)
  const latestAppt = sortedAppts[0];
  if (latestAppt) {
    if (latestAppt.status === 'Student Withdraw' || latestAppt.appointmentOutcome === 'student_withdrawal') {
      return {
        canonicalStatus: CANONICAL_STATUSES.STUDENT_WITHDRAW,
        reason: 'Student withdrew from interview/placement.',
        isExceptional: true,
      };
    }
    if (latestAppt.status === 'Industry Rejected' || latestAppt.appointmentOutcome === 'industry_rejected') {
      return {
        canonicalStatus: CANONICAL_STATUSES.INDUSTRY_REJECTED,
        reason: 'Industry/host rejected student application.',
        isExceptional: true,
      };
    }
    if (latestAppt.status === 'Student Missed Appointment' || latestAppt.appointmentOutcome === 'student_missed' || latestAppt.status === 'No Show') {
      return {
        canonicalStatus: CANONICAL_STATUSES.STUDENT_MISSED_APPOINTMENT,
        reason: 'Student missed scheduled interview.',
        isExceptional: true,
      };
    }
    if (latestAppt.status === 'Not Suitable Site' || latestAppt.appointmentOutcome === 'not_suitable_site') {
      return {
        canonicalStatus: CANONICAL_STATUSES.NOT_SUITABLE_SITE,
        reason: 'Host site deemed not suitable for placement requirements.',
        isExceptional: true,
      };
    }
  }

  // 8. RULE 7: Industry Contacted
  const hasContactedIndustry =
    studentRequests.some((r) => {
      return (Array.isArray(r.contactedIndustries) && r.contactedIndustries.length > 0) || r.status === 'Industry Contacted';
    }) ||
    (Array.isArray(student.contactedIndustries) && student.contactedIndustries.length > 0) ||
    student.placementStatus === 'Industry Contacted';

  if (hasContactedIndustry) {
    return {
      canonicalStatus: CANONICAL_STATUSES.INDUSTRY_CONTACTED,
      reason: 'Industry contacts outreach initiated in Step 2.',
      isExceptional: false,
    };
  }

  // 9. RULE 8: In Progress
  const hasOpenRequest = studentRequests.some((r) => !['Closed', 'Cancelled', 'Rejected'].includes(r.status));
  if (hasOpenRequest || student.placementStatus === 'In Progress') {
    return {
      canonicalStatus: CANONICAL_STATUSES.IN_PROGRESS,
      reason: 'Active placement request in Step 2.',
      isExceptional: false,
    };
  }

  // 10. Default: Awaiting
  return {
    canonicalStatus: CANONICAL_STATUSES.AWAITING,
    reason: 'Student registered; awaiting placement request generation.',
    isExceptional: false,
  };
}

/**
 * Batch resolve canonical statuses for a collection of students and workflows.
 * Pure in-memory calculation; executes ZERO database writes.
 */
export function buildCanonicalStatusMap(students = [], workflows = [], referenceDate = new Date()) {
  const allRequests = workflows.flatMap((w) => w.requests || []);
  const allAppointments = workflows.flatMap((w) => w.appointments || []);
  const allInternships = workflows.flatMap((w) => w.internships || []);

  const nameCounts = new Map();
  students.forEach((s) => {
    const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
    if (sName) {
      nameCounts.set(sName, (nameCounts.get(sName) || 0) + 1);
    }
  });

  const context = {
    requests: allRequests,
    appointments: allAppointments,
    internships: allInternships,
    nameCounts,
  };

  const statusMap = new Map();

  students.forEach((s) => {
    const res = resolveCanonicalStudentStatus(s, context, referenceDate);
    const rawName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
    const normName = norm(rawName);
    const sId = s.studentId ? String(s.studentId).trim() : '';
    const sDbId = String(s._id || s.id || '').trim();

    const keys = [
      sId,
      sId.toLowerCase(),
      sDbId,
      rawName,
      normName,
    ].filter(Boolean);

    keys.forEach((k) => statusMap.set(k, res.canonicalStatus));
  });

  return statusMap;
}
