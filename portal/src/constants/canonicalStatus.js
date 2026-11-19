// ===== Centralized Canonical Student Lifecycle Status Constants (Frontend) =====
// Authoritative status taxonomy for Mantis Placement Portal

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

export const CANONICAL_BADGE_STYLES = Object.freeze({
  [CANONICAL_STATUSES.AWAITING]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Awaiting',
  },
  [CANONICAL_STATUSES.IN_PROGRESS]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'In Progress',
  },
  [CANONICAL_STATUSES.INDUSTRY_CONTACTED]: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    label: 'Industry Contacted',
  },
  [CANONICAL_STATUSES.APPOINTMENT_SCHEDULED]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    label: 'Appointment Scheduled',
  },
  [CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Appointment Successful',
  },
  [CANONICAL_STATUSES.PLACEMENT_STARTED]: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
    label: 'Placement Started',
  },
  [CANONICAL_STATUSES.PLACEMENT_COMPLETED]: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    label: 'Placement Completed',
  },
  [CANONICAL_STATUSES.STUDENT_WITHDRAW]: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500',
    label: 'Student Withdraw',
  },
  [CANONICAL_STATUSES.INDUSTRY_REJECTED]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Industry Rejected',
  },
  [CANONICAL_STATUSES.STUDENT_MISSED_APPOINTMENT]: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Student Missed Appt',
  },
  [CANONICAL_STATUSES.NOT_SUITABLE_SITE]: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    label: 'Not Suitable Site',
  },
  [CANONICAL_STATUSES.SNOOZED]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Snoozed',
  },
  [CANONICAL_STATUSES.INACTIVE]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-300',
    dot: 'bg-slate-400',
    label: 'Inactive',
  },
});

export const getCanonicalStatusStyle = (status) => {
  if (!status) return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.AWAITING];
  
  // Normalize alias strings
  const normStatus = String(status).trim();
  if (normStatus === 'Snooze') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.SNOOZED];
  if (normStatus === 'Student Withdrawn' || normStatus === 'Withdrawn') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.STUDENT_WITHDRAW];
  if (normStatus === 'No Show') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.STUDENT_MISSED_APPOINTMENT];
  if (normStatus === 'Declined') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.INDUSTRY_REJECTED];
  if (normStatus === 'Waiting to Join' || normStatus === 'Joined' || normStatus === 'Active') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.PLACEMENT_STARTED];
  if (normStatus === 'Completed') return CANONICAL_BADGE_STYLES[CANONICAL_STATUSES.PLACEMENT_COMPLETED];

  return CANONICAL_BADGE_STYLES[normStatus] || {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: normStatus,
  };
};
