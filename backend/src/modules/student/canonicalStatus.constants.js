// ===== Canonical Student Lifecycle Status Constants =====
// Authoritative single-source-of-truth status taxonomy for Mantis Placement Portal.

export const CANONICAL_STATUSES = Object.freeze({
  AWAITING: 'Awaiting',
  IN_PROGRESS: 'In Progress',
  INDUSTRY_CONTACTED: 'Industry Contacted',
  APPOINTMENT_SCHEDULED: 'Appointment Scheduled',
  APPOINTMENT_SUCCESSFUL: 'Appointment Successful',
  PLACEMENT_STARTED: 'Placement Started',
  PLACEMENT_COMPLETED: 'Placement Completed',

  // Exceptional / Pause statuses
  STUDENT_WITHDRAW: 'Student Withdraw',
  INDUSTRY_REJECTED: 'Industry Rejected',
  STUDENT_MISSED_APPOINTMENT: 'Student Missed Appointment',
  NOT_SUITABLE_SITE: 'Not Suitable Site',
  SNOOZED: 'Snoozed',
  INACTIVE: 'Inactive',
});

export const CANONICAL_STATUS_LIST = Object.freeze(Object.values(CANONICAL_STATUSES));

export const EXCEPTIONAL_STATUSES = Object.freeze([
  CANONICAL_STATUSES.STUDENT_WITHDRAW,
  CANONICAL_STATUSES.INDUSTRY_REJECTED,
  CANONICAL_STATUSES.STUDENT_MISSED_APPOINTMENT,
  CANONICAL_STATUSES.NOT_SUITABLE_SITE,
  CANONICAL_STATUSES.SNOOZED,
  CANONICAL_STATUSES.INACTIVE,
]);

export const isExceptionalStatus = (status) => {
  return EXCEPTIONAL_STATUSES.includes(status);
};
