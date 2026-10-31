import mongoose from 'mongoose';
import StudentModel from './student.model.js';
import NotificationModel from '../notification/notification.model.js';

// ===== Student Lifecycle Status Constants =====
export const STUDENT_LIFECYCLE_STATUSES = {
  // Initial states
  REGISTERED: 'Registered',
  UNDER_REVIEW: 'Under Review',
  
  // Request states
  REQUEST_PENDING: 'Request Pending',
  REQUEST_APPROVED: 'Request Approved',
  REQUEST_REJECTED: 'Request Rejected',
  
  // Appointment states
  APPOINTMENT_SCHEDULED: 'Appointment Scheduled',
  APPOINTMENT_SUCCESSFUL: 'Appointment Successful',
  APPOINTMENT_MISSED: 'Appointment Missed',
  APPOINTMENT_CANCELLED: 'Appointment Cancelled',
  
  // Placement states
  PLACEMENT_IN_PROGRESS: 'Placement In Progress',
  PLACEMENT_COMPLETED: 'Placement Completed',
  PLACEMENT_UNSUCCESSFUL: 'Placement Unsuccessful',
  
  // Terminal states
  STUDENT_WITHDRAWN: 'Student Withdrawn',
  STUDENT_ON_HOLD: 'Student On Hold',
  STUDENT_REJECTED: 'Student Rejected',
  STUDENT_INACTIVE: 'Student Inactive',
};

// ===== Status Transition Rules (State Machine) =====
// Defines valid transitions and their conditions
export const STATUS_TRANSITIONS = {
  [STUDENT_LIFECYCLE_STATUSES.REGISTERED]: [
    STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW]: [
    STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING,
    STUDENT_LIFECYCLE_STATUSES.REQUEST_REJECTED,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING]: [
    STUDENT_LIFECYCLE_STATUSES.REQUEST_APPROVED,
    STUDENT_LIFECYCLE_STATUSES.REQUEST_REJECTED,
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
  ],
  [STUDENT_LIFECYCLE_STATUSES.REQUEST_APPROVED]: [
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED,
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
  ],
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED]: [
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL,
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED,
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_CANCELLED,
    STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
  ],
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL]: [
    STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS,
    STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
  ],
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS]: [
    STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED,
    STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
  ],
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED]: [
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL]: [
    STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING, // Reopen workflow
    STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN]: [
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD]: [
    STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW,
    STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING,
    STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS,
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_REJECTED]: [
    STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE,
  ],
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE]: [], // Terminal state
};

// ===== Status Display Configuration =====
export const STATUS_CONFIG = {
  [STUDENT_LIFECYCLE_STATUSES.REGISTERED]: {
    label: 'Registered',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: 'UserPlus',
    description: 'Student has been registered in the system',
  },
  [STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'FileText',
    description: 'Student information is being reviewed',
  },
  [STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING]: {
    label: 'Request Pending',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'Clock',
    description: 'Placement request has been submitted',
  },
  [STUDENT_LIFECYCLE_STATUSES.REQUEST_APPROVED]: {
    label: 'Request Approved',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: 'CheckCircle',
    description: 'Placement request has been approved',
  },
  [STUDENT_LIFECYCLE_STATUSES.REQUEST_REJECTED]: {
    label: 'Request Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'XCircle',
    description: 'Placement request has been rejected',
  },
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED]: {
    label: 'Appointment Scheduled',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'Calendar',
    description: 'Interview/appointment has been scheduled',
  },
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL]: {
    label: 'Appointment Successful',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'Smile',
    description: 'Interview/appointment completed successfully',
  },
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED]: {
    label: 'Appointment Missed',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: 'AlertTriangle',
    description: 'Student missed the scheduled appointment',
  },
  [STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_CANCELLED]: {
    label: 'Appointment Cancelled',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'X',
    description: 'Appointment was cancelled',
  },
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS]: {
    label: 'Placement In Progress',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'Briefcase',
    description: 'Student is currently on placement',
  },
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED]: {
    label: 'Placement Completed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: 'Award',
    description: 'Placement has been successfully completed',
  },
  [STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL]: {
    label: 'Placement Unsuccessful',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'AlertCircle',
    description: 'Placement did not complete successfully',
  },
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN]: {
    label: 'Student Withdrawn',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: 'LogOut',
    description: 'Student withdrew from the placement',
  },
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD]: {
    label: 'Student On Hold',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'Pause',
    description: 'Student placement is on hold',
  },
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_REJECTED]: {
    label: 'Student Rejected',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'XCircle',
    description: 'Student was rejected by the industry',
  },
  [STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE]: {
    label: 'Student Inactive',
    color: 'bg-slate-100 text-slate-500 border-slate-300',
    icon: 'UserX',
    description: 'Student is no longer active in the program',
  },
};

// ===== Helper Functions =====

/**
 * Check if a status transition is valid
 * @param {string} fromStatus - Current status
 * @param {string} toStatus - Target status
 * @returns {boolean} - True if transition is valid
 */
