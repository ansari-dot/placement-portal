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
 * Parses time string like "09:00 AM" or "5:00 PM" into decimal hours
 */
function parseTimeToHours(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours + minutes / 60;
}

/**
 * Calculates daily working hours from availabilityFrom and availabilityTo.
 * Defaults to 8 hours/day if not specified or invalid.
 */
export function getDailyWorkingHours(fromStr, toStr) {
  const from = parseTimeToHours(fromStr);
  const to = parseTimeToHours(toStr);
  if (from !== null && to !== null && to > from) {
    const diff = to - from;
    if (diff >= 1 && diff <= 12) return diff;
  }
  return 8;
}

/**
 * Normalizes availability days into an array of JS day numbers (0 = Sun, 1 = Mon, ..., 6 = Sat)
 */
export function getAvailableDayIndices(availabilityDays, requireExplicitDays = false) {
  const DAY_MAP = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6,
  };

  if (!availabilityDays) {
    return requireExplicitDays ? [] : [1, 2, 3, 4, 5];
  }

  const indices = new Set();

  if (Array.isArray(availabilityDays)) {
    availabilityDays.forEach((d) => {
      const k = String(d).trim().toLowerCase();
      if (DAY_MAP[k] !== undefined) indices.add(DAY_MAP[k]);
    });
  } else if (typeof availabilityDays === 'object') {
    const entries = availabilityDays instanceof Map
      ? Array.from(availabilityDays.entries())
      : Object.entries(availabilityDays);

    entries.forEach(([key, val]) => {
      if (val === true || val === 'true') {
        const k = String(key).trim().toLowerCase();
        if (DAY_MAP[k] !== undefined) indices.add(DAY_MAP[k]);
      }
    });
  }

  return indices.size > 0 ? Array.from(indices).sort() : (requireExplicitDays ? [] : [1, 2, 3, 4, 5]);
}

/**
 * Calculates the exact expected completion Date for a student placement based on
 * commencement date, required placement hours, and weekly availability schedule.
 */
