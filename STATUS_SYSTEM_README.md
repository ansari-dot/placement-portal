# Centralized Student Status Management System

## Overview

The Centralized Student Status Management System provides a single source of truth for student lifecycle status across the entire Mantis Placements Portal. This system ensures that every student has one authoritative status that remains consistent across all workflow steps, dashboard views, and reports.

## Key Features

### 1. Authoritative Status
- **Single source of truth** - One lifecycle status per student
- **Consistent display** - Same status everywhere in the portal
- **Backend authoritative** - Status calculated and stored in database

### 2. Lifecycle Statuses

| Status | Description |
|--------|-------------|
| Registered | Student has been registered in the system |
| Under Review | Student information is being reviewed |
| Request Pending | Placement request has been submitted |
| Request Approved | Placement request has been approved |
| Request Rejected | Placement request has been rejected |
| Appointment Scheduled | Interview/appointment has been scheduled |
| Appointment Successful | Interview/appointment completed successfully |
| Appointment Missed | Student missed the scheduled appointment |
| Appointment Cancelled | Appointment was cancelled |
| Placement In Progress | Student is currently on placement |
| Placement Completed | Placement has been successfully completed |
| Placement Unsuccessful | Placement did not complete successfully |
| Student Withdrawn | Student withdrew from the placement |
| Student On Hold | Student placement is on hold |
| Student Rejected | Student was rejected by the industry |
| Student Inactive | Student is no longer active in the program |

### 3. Status Transitions

The system implements a state machine that defines valid status transitions:

```
Registered → Under Review → Request Pending → Request Approved → Appointment Scheduled → Appointment Successful → Placement In Progress → Placement Completed
                                                                                          ↓
                                                                     Student Withdrawn / Student Rejected / Student On Hold
```

### 4. Audit Trail

Every status change is recorded in the `statusHistory` array with:
- Previous status
- New status
- Reason for change
- User who triggered the change
- Timestamp

### 5. Validation

- **Transition validation** - Prevents invalid status transitions
- **Admin override** - Allows bypassing validation when needed
- **Error handling** - Graceful handling of validation failures

## Architecture

### Components

1. **StudentStatusService** (`backend/src/modules/student/studentStatus.service.js`)
   - Centralized status management logic
   - Status calculation from workflow data
   - Status update with validation
   - Reconciliation of existing statuses

2. **Student Model** (`backend/src/modules/student/student.model.js`)
   - `lifecycleStatus` field - Authoritative status
   - `statusHistory` array - Audit trail
   - Index on `lifecycleStatus` for performance

3. **Workflow Service** (`backend/src/modules/workflow/workflow.service.js`)
   - Updates lifecycle status on workflow events
   - Calculates correct status from workflow data

4. **Student Service** (`backend/src/modules/student/student.service.js`)
   - Sets initial lifecycle status on creation
   - Updates lifecycle status on student updates
   - Includes lifecycle status in API responses

### Status Calculation Logic

The `calculateLifecycleStatus()` function determines the correct lifecycle status by analyzing:

1. **Placement Completed** - When internship or appointment is explicitly Completed
2. **Placement Unsuccessful** - When appointment outcome is rejected/withdrawn/missed
3. **Placement In Progress** - When internship is Active or appointment is Confirmed with commencement date
4. **Appointment Successful** - When appointment outcome is successful but no commencement date
5. **Appointment Scheduled** - When appointment is Scheduled or Rescheduled
6. **Request Pending** - When placement request exists
7. **Under Review** - When student has complete profile
8. **Registered** - Default status

## Usage

### Creating a Student

```javascript
import { StudentService } from './student.service.js';

const student = await StudentService.createStudent({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: 'john.doe@example.com',
  courseQualification: 'Diploma of Nursing',
  // ... other fields
}, { actingUser: adminUser });

// lifecycleStatus is automatically set to "Registered"
```

### Updating Student Status

```javascript
import { updateStudentLifecycleStatus } from './studentStatus.service.js';

const result = await updateStudentLifecycleStatus(
  studentId,
  'Placement In Progress',
  {
    reason: 'Placement started - confirmed successful appointment',
    triggeredBy: 'system',
    triggeringEvent: 'appointment_confirmed',
  }
);

console.log(result.statusChange);
// {
//   fromStatus: 'Appointment Successful',
//   toStatus: 'Placement In Progress',
//   reason: 'Placement started - confirmed successful appointment',
//   triggeredBy: 'system',
//   triggeringEvent: 'appointment_confirmed',
//   changedAt: 2024-01-15T10:30:00.000Z
// }
```