export const isValidTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  if (fromStatus === toStatus) return true; // Same status is always valid
  
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
  if (!allowedTransitions) return false;
  
  return allowedTransitions.includes(toStatus);
};

/**
 * Get the correct lifecycle status based on workflow data
 * This is the authoritative status calculation logic
 * @param {Object} student - Student document
 * @param {Object} workflowData - Optional workflow data (requests, appointments, internships)
 * @returns {string} - The correct lifecycle status
 */
export const calculateLifecycleStatus = (student, workflowData = null) => {
  // If workflow data is provided, use it; otherwise fetch from student
  const requests = workflowData?.requests || [];
  const appointments = workflowData?.appointments || [];
  const internships = workflowData?.internships || [];
  
  // Helper to find workflow items for this student
  const findStudentWorkflowItems = (items) => {
    const studentId = student.studentId || String(student._id || '');
    const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
    
    return items.filter(item => {
      const itemStudentId = String(item.studentId || '').trim();
      const itemStudentName = String(item.student || '').trim().toLowerCase();
      const studentNameLower = studentName.toLowerCase();
      
      return (
        itemStudentId === studentId ||
        itemStudentName === studentNameLower ||
        itemStudentName === studentNameLower.split(' ').join('')
      );
    });
  };
  
  const studentRequests = findStudentWorkflowItems(requests);
  const studentAppointments = findStudentWorkflowItems(appointments);
  const studentInternships = findStudentWorkflowItems(internships);
  
  // Sort appointments by date (newest first) for outcome determination
  const sortedAppointments = [...studentAppointments].sort((a, b) => {
    const dateA = new Date(a.updatedAt || a.createdAt || a.date || 0);
    const dateB = new Date(b.updatedAt || b.createdAt || b.date || 0);
    return dateB - dateA;
  });
  
  // 1. Check for Placement Completed (highest priority)
  if (
    student.placementStatus === 'Placement Completed' ||
    studentInternships.some(i => ['Completed', 'Placement Completed'].includes(i.status)) ||
    sortedAppointments.some(a => ['Completed', 'Placement Completed'].includes(a.status))
  ) {
    return STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED;
  }
  
  // 2. Check for Placement Unsuccessful (terminal outcomes)
  const terminalAppointment = sortedAppointments.find(a => {
    const status = a.status || '';
    const outcome = a.appointmentOutcome || '';
    return (
      status === 'Industry Rejected' ||
      status === 'Declined' ||
      status === 'Not Suitable Site' ||
      status === 'Withdrawn' ||
      status === 'Student Missed Appointment' ||
      status === 'No Show' ||
      outcome === 'industry_rejected' ||
      outcome === 'student_withdrawal' ||
      outcome === 'not_suitable_site' ||
      outcome === 'student_missed'
    );
  });
  
  if (terminalAppointment) {
    const status = terminalAppointment.status || '';
    const outcome = terminalAppointment.appointmentOutcome || '';
    
    if (status === 'Industry Rejected' || outcome === 'industry_rejected') {
      return STUDENT_LIFECYCLE_STATUSES.STUDENT_REJECTED;
    }
    if (status === 'Not Suitable Site' || outcome === 'not_suitable_site') {
      return STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL;
    }
    if (status === 'Withdrawn' || status === 'Student Withdraw' || outcome === 'student_withdrawal') {
      return STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN;
    }
    if (status === 'Student Missed Appointment' || status === 'No Show' || outcome === 'student_missed') {
      return STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED;
    }
  }
  
  // 3. Check for Placement In Progress
  const now = new Date();
  if (
    studentInternships.some(i => ['Active', 'Placement Started', 'Joined', 'Waiting to Join'].includes(i.status)) ||
    sortedAppointments.some(a => {
      if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Declined', 'Industry Rejected'].includes(a.status)) return false;
      if (a.status === 'Confirmed' || a.appointmentOutcome === 'successful') {
        return a.commencementDate && new Date(a.commencementDate) <= now;
      }
      return false;
    })
  ) {
    return STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS;
  }
  
  // 4. Check for Appointment Successful (no commencement date yet)
  if (
    sortedAppointments.some(a => {
      if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Declined', 'Industry Rejected'].includes(a.status)) return false;
      return a.appointmentOutcome === 'successful' && !a.commencementDate;
    })
  ) {
    return STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL;
  }
  
  // 5. Check for Appointment Scheduled
  if (sortedAppointments.some(a => ['Scheduled', 'Rescheduled'].includes(a.status))) {
    return STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED;
  }
  
  // 6. Check for Request Approved/Active
  if (studentInternships.length > 0 || studentAppointments.length > 0) {
    return STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS;
  }
  
  // 7. Check for Request Pending
  if (studentRequests.length > 0) {
    return STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING;
  }
  
  // 8. Check for Under Review (student has complete profile)
  if (student.emailAddress && student.courseQualification) {
    return STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW;
  }
  
  // 9. Default to Registered
  return STUDENT_LIFECYCLE_STATUSES.REGISTERED;
};