export function calculatePlacementEndDate(
  commencementDate,
  placementHours,
  availabilityDays,
  availabilityFrom = '09:00 AM',
  availabilityTo = '05:00 PM',
  { requireCompleteSchedule = false } = {}
) {
  if (!commencementDate) return '';

  const startText = String(commencementDate).split('T')[0];
  const startParts = startText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const startDate = startParts
    ? new Date(Number(startParts[1]), Number(startParts[2]) - 1, Number(startParts[3]))
    : new Date(commencementDate);
  if (isNaN(startDate.getTime())) return '';

  const totalHours = Number(placementHours);
  if (!totalHours || totalHours <= 0) {
    if (requireCompleteSchedule) return '';
    const defaultEnd = new Date(startDate);
    defaultEnd.setDate(defaultEnd.getDate() + 12 * 7);
    return defaultEnd.toISOString().split('T')[0];
  }

  if (requireCompleteSchedule && (!availabilityDays || !availabilityFrom || !availabilityTo)) return '';

  const hoursPerDay = getDailyWorkingHours(availabilityFrom, availabilityTo);
  const availableDayIndices = getAvailableDayIndices(availabilityDays, requireCompleteSchedule);
  if (requireCompleteSchedule && availableDayIndices.length === 0) return '';

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  let accumulatedHours = 0;
  let safetyLimit = 730;

  while (accumulatedHours < totalHours && safetyLimit > 0) {
    safetyLimit--;
    const dayOfWeek = current.getDay();

    if (availableDayIndices.includes(dayOfWeek)) {
      accumulatedHours += hoursPerDay;
      if (accumulatedHours >= totalHours) {
        break;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  const year = current.getFullYear();
  const month = String(current.getMonth() + 1).padStart(2, '0');
  const day = String(current.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Filter items that strictly belong to this student using verified primary keys
 * (Student Business ID, Enrollment ID, or Database ObjectId, with fallback to unique name).
 */
export function matchStudentItems(items = [], student = {}, nameCounts = null) {
  const sId = norm(student.studentId);
  const sEnrollmentId = norm(student.enrollmentId);
  const sDbId = norm(student._id || student.id);
  const sName = norm(student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim());
  const isNameUnique = nameCounts ? nameCounts.get(sName) === 1 : Boolean(sName);

  return items.filter((item) => {
    if (!item) return false;
    const itemStuId = norm(item.studentId || item.id);
    const itemStuDbId = norm(item.studentDbId);
    const itemStudent = norm(item.student || item.studentName || item.name);

    // Primary: Exact ID match (Business ID, Enrollment ID, or MongoDB ObjectId)
    if (sId && (itemStuId === sId || itemStuDbId === sId)) return true;
    if (sEnrollmentId && (itemStuId === sEnrollmentId || itemStuDbId === sEnrollmentId)) return true;
    if (sDbId && (itemStuDbId === sDbId || itemStuId === sDbId)) return true;

    // Secondary fallback: Only if student name is verified
    if (isNameUnique && itemStudent === sName) return true;

    return false;
  });
}

/**
 * Pure business rule resolver for a single student's canonical lifecycle status.
 *
 * @param {Object} student - Student document or plain object
 * @param {Object} context - { requests: [], appointments: [], internships: [], attendances: [], nameCounts: Map }
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
  const studentAttendances = matchStudentItems(context.attendances || [], student, context.nameCounts);

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
  // Verified by:
  // A. Explicit Completed status on record
  const completedInt = sortedInts.find((i) => ['Completed', 'Placement Completed'].includes(i.status));
  const completedAppt = sortedAppts.find((a) => ['Completed', 'Placement Completed'].includes(a.status));

  // B. Verified attendance hours meeting required placement hours
  let attendanceVerified = false;
  if (student.placementHours && Number(student.placementHours) > 0 && studentAttendances.length > 0) {
    const totalAttHours = studentAttendances.reduce((acc, att) => {
      if (['Present', 'Completed'].includes(att.status)) {
        return acc + (Number(att.totalHours) || 0);
      }
      return acc;
    }, 0);
    if (totalAttHours >= Number(student.placementHours)) {
      attendanceVerified = true;
    }
  }

  // C. Explicitly saved expected completion date has elapsed
  const pastEndDateInt = sortedInts.find((i) => {
    if (['Cancelled', 'Withdrawn', 'Declined'].includes(i.status)) return false;
    const end = parseLocalDateNoon(i.end);
    const start = parseLocalDateNoon(i.start);
    return end && end < todayStart && (start ? start <= todayStart : true);
  });
  const pastExplicitEndDateAppt = sortedAppts.find((a) => {
    if (['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
    const rawEnd = a.expectedCompletionDate || a.end;
    if (!rawEnd) return false;
    const end = parseLocalDateNoon(rawEnd);
    const commDate = parseLocalDateNoon(a.commencementDate || a.start);
    return end && end < todayStart && (commDate ? commDate <= todayStart : true);
  });

  // D. Schedule-verified completion date has elapsed (when not explicitly saved)
  let pastScheduleEndDateAppt = null;
  if (!pastExplicitEndDateAppt) {
    pastScheduleEndDateAppt = sortedAppts.find((a) => {
      if (['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
      const commDate = parseLocalDateNoon(a.commencementDate || a.start);
      if (!commDate || commDate > todayStart) return false;
      const derivedEndStr = calculatePlacementEndDate(
        a.commencementDate || a.start,
        student.placementHours,
        student.availabilityDays,
        student.availabilityFrom,
        student.availabilityTo,
        { requireCompleteSchedule: true }
      );
      if (!derivedEndStr) return false;
      const derivedEnd = parseLocalDateNoon(derivedEndStr);
      return derivedEnd && derivedEnd < todayStart;
    });
  }

  if (
    completedInt ||
    completedAppt ||
    attendanceVerified ||
    pastEndDateInt ||
    pastExplicitEndDateAppt ||
    pastScheduleEndDateAppt ||
    ['Placement Completed', 'Completed'].includes(student.placementStatus)
  ) {
    return {
      canonicalStatus: CANONICAL_STATUSES.PLACEMENT_COMPLETED,
      reason: completedInt
        ? `Internship marked Completed (${completedInt.intId || completedInt.id || 'record'}).`
        : completedAppt
          ? `Appointment placement marked Completed (${completedAppt.apptId || completedAppt.id || 'record'}).`
          : attendanceVerified
            ? `Placement attendance verified (${student.placementHours} hours logged).`
            : pastExplicitEndDateAppt
              ? `Placement scheduled period elapsed (${pastExplicitEndDateAppt.expectedCompletionDate || pastExplicitEndDateAppt.end}).`
              : pastScheduleEndDateAppt
                ? `Placement schedule-verified period elapsed.`
                : pastEndDateInt
                  ? `Internship scheduled period elapsed (${pastEndDateInt.end}).`
                  : `Verified placement completion in student profile.`,
      isExceptional: false,
    };
  }

  // 4. RULE 3: Placement Started
  // Must be supported by actual joining/commencement evidence and placement period must NOT have ended
  const isApptEndElapsed = (a) => {
    const rawEnd = a.expectedCompletionDate || a.end;
    if (rawEnd) {
      const end = parseLocalDateNoon(rawEnd);
      return end && end < todayStart;
    }
    const derivedEndStr = calculatePlacementEndDate(
      a.commencementDate || a.start,
      student.placementHours,
      student.availabilityDays,
      student.availabilityFrom,
      student.availabilityTo,
      { requireCompleteSchedule: true }
    );
    if (derivedEndStr) {
      const end = parseLocalDateNoon(derivedEndStr);
      return end && end < todayStart;
    }
    return false;
  };

  const activeInt = sortedInts.find((i) => {
    if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Declined'].includes(i.status)) return false;
    const end = parseLocalDateNoon(i.end);
    if (end && end < todayStart) return false;
    const start = parseLocalDateNoon(i.start);
    return ['Active', 'Placement Started', 'Joined'].includes(i.status) || (start && start <= todayStart);
  });

  const activeCommencementAppt = sortedAppts.find((a) => {
    if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
    if (isApptEndElapsed(a)) return false;
    const commDate = parseLocalDateNoon(a.commencementDate || a.start);
    if (['Placement Started', 'Active', 'Joined'].includes(a.status)) return true;
    if (a.appointmentOutcome === 'successful' || a.status === 'Confirmed') {
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
    const sEnrollmentId = s.enrollmentId ? String(s.enrollmentId).trim() : '';
    const sDbId = String(s._id || s.id || '').trim();

    const keys = [
      sId,
      sId.toLowerCase(),
      sEnrollmentId,
      sEnrollmentId.toLowerCase(),
      sDbId,
      rawName,
      normName,
    ].filter(Boolean);

    keys.forEach((k) => statusMap.set(k, res.canonicalStatus));
  });

  return statusMap;
}
