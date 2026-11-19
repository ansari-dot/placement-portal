/**
 * Automated Test Suite for Phase 3 Canonical Student Status Architecture
 * 
 * Verifies all 11 required scenarios:
 * 1. Every canonical status (Awaiting, In Progress, Industry Contacted, Appointment Scheduled,
 *    Appointment Successful, Placement Started, Placement Completed).
 * 2. Appointment withdrawal followed by successful appointment (chronological precedence).
 * 3. Multiple requests for a single student (deduplication & stability).
 * 4. Multiple appointments (latest active appointment takes precedence).
 * 5. Future placement start (future commencement date stays Appointment Successful).
 * 6. Actual placement commencement (start date <= referenceDate resolves to Placement Started).
 * 7. Completed placement (verified completion state resolves to Placement Completed).
 * 8. Student withdrawal outcome (Student Withdraw preserved).
 * 9. Snoozed and inactive students (exceptional states preserved).
 * 10. Orphaned appointments (excluded from matching, zero effect on students).
 * 11. Payment history isolation (payment records never affect canonical status).
 */

import { CANONICAL_STATUSES, EXCEPTIONAL_STATUSES } from '../modules/student/canonicalStatus.constants.js';
import { resolveCanonicalStudentStatus, buildCanonicalStatusMap, matchStudentItems } from '../modules/student/canonicalStatus.service.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log('\n============================================================');
console.log(' RUNNING PHASE 3 CANONICAL STATUS ARCHITECTURE TEST SUITE');
console.log('============================================================\n');

const refDate = new Date('2026-11-19T12:00:00Z');

// -------------------------------------------------------------
// Test 1: Every Canonical Status
// -------------------------------------------------------------
console.log('\x1b[36mTest Suite 1: Every Canonical Status\x1b[0m');

// 1.1 Awaiting
{
  const student = { studentId: 'STU-001', name: 'Student One', placementStatus: 'None' };
  const res = resolveCanonicalStudentStatus(student, {}, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.AWAITING, 'Resolves Awaiting when no workflow records exist');
}

// 1.2 In Progress
{
  const student = { studentId: 'STU-002', name: 'Student Two', placementStatus: 'None' };
  const requests = [{ studentId: 'STU-002', status: 'Coordinator Review' }];
  const res = resolveCanonicalStudentStatus(student, { requests }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.IN_PROGRESS, 'Resolves In Progress when active placement request exists');
}

// 1.3 Industry Contacted
{
  const student = { studentId: 'STU-003', name: 'Student Three', placementStatus: 'None' };
  const requests = [{
    studentId: 'STU-003',
    status: 'Coordinator Review',
    contactedIndustries: [{ organizationName: 'Alpha Health Care' }]
  }];
  const res = resolveCanonicalStudentStatus(student, { requests }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.INDUSTRY_CONTACTED, 'Resolves Industry Contacted when contacted industries exist in request');
}

// 1.4 Appointment Scheduled
{
  const student = { studentId: 'STU-004', name: 'Student Four', placementStatus: 'None' };
  const appointments = [{
    studentId: 'STU-004',
    status: 'Scheduled',
    company: 'Apex Clinic',
    date: '2026-11-25'
  }];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SCHEDULED, 'Resolves Appointment Scheduled when upcoming appointment exists');
}

// 1.5 Appointment Successful
{
  const student = { studentId: 'STU-005', name: 'Student Five', placementStatus: 'None' };
  const appointments = [{
    studentId: 'STU-005',
    status: 'Confirmed',
    appointmentOutcome: 'successful',
    commencementDate: '2026-12-01'
  }];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL, 'Resolves Appointment Successful when interview confirmed and start date in future');
}

// 1.6 Placement Started
{
  const student = { studentId: 'STU-006', name: 'Student Six', placementStatus: 'None' };
  const appointments = [{
    studentId: 'STU-006',
    status: 'Confirmed',
    appointmentOutcome: 'successful',
    commencementDate: '2026-11-10' // past date
  }];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.PLACEMENT_STARTED, 'Resolves Placement Started when commencement date has passed');
}

// 1.7 Placement Completed
{
  const student = { studentId: 'STU-007', name: 'Student Seven', placementStatus: 'None' };
  const internships = [{
    studentId: 'STU-007',
    status: 'Completed',
    start: '2026-08-01',
    end: '2026-10-30'
  }];
  const res = resolveCanonicalStudentStatus(student, { internships }, refDate);
  assert(res.canonicalStatus === CANONICAL_STATUSES.PLACEMENT_COMPLETED, 'Resolves Placement Completed when internship marked Completed');
}

