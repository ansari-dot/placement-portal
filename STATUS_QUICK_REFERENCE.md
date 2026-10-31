# Centralized Student Status - Quick Reference

## Status Constants

```javascript
import { STUDENT_LIFECYCLE_STATUSES } from './studentStatus.service.js';

// Available statuses
STUDENT_LIFECYCLE_STATUSES.REGISTERED           // 'Registered'
STUDENT_LIFECYCLE_STATUSES.UNDER_REVIEW         // 'Under Review'
STUDENT_LIFECYCLE_STATUSES.REQUEST_PENDING      // 'Request Pending'
STUDENT_LIFECYCLE_STATUSES.REQUEST_APPROVED     // 'Request Approved'
STUDENT_LIFECYCLE_STATUSES.REQUEST_REJECTED     // 'Request Rejected'
STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SCHEDULED // 'Appointment Scheduled'
STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_SUCCESSFUL // 'Appointment Successful'
STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_MISSED   // 'Appointment Missed'
STUDENT_LIFECYCLE_STATUSES.APPOINTMENT_CANCELLED // 'Appointment Cancelled'
STUDENT_LIFECYCLE_STATUSES.PLACEMENT_IN_PROGRESS // 'Placement In Progress'
STUDENT_LIFECYCLE_STATUSES.PLACEMENT_COMPLETED  // 'Placement Completed'
STUDENT_LIFECYCLE_STATUSES.PLACEMENT_UNSUCCESSFUL // 'Placement Unsuccessful'
STUDENT_LIFECYCLE_STATUSES.STUDENT_WITHDRAWN    // 'Student Withdrawn'
STUDENT_LIFECYCLE_STATUSES.STUDENT_ON_HOLD      // 'Student On Hold'
STUDENT_LIFECYCLE_STATUSES.STUDENT_REJECTED     // 'Student Rejected'
STUDENT_LIFECYCLE_STATUSES.STUDENT_INACTIVE     // 'Student Inactive'
```

## Common Operations

### 1. Update Student Lifecycle Status

```javascript
import { updateStudentLifecycleStatus } from './studentStatus.service.js';

await updateStudentLifecycleStatus(
  studentId,
  'Placement In Progress',
  {
    reason: 'Placement started',
    triggeredBy: 'system',
    triggeringEvent: 'appointment_confirmed',
  }
);
```

### 2. Calculate Lifecycle Status from Workflow Data

```javascript
import { calculateLifecycleStatus } from './studentStatus.service.js';

const correctStatus = calculateLifecycleStatus(student, {
  requests: allRequests,
  appointments: allAppointments,
  internships: allInternships,
});
```

### 3. Check Valid Transition

```javascript
import { isValidTransition } from './studentStatus.service.js';

if (isValidTransition('Request Pending', 'Request Approved')) {
  // Valid transition
}
```

### 4. Get Status Configuration

```javascript
import { getStatusConfig } from './studentStatus.service.js';

const config = getStatusConfig('Placement In Progress');
// {
//   label: 'Placement In Progress',
//   color: 'bg-blue-50 text-blue-700 border-blue-200',
//   icon: 'Briefcase',
//   description: 'Student is currently on placement',
// }
```

### 5. Reconcile All Students

```bash
cd backend
node src/scripts/reconcileStudentStatuses.js
```

## Status Transition Rules

### Valid Transitions

| From | To |
|------|-----|
| Registered | Under Review, Student On Hold, Student Inactive |
| Under Review | Request Pending, Request Rejected, Student On Hold, Student Inactive |
| Request Pending | Request Approved, Request Rejected, Appointment Scheduled, Student Withdrawn, Student On Hold |
| Request Approved | Appointment Scheduled, Appointment Missed, Student Withdrawn, Student On Hold |
| Appointment Scheduled | Appointment Successful, Appointment Missed, Appointment Cancelled, Placement In Progress, Student Withdrawn, Student On Hold |
| Appointment Successful | Placement In Progress, Appointment Missed, Student Withdrawn, Student On Hold |
| Placement In Progress | Placement Completed, Placement Unsuccessful, Student Withdrawn, Student On Hold |
| Placement Completed | Student Inactive |
| Placement Unsuccessful | Request Pending, Student On Hold, Student Inactive |
| Student Withdrawn | Student Inactive |
| Student On Hold | Under Review, Request Pending, Placement In Progress, Student Inactive |
| Student Rejected | Student Inactive |
| Student Inactive | (terminal - no transitions) |

## API Endpoints

### Reconcile Statuses
```
POST /api/students/reconcile-statuses
Authorization: Bearer <admin-token>
```

## Frontend Usage

### Display Status Badge

```jsx
import { getStatusConfig } from '../api/studentStatus.js';

const statusConfig = getStatusConfig(student.lifecycleStatus);

return (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
    {statusConfig.label}
  </span>
);
```

### Status Colors

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| Registered | bg-slate-100 | text-slate-700 | border-slate-300 |
| Under Review | bg-blue-50 | text-blue-700 | border-blue-200 |
| Request Pending | bg-amber-50 | text-amber-700 | border-amber-200 |
| Request Approved | bg-teal-50 | text-teal-700 | border-teal-200 |
| Request Rejected | bg-rose-50 | text-rose-700 | border-rose-200 |
| Appointment Scheduled | bg-purple-50 | text-purple-700 | border-purple-200 |
| Appointment Successful | bg-emerald-50 | text-emerald-700 | border-emerald-200 |
| Appointment Missed | bg-orange-50 | text-orange-700 | border-orange-200 |
| Appointment Cancelled | bg-slate-50 | text-slate-700 | border-slate-200 |
| Placement In Progress | bg-blue-50 | text-blue-700 | border-blue-200 |
| Placement Completed | bg-emerald-100 | text-emerald-800 | border-emerald-300 |
| Placement Unsuccessful | bg-rose-50 | text-rose-700 | border-rose-200 |
| Student Withdrawn | bg-slate-50 | text-slate-700 | border-slate-200 |
| Student On Hold | bg-amber-50 | text-amber-700 | border-amber-200 |
| Student Rejected | bg-rose-50 | text-rose-700 | border-rose-200 |
| Student Inactive | bg-slate-100 | text-slate-500 | border-slate-300 |

## Migration Commands

### Run Reconciliation
```bash
cd backend
node src/scripts/reconcileStudentStatuses.js
```

### Check Student Status
```bash
# In MongoDB shell
db.students.find({ studentId: "STU123" }, { lifecycleStatus: 1, placementStatus: 1 })
```

## Troubleshooting

### Status Not Updating
1. Check workflow service logs
2. Verify student exists in workflow data
3. Check for validation errors

### Inconsistent Status
1. Run reconciliation script
2. Verify frontend uses backend status
3. Clear caches

### Invalid Transition
1. Check current and target status
2. Verify transition is valid
3. Use `force: true` for admin override

## Files

- **Service**: `backend/src/modules/student/studentStatus.service.js`
- **Model**: `backend/src/modules/student/student.model.js`
- **Controller**: `backend/src/modules/student/student.controller.js`
- **Routes**: `backend/src/modules/student/student.routes.js`
- **Migration**: `backend/src/scripts/reconcileStudentStatuses.js`
- **Documentation**: `STATUS_SYSTEM_README.md`, `IMPLEMENTATION_SUMMARY.md`, `IMPLEMENTATION_PLAN.md`

## Support

For questions or issues, contact the development team.