### Reconciling Student Statuses

```bash
cd backend
node src/scripts/reconcileStudentStatuses.js
```

This will:
- Calculate correct lifecycle status for each student
- Update any inconsistent statuses
- Generate a detailed reconciliation report

### API Endpoint

```bash
POST /api/students/reconcile-statuses
Authorization: Bearer <admin-token>
```

Response:
```json
{
  "success": true,
  "message": "Student status reconciliation completed",
  "data": {
    "total": 100,
    "updated": 25,
    "unchanged": 75,
    "issues": []
  }
}
```

## Frontend Integration

### Displaying Status

```jsx
import { getStatusConfig } from '../api/studentStatus.js';

const statusConfig = getStatusConfig(student.lifecycleStatus);

return (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusConfig.color}`}>
    {statusConfig.label}
  </span>
);
```

### Status Configuration

```javascript
{
  label: 'Placement In Progress',
  color: 'bg-blue-50 text-blue-700 border-blue-200',
  icon: 'Briefcase',
  description: 'Student is currently on placement',
}
```

## Migration Guide

### For Existing Students

1. **Run reconciliation script** to fix existing inconsistencies
2. **Review reconciliation report** for any issues
3. **Manually review flagged students** if needed

### For Custom Status Logic

If you have custom status calculation logic:

1. **Move logic to `calculateLifecycleStatus()`** in `studentStatus.service.js`
2. **Update transition rules** if needed
3. **Test thoroughly** before deploying

## Best Practices

### 1. Always Use Centralized Service

```javascript
// ✅ Good - Uses centralized service
await updateStudentLifecycleStatus(studentId, 'Placement In Progress', {
  reason: 'Placement started',
  triggeredBy: 'system',
});

// ❌ Bad - Direct database update bypasses validation
await StudentModel.findByIdAndUpdate(studentId, { lifecycleStatus: 'Placement In Progress' });
```

### 2. Provide Context

```javascript
// ✅ Good - Provides context
await updateStudentLifecycleStatus(studentId, 'Placement In Progress', {
  reason: 'Placement started - confirmed successful appointment',
  triggeredBy: 'system',
  triggeringEvent: 'appointment_confirmed',
});

// ❌ Bad - No context
await updateStudentLifecycleStatus(studentId, 'Placement In Progress');
```

### 3. Handle Validation Errors

```javascript
try {
  await updateStudentLifecycleStatus(studentId, 'Placement In Progress');
} catch (error) {
  if (error.message.includes('Invalid status transition')) {
    // Handle invalid transition
    console.log('Cannot transition from', student.lifecycleStatus, 'to Placement In Progress');
  } else {
    throw error;
  }
}
```

## Troubleshooting

### Status Not Updating

**Problem**: Status doesn't change when expected

**Solutions**:
1. Check workflow service logs for errors
2. Verify student exists in workflow data
3. Check for validation errors
4. Ensure workflow data is up to date

### Inconsistent Status Display

**Problem**: Status shows differently on different pages

**Solutions**:
1. Run reconciliation script
2. Verify frontend is using backend status
3. Clear any caches
4. Check for stale workflow data

### Invalid Transition Error

**Problem**: Error when trying to change status

**Solutions**:
1. Check current status and target status
2. Verify transition is valid in `STATUS_TRANSITIONS`
3. Use `force: true` option for admin override
4. Review status history for context

## Performance Considerations

### Indexing

The `lifecycleStatus` field is indexed for fast queries:

```javascript
studentSchema.index({ lifecycleStatus: 1 });
```

### Status Calculation

Status calculation is optimized by:
- Fetching workflow data once for all students
- Using efficient Map lookups
- Avoiding N+1 queries

### Reconciliation

Reconciliation is designed to be run:
- **After deployment** - Fix existing inconsistencies
- **Periodically** - Monthly or quarterly
- **On-demand** - When issues are reported

## Support

For questions or issues:
1. Check this documentation
2. Review status transition rules
3. Check reconciliation report
4. Contact development team

## Changelog

### v1.0.0 (Initial Release)
- Implemented centralized status service
- Added 16 lifecycle statuses
- Implemented status transition rules
- Added audit trail
- Created reconciliation script
- Updated student and workflow services
- Added API endpoint
- Updated frontend components