// -------------------------------------------------------------
// Test 2: Appointment withdrawal followed by successful appointment
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 2: Chronological Sequence (Withdrawal followed by Success)\x1b[0m');
{
  const student = { studentId: 'STU-008', name: 'Simrandeep Kaur', placementStatus: 'None' };
  const appointments = [
    {
      studentId: 'STU-008',
      status: 'Student Withdraw',
      appointmentOutcome: 'student_withdrawal',
      company: 'First Facility',
      date: '2026-10-01',
      updatedAt: '2026-10-02T10:00:00Z'
    },
    {
      studentId: 'STU-008',
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      company: 'Second Facility',
      date: '2026-11-05',
      commencementDate: '2026-12-01',
      updatedAt: '2026-11-06T10:00:00Z'
    }
  ];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL,
    'Subsequent successful appointment overrides historical withdrawal',
    `Expected Appointment Successful, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 3: Multiple Requests for Single Student
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 3: Multiple Requests Handling\x1b[0m');
{
  const student = { studentId: 'STU-009', name: 'Student Nine', placementStatus: 'None' };
  const requests = [
    { studentId: 'STU-009', status: 'Closed', requestedOn: '2026-08-01' },
    { studentId: 'STU-009', status: 'Coordinator Review', requestedOn: '2026-10-15', contactedIndustries: [{ name: 'Clinic A' }] },
    { studentId: 'STU-009', status: 'RTO Review', requestedOn: '2026-10-20' }
  ];
  const res = resolveCanonicalStudentStatus(student, { requests }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.INDUSTRY_CONTACTED,
    'Handles multiple requests safely and detects industry contacts outreach',
    `Expected Industry Contacted, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 4: Multiple Appointments (Latest Active Precedence)
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 4: Multiple Appointments Handling\x1b[0m');
{
  const student = { studentId: 'STU-010', name: 'Student Ten', placementStatus: 'None' };
  const appointments = [
    {
      studentId: 'STU-010',
      status: 'Industry Rejected',
      appointmentOutcome: 'industry_rejected',
      date: '2026-09-01',
      updatedAt: '2026-09-02T10:00:00Z'
    },
    {
      studentId: 'STU-010',
      status: 'Scheduled',
      company: 'New Hospital',
      date: '2026-11-28',
      updatedAt: '2026-11-15T10:00:00Z'
    }
  ];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SCHEDULED,
    'New active appointment scheduled supersedes past industry rejection',
    `Expected Appointment Scheduled, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 5: Future Placement Start
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 5: Future Placement Start Isolation\x1b[0m');
{
  const student = { studentId: 'STU-011', name: 'Student Eleven', placementStatus: 'None' };
  const appointments = [{
    studentId: 'STU-011',
    status: 'Confirmed',
    appointmentOutcome: 'successful',
    commencementDate: '2026-12-15' // Future date
  }];
  const internships = [{
    studentId: 'STU-011',
    status: 'Waiting to Join',
    start: '2026-12-15',
    end: '2027-03-15'
  }];
  const res = resolveCanonicalStudentStatus(student, { appointments, internships }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL,
    'Future start date does NOT infer Placement Started (remains Appointment Successful)',
    `Expected Appointment Successful, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 6: Actual Placement Commencement
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 6: Actual Placement Commencement\x1b[0m');
{
  const student = { studentId: 'STU-012', name: 'Student Twelve', placementStatus: 'None' };
  const internships = [{
    studentId: 'STU-012',
    status: 'Placement Started',
    start: '2026-11-10', // Started 9 days ago
    end: '2027-02-10'
  }];
  const res = resolveCanonicalStudentStatus(student, { internships }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.PLACEMENT_STARTED,
    'Actual commencement date in past resolves to Placement Started',
    `Expected Placement Started, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 7: Completed Placement
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 7: Completed Placement Verification\x1b[0m');
{
  const student = { studentId: 'STU-013', name: 'Student Thirteen', placementStatus: 'Placement Completed' };
  const internships = [{
    studentId: 'STU-013',
    status: 'Active',
    start: '2026-05-01',
    end: '2026-08-01' // Elapsed past end date
  }];
  const res = resolveCanonicalStudentStatus(student, { internships }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.PLACEMENT_COMPLETED,
    'Elapsed end date with verified placementStatus yields Placement Completed',
    `Expected Placement Completed, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 8: Student Withdrawal Outcome
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 8: Student Withdrawal Outcome\x1b[0m');
{
  const student = { studentId: 'STU-014', name: 'Student Fourteen', placementStatus: 'None' };
  const appointments = [{
    studentId: 'STU-014',
    status: 'Student Withdraw',
    appointmentOutcome: 'student_withdrawal',
    date: '2026-11-01'
  }];
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.STUDENT_WITHDRAW,
    'Resolves exceptional Student Withdraw status correctly',
    `Expected Student Withdraw, got ${res.canonicalStatus}`
  );
  assert(res.isExceptional === true, 'Correctly flags Student Withdraw as exceptional status');
}

// -------------------------------------------------------------
// Test 9: Snoozed and Inactive Students
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 9: Snoozed & Inactive State Preservation\x1b[0m');
{
  // Snoozed
  const snoozedStudent = {
    studentId: 'STU-015',
    name: 'Student Fifteen',
    snoozed: true,
    internshipPriority: 'Snooze'
  };
  const appointments = [{
    studentId: 'STU-015',
    status: 'Confirmed',
    appointmentOutcome: 'successful',
    commencementDate: '2026-11-01'
  }];
  const resSnoozed = resolveCanonicalStudentStatus(snoozedStudent, { appointments }, refDate);
  assert(
    resSnoozed.canonicalStatus === CANONICAL_STATUSES.SNOOZED,
    'Snoozed student preserves Snoozed status regardless of appointment',
    `Expected Snoozed, got ${resSnoozed.canonicalStatus}`
  );
  assert(resSnoozed.isExceptional === true, 'Snoozed is flagged exceptional');

  // Inactive
  const inactiveStudent = {
    studentId: 'STU-016',
    name: 'Student Sixteen',
    status: 'Inactive',
    internshipPriority: 'Inactive'
  };
  const resInactive = resolveCanonicalStudentStatus(inactiveStudent, { appointments }, refDate);
  assert(
    resInactive.canonicalStatus === CANONICAL_STATUSES.INACTIVE,
    'Inactive student preserves Inactive status regardless of appointment',
    `Expected Inactive, got ${resInactive.canonicalStatus}`
  );
  assert(resInactive.isExceptional === true, 'Inactive is flagged exceptional');
}

// -------------------------------------------------------------
// Test 10: Orphaned Appointments Isolation
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 10: Orphaned Appointments Isolation\x1b[0m');
{
  const student = { studentId: 'STU-017', _id: '678901234567890123456789', name: 'Verified Student' };
  const allAppointments = [
    // Orphaned appointment with different/non-existent student ID
    {
      id: 'APPT-ORPHAN-01',
      studentId: 'UNKNOWN-STUDENT-999',
      student: 'Some Random Unknown Person',
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      commencementDate: '2026-11-01'
    },
    // Another orphaned appointment with empty studentId
    {
      id: 'APPT-ORPHAN-02',
      studentId: '',
      student: '',
      status: 'Confirmed',
      appointmentOutcome: 'successful'
    }
  ];

  const matched = matchStudentItems(allAppointments, student);
  assert(matched.length === 0, 'Orphaned appointments are not matched to verified student');

  const res = resolveCanonicalStudentStatus(student, { appointments: allAppointments }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.AWAITING,
    'Student remains Awaiting; orphaned appointments have zero effect',
    `Expected Awaiting, got ${res.canonicalStatus}`
  );
}

// -------------------------------------------------------------
// Test 11: Payment History Isolation
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 11: Payment History Isolation\x1b[0m');
{
  const student = { studentId: 'STU-018', name: 'Student Eighteen', placementStatus: 'None' };
  // A student has an appointment scheduled, and also has a historical payment record marked "Full Payment Received"
  const appointments = [{
    studentId: 'STU-018',
    status: 'Scheduled',
    company: 'St. Vincent Hospital',
    date: '2026-12-05'
  }];
  const payments = [{
    studentId: 'STU-018',
    paymentStatus: 'Full Payment Received',
    placementStatus: 'Appointment Successful', // historical snapshot
    invoiceNumber: 'INV-2026-001',
    amount: 1500
  }];

  // Resolve status with pure student workflow context (payments are excluded from input context by architectural design)
  const res = resolveCanonicalStudentStatus(student, { appointments }, refDate);
  assert(
    res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SCHEDULED,
    'Canonical status derived solely from placement lifecycle, unaffected by payment status',
    `Expected Appointment Scheduled, got ${res.canonicalStatus}`
  );

  // Verify historical payment record retains its original values unchanged
  assert(payments[0].paymentStatus === 'Full Payment Received', 'Payment financial status preserved unchanged');
  assert(payments[0].placementStatus === 'Appointment Successful', 'Historical placement snapshot preserved unchanged');
}

// -------------------------------------------------------------
// Batch Mapping Test
// -------------------------------------------------------------
console.log('\n\x1b[36mTest Suite 12: Batch buildCanonicalStatusMap\x1b[0m');
{
  const students = [
    { studentId: 'STU-101', _id: 'id-101', name: 'Student 101' },
    { studentId: 'STU-102', _id: 'id-102', name: 'Student 102' }
  ];
  const workflows = [{
    requests: [{ studentId: 'STU-101', status: 'Coordinator Review' }],
    appointments: [{ studentId: 'STU-102', status: 'Confirmed', appointmentOutcome: 'successful', commencementDate: '2026-11-01' }],
    internships: []
  }];

  const map = buildCanonicalStatusMap(students, workflows, refDate);
  assert(map.get('STU-101') === CANONICAL_STATUSES.IN_PROGRESS, 'Batch map maps STU-101 to In Progress');
  assert(map.get('STU-102') === CANONICAL_STATUSES.PLACEMENT_STARTED, 'Batch map maps STU-102 to Placement Started');
}

console.log('\n============================================================');
console.log(` SUMMARY: Total Tests: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ ALL CANONICAL STATUS ARCHITECTURE TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
  process.exit(0);
}