/**
 * Update student lifecycle status with validation and audit trail
 * @param {string} studentId - Student ID (MongoDB _id or studentId)
 * @param {string} newStatus - New lifecycle status
 * @param {Object} options - Additional options
 * @returns {Object} - Updated student and status change record
 */
export const updateStudentLifecycleStatus = async (studentId, newStatus, options = {}) => {
  const {
    reason = '',
    triggeredBy = 'system',
    triggeringEvent = '',
    session = null,
    force = false,
  } = options;
  
  // Find student
  let student = null;
  if (mongoose.Types.ObjectId.isValid(studentId)) {
    student = await StudentModel.findById(studentId);
  }
  if (!student) {
    student = await StudentModel.findOne({ studentId });
  }
  
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }
  
  const oldStatus = student.lifecycleStatus || student.placementStatus || STUDENT_LIFECYCLE_STATUSES.REGISTERED;
  
  // Validate transition
  if (!isValidTransition(oldStatus, newStatus) && !force) {
    throw new Error(`Invalid status transition: ${oldStatus} → ${newStatus}`);
  }
  
  // Update lifecycle status
  student.lifecycleStatus = newStatus;
  
  // Add to status history
  const statusHistoryEntry = {
    fromStatus: oldStatus,
    toStatus: newStatus,
    reason: reason || undefined,
    triggeredBy: triggeredBy || 'system',
    triggeringEvent: triggeringEvent || undefined,
    changedAt: new Date(),
  };
  
  student.statusHistory.push(statusHistoryEntry);
  
  // Save with session if provided
  if (session) {
    await student.save({ session });
  } else {
    await student.save();
  }
  
  // Create notification for significant status changes
  if (triggeringEvent && triggeredBy !== 'system') {
    try {
      await NotificationModel.create({
        title: `Status Update: ${newStatus}`,
        desc: `${student.name} status changed from ${oldStatus} to ${newStatus}`,
        type: 'student',
        link: `/students/${student.studentId}`,
        targetRoles: ['Administrator', 'Admin', 'Coordinator', 'Placement Coordinator'],
        studentName: student.name,
        studentId: student.studentId,
      });
    } catch (nErr) {
      console.error('[StatusHistory] Failed to create notification:', nErr);
    }
  }
  
  return {
    student,
    statusChange: statusHistoryEntry,
    wasValidTransition: isValidTransition(oldStatus, newStatus),
  };
};

/**
 * Reconcile all students' lifecycle statuses
 * Should be run after deployment to fix existing inconsistencies
 * @returns {Object} - Summary of reconciliation
 */
export const reconcileAllStudentStatuses = async () => {
  const students = await StudentModel.find({});
  const reconciliationResults = {
    total: students.length,
    updated: 0,
    unchanged: 0,
    issues: [],
  };
  
  // Fetch all workflow data once
  const WorkflowModel = (await import('./workflow.model.js')).default;
  const workflows = await WorkflowModel.find({}, { requests: 1, appointments: 1, internships: 1 }).lean();
  const allRequests = workflows.flatMap(wf => wf.requests || []);
  const allAppointments = workflows.flatMap(wf => wf.appointments || []);
  const allInternships = workflows.flatMap(wf => wf.internships || []);
  
  for (const student of students) {
    const currentStatus = student.placementStatus;
    const correctStatus = calculateLifecycleStatus(student, {
      requests: allRequests,
      appointments: allAppointments,
      internships: allInternships,
    });
    
    if (currentStatus !== correctStatus) {
      try {
        await updateStudentLifecycleStatus(
          student._id,
          correctStatus,
          {
            reason: 'Automated reconciliation - status was inconsistent with workflow data',
            triggeredBy: 'system',
            triggeringEvent: 'lifecycle_status_reconciliation',
          }
        );
        reconciliationResults.updated++;
      } catch (err) {
        reconciliationResults.issues.push({
          studentId: student.studentId,
          studentName: student.name,
          currentStatus,
          correctStatus,
          error: err.message,
        });
      }
    } else {
      reconciliationResults.unchanged++;
    }
  }
  
  return reconciliationResults;
};

/**
 * Get status configuration for display
 * @param {string} status - Status value
 * @returns {Object} - Status configuration
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[STUDENT_LIFECYCLE_STATUSES.REGISTERED];
};

/**
 * Get all valid next statuses for a given status
 * @param {string} status - Current status
 * @returns {string[]} - Array of valid next statuses
 */
export const getNextPossibleStatuses = (status) => {
  return STATUS_TRANSITIONS[status] || [];
};

export default {
  STUDENT_LIFECYCLE_STATUSES,
  STATUS_TRANSITIONS,
  STATUS_CONFIG,
  isValidTransition,
  calculateLifecycleStatus,
  updateStudentLifecycleStatus,
  reconcileAllStudentStatuses,
  getStatusConfig,
  getNextPossibleStatuses,
};
