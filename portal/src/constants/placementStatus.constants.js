// Single Source of Truth for Placement Statuses across Mantis Placement Portal
// Perfectly matches backend CANONICAL_STATUS_LIST in canonicalStatus.constants.js

export const PLACEMENT_STATUSES = Object.freeze([
  'Awaiting',
  'In Progress',
  'Industry Contacted',
  'Appointment Scheduled',
  'Appointment Successful',
  'Placement Started',
  'Placement Completed',
  'Student Withdraw',
  'Student Missed Appointment',
  'Industry Rejected',
  'Not Suitable Site',
  'Snoozed',
  'Inactive',
]);

export const PLACEMENT_STATUS_CONFIG = Object.freeze({
  'Awaiting': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: 'Awaiting',
  },
  'In Progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'In Progress',
  },
  'Industry Contacted': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
    label: 'Industry Contacted',
  },
  'Appointment Scheduled': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    label: 'Appointment Scheduled',
  },
  'Appointment Successful': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    label: 'Appointment Successful',
  },
  'Placement Started': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
    label: 'Placement Started',
  },
  'Placement Completed': {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-300',
    dot: 'bg-green-600',
    label: 'Placement Completed',
  },
  'Student Withdraw': {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Student Withdraw',
  },
  'Student Missed Appointment': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    label: 'Student Missed Appointment',
  },
  'Industry Rejected': {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    label: 'Industry Rejected',
  },
  'Not Suitable Site': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    label: 'Not Suitable Site',
  },
  'Snoozed': {
    bg: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    dot: 'bg-amber-600',
    label: 'Snoozed',
  },
  'Inactive': {
    bg: 'bg-slate-200',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    label: 'Inactive',
  },
});

export const getPlacementStatusConfig = (status) => {
  const normalized = String(status || '').trim();
  // Safe fallback for legacy variants
  if (normalized === 'Snooze') return PLACEMENT_STATUS_CONFIG['Snoozed'];
  if (normalized === 'Waiting to Join') return PLACEMENT_STATUS_CONFIG['In Progress'];
  return PLACEMENT_STATUS_CONFIG[normalized] || {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    label: normalized || 'Awaiting',
  };
};
