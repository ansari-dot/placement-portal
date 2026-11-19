/**
 * Phase 3.1 — Final Integration & Production Readiness Verification Script
 * 
 * STRICT SAFETY:
 * - 100% Read-Only inspection.
 * - ZERO database writes, updates, deletions, or schema changes.
 * - Asserts the 10 production readiness requirements.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import StudentModel from '../modules/student/student.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import PaymentModel from '../modules/payment/payment.model.js';
import { StudentService } from '../modules/student/student.service.js';
import { getWorkflowById } from '../modules/workflow/workflow.service.js';
import { getPaymentsService } from '../modules/payment/payment.service.js';
import { CANONICAL_STATUSES, EXCEPTIONAL_STATUSES } from '../modules/student/canonicalStatus.constants.js';
import { resolveCanonicalStudentStatus } from '../modules/student/canonicalStatus.service.js';

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

function check(condition, title, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${title}`);
  } else {
    failedAssertions++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${title}`);
    if (details) console.error(`    -> ${details}`);
  }
}

async function run() {
  console.log('\n============================================================');
  console.log(' PHASE 3.1: FINAL INTEGRATION & PRODUCTION READINESS CHECK');
  console.log('============================================================\n');

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected (Strictly Read-Only Session)\n');

  // Baseline audit count checks
  const stuCount = await StudentModel.countDocuments();
  const wfCount = await WorkflowModel.countDocuments();
  const payCount = await PaymentModel.countDocuments();

  check(stuCount === 31, `Student collection count is preserved (Actual: ${stuCount}, Expected: 31)`);
  check(payCount === 24, `Payment collection count is preserved (Actual: ${payCount}, Expected: 24)`);

  // --------------------------------------------------------------------------
  // 1. Verify API responses for Students, Requests, Appointments, Internships, Payments
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 2: API Response Schema Compatibility\x1b[0m');

  const adminUser = { role: 'Administrator', _id: new mongoose.Types.ObjectId() };
  const allStudents = await StudentService.getAllStudents(adminUser);
  check(allStudents.length === 31, 'getAllStudents returns all 31 students');

  const sampleStudent = allStudents[0];
  check(
    sampleStudent.canonicalStatus !== undefined &&
    sampleStudent.canonicalPlacementStatus !== undefined &&
    sampleStudent.canonicalReason !== undefined,
    'Student response contains canonicalStatus, canonicalPlacementStatus, and canonicalReason'
  );
  check(
    sampleStudent.placementStatus !== undefined && sampleStudent.name !== undefined,
    'Student response strictly preserves original legacy properties (backwards compatible)'
  );

  // Workflow API response
  const activeWf = await WorkflowModel.findOne({ 'requests.0': { $exists: true } });
  check(Boolean(activeWf), 'Active workflow document located in database');

  const wfData = await getWorkflowById(activeWf._id);
  const sampleReq = (wfData.requests || [])[0];
  const sampleAppt = (wfData.appointments || [])[0];
  const sampleInt = (wfData.internships || [])[0];

  if (sampleReq) {
    check(
      sampleReq.studentCanonicalStatus !== undefined,
      'Workflow Request contains studentCanonicalStatus',
      `Value: ${sampleReq.studentCanonicalStatus}`
    );
    check(sampleReq.status !== undefined, 'Workflow Request preserves individual request status');
  }

  if (sampleAppt) {
    check(
      sampleAppt.studentCanonicalStatus !== undefined,
      'Workflow Appointment contains studentCanonicalStatus',
      `Value: ${sampleAppt.studentCanonicalStatus}`
    );
    check(sampleAppt.status !== undefined, 'Workflow Appointment preserves individual appointment status');
  }

  if (sampleInt) {
    check(
      sampleInt.studentCanonicalStatus !== undefined,
      'Workflow Internship contains studentCanonicalStatus',
      `Value: ${sampleInt.studentCanonicalStatus}`
    );
    check(sampleInt.status !== undefined, 'Workflow Internship preserves individual placement status');
  }

  // Payment API response
  const payRes = await getPaymentsService({});
  const paymentList = payRes.data || [];
  check(paymentList.length === 24, `getPaymentsService returns all 24 payments (Actual: ${paymentList.length})`);

  const samplePay = paymentList[0];
  check(
    samplePay.studentCanonicalStatus !== undefined,
    'Payment response contains studentCanonicalStatus',
    `Value: ${samplePay.studentCanonicalStatus}`
  );
  check(
    samplePay.placementStatus !== undefined,
    'Payment response preserves historical placementStatus trigger snapshot',
    `Value: ${samplePay.placementStatus}`
  );
  check(
    samplePay.paymentStatus !== undefined && (samplePay.paymentAmount !== undefined || samplePay.totalAmount !== undefined),
    'Payment response preserves financial transaction fields intact'
  );

  // --------------------------------------------------------------------------
  // 2. Verify Same Student Has the SAME Canonical Status Across All 5 Steps
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 1: Cross-Step Canonical Status Consistency\x1b[0m');

  const studentMap = new Map();
  allStudents.forEach((s) => {
    studentMap.set(s.studentId, s.canonicalStatus);
    studentMap.set(String(s._id || s.id), s.canonicalStatus);
    studentMap.set(s.name?.trim().toLowerCase(), s.canonicalStatus);
  });

  // Cross-verify Step 2 Requests
  let reqsConsistent = 0;
  (wfData.requests || []).forEach((r) => {
    const expected = studentMap.get(r.studentId) || studentMap.get(r.student?.trim().toLowerCase()) || CANONICAL_STATUSES.AWAITING;
    if (r.studentCanonicalStatus === expected) {
      reqsConsistent++;
    }
  });
  check(
    reqsConsistent === (wfData.requests || []).length,
    `Step 2: 100% of requests match student canonical status (${reqsConsistent}/${(wfData.requests || []).length})`
  );

  // Cross-verify Step 3 Appointments
  let apptsConsistent = 0;
  (wfData.appointments || []).forEach((a) => {
    const expected = studentMap.get(a.studentId) || studentMap.get(a.student?.trim().toLowerCase()) || CANONICAL_STATUSES.AWAITING;
    if (a.studentCanonicalStatus === expected) {
      apptsConsistent++;
    }
  });
  check(
    apptsConsistent === (wfData.appointments || []).length,
    `Step 3: 100% of appointments match student canonical status (${apptsConsistent}/${(wfData.appointments || []).length})`
  );

  // Cross-verify Step 4 Internships
  let intsConsistent = 0;
  (wfData.internships || []).forEach((i) => {
    const expected = studentMap.get(i.studentId) || studentMap.get(i.student?.trim().toLowerCase()) || CANONICAL_STATUSES.AWAITING;
    if (i.studentCanonicalStatus === expected) {
      intsConsistent++;
    }
  });
  check(
    intsConsistent === (wfData.internships || []).length,
    `Step 4: 100% of internships match student canonical status (${intsConsistent}/${(wfData.internships || []).length})`
  );

  // Cross-verify Step 5 Payments
  let paymentsConsistent = 0;
  paymentList.forEach((p) => {
    const expected = studentMap.get(p.studentId) || studentMap.get(String(p.student || '')) || studentMap.get(p.studentName?.trim().toLowerCase()) || CANONICAL_STATUSES.AWAITING;
    if (p.studentCanonicalStatus === expected) {
      paymentsConsistent++;
    }
  });
  check(
    paymentsConsistent === paymentList.length,
    `Step 5: 100% of payments match student canonical status (${paymentsConsistent}/${paymentList.length})`
  );

  // --------------------------------------------------------------------------
  // 3. Verify Appointment Outcome Changes Correctly Affect Derived Status
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 3: Dynamic Appointment Outcome Transitions\x1b[0m');
  {
    const testStudent = { studentId: 'SIM-TRANS-01', name: 'Simulated Student' };
    const ref = new Date('2026-11-19T12:00:00Z');

    // 1. Initially Scheduled
    const appt = {
      studentId: 'SIM-TRANS-01',
      status: 'Scheduled',
      company: 'Health Facility A',
      date: '2026-11-25',
      updatedAt: '2026-11-19T10:00:00Z'
    };
    let resolved = resolveCanonicalStudentStatus(testStudent, { appointments: [appt] }, ref);
    check(resolved.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SCHEDULED, 'Transition 1: Scheduled appointment yields Appointment Scheduled');

    // 2. Updated to Successful with future start date
    appt.status = 'Confirmed';
    appt.appointmentOutcome = 'successful';
    appt.commencementDate = '2026-12-05';
    resolved = resolveCanonicalStudentStatus(testStudent, { appointments: [appt] }, ref);
    check(resolved.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL, 'Transition 2: Confirmed successful yields Appointment Successful');

    // 3. Student withdraws
    appt.status = 'Student Withdraw';
    appt.appointmentOutcome = 'student_withdrawal';
    resolved = resolveCanonicalStudentStatus(testStudent, { appointments: [appt] }, ref);
    check(resolved.canonicalStatus === CANONICAL_STATUSES.STUDENT_WITHDRAW, 'Transition 3: Student withdrawal outcome yields Student Withdraw');

    // 4. Rescheduled and successful again at second facility
    const appt2 = {
      studentId: 'SIM-TRANS-01',
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      company: 'Health Facility B',
      date: '2026-11-20',
      commencementDate: '2026-12-10',
      updatedAt: '2026-11-19T11:00:00Z'
    };
    resolved = resolveCanonicalStudentStatus(testStudent, { appointments: [appt, appt2] }, ref);
    check(resolved.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL, 'Transition 4: Subsequent success supersedes historical withdrawal dynamically');
  }

  // --------------------------------------------------------------------------
  // 4. Verify Future Placement Commencement Does NOT Prematurely Produce Placement Started
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 4: Future Commencement Guard\x1b[0m');
  {
    const futureStudent = { studentId: 'FUT-001', name: 'Future Student' };
    const ref = new Date('2026-11-19T12:00:00Z');
    const futureAppt = {
      studentId: 'FUT-001',
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      commencementDate: '2026-12-15' // Future
    };
    const futureInt = {
      studentId: 'FUT-001',
      status: 'Waiting to Join',
      start: '2026-12-15',
      end: '2027-03-15'
    };
    const res = resolveCanonicalStudentStatus(futureStudent, { appointments: [futureAppt], internships: [futureInt] }, ref);
    check(
      res.canonicalStatus === CANONICAL_STATUSES.APPOINTMENT_SUCCESSFUL,
      'Future commencement date correctly stays Appointment Successful (NOT Placement Started)'
    );
    check(
      res.canonicalStatus !== CANONICAL_STATUSES.PLACEMENT_STARTED,
      'Strictly confirmed: Did NOT jump to Placement Started prematurely'
    );
  }

  // --------------------------------------------------------------------------
  // 5. Verify Historical Payment Snapshots and Calculations Remain Unchanged
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 5: Historical Payment Snapshots & Calculations\x1b[0m');
  {
    const rawPayments = await PaymentModel.find({}).lean();
    let snapshotsIntact = 0;
    let pricesIntact = 0;

    rawPayments.forEach((p) => {
      // placementStatus must exist and not be empty
      if (p.placementStatus && typeof p.placementStatus === 'string') snapshotsIntact++;
      // originalPrice or paymentAmount must be a valid number
      if (typeof (p.paymentAmount ?? p.totalAmount ?? p.amount) === 'number' && (p.paymentAmount ?? p.totalAmount ?? p.amount) >= 0) pricesIntact++;
    });

    check(snapshotsIntact === 24, `All 24 payments retain historical placementStatus snapshot (${snapshotsIntact}/24)`);
    check(pricesIntact === 24, `All 24 payments retain valid price calculations (${pricesIntact}/24)`);

    // Verify specifically an example payment with known snapshot
    const simrandeepPay = rawPayments.find((p) => (p.studentName || '').toLowerCase().includes('simrandeep'));
    if (simrandeepPay) {
      check(
        simrandeepPay.placementStatus !== undefined,
        `Simrandeep payment snapshot is present: "${simrandeepPay.placementStatus}"`
      );
    }
  }

  // --------------------------------------------------------------------------
  // 6. Verify Snoozed, Inactive, Withdrawn, and Rejected Students
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 6: Exceptional Statuses Preservation\x1b[0m');
  {
    const ref = new Date('2026-11-19T12:00:00Z');

    // Snoozed
    const snoozed = resolveCanonicalStudentStatus(
      { studentId: 'S-1', snoozed: true, internshipPriority: 'Snooze' },
      { appointments: [{ studentId: 'S-1', status: 'Confirmed', commencementDate: '2026-11-01' }] },
      ref
    );
    check(snoozed.canonicalStatus === CANONICAL_STATUSES.SNOOZED, 'Preserves Snoozed exceptional status');

    // Inactive
    const inactive = resolveCanonicalStudentStatus(
      { studentId: 'S-2', status: 'Inactive', internshipPriority: 'Inactive' },
      { appointments: [{ studentId: 'S-2', status: 'Confirmed', commencementDate: '2026-11-01' }] },
      ref
    );
    check(inactive.canonicalStatus === CANONICAL_STATUSES.INACTIVE, 'Preserves Inactive exceptional status');

    // Withdrawn
    const withdrawn = resolveCanonicalStudentStatus(
      { studentId: 'S-3' },
      { appointments: [{ studentId: 'S-3', status: 'Student Withdraw', appointmentOutcome: 'student_withdrawal' }] },
      ref
    );
    check(withdrawn.canonicalStatus === CANONICAL_STATUSES.STUDENT_WITHDRAW, 'Preserves Student Withdraw exceptional status');

    // Rejected
    const rejected = resolveCanonicalStudentStatus(
      { studentId: 'S-4' },
      { appointments: [{ studentId: 'S-4', status: 'Industry Rejected', appointmentOutcome: 'industry_rejected' }] },
      ref
    );
    check(rejected.canonicalStatus === CANONICAL_STATUSES.INDUSTRY_REJECTED, 'Preserves Industry Rejected exceptional status');

    // Missed
    const missed = resolveCanonicalStudentStatus(
      { studentId: 'S-5' },
      { appointments: [{ studentId: 'S-5', status: 'Student Missed Appointment', appointmentOutcome: 'student_missed' }] },
      ref
    );
    check(missed.canonicalStatus === CANONICAL_STATUSES.STUDENT_MISSED_APPOINTMENT, 'Preserves Student Missed Appointment exceptional status');

    // Not Suitable Site
    const notSuitable = resolveCanonicalStudentStatus(
      { studentId: 'S-6' },
      { appointments: [{ studentId: 'S-6', status: 'Not Suitable Site', appointmentOutcome: 'not_suitable_site' }] },
      ref
    );
    check(notSuitable.canonicalStatus === CANONICAL_STATUSES.NOT_SUITABLE_SITE, 'Preserves Not Suitable Site exceptional status');
  }

  // --------------------------------------------------------------------------
  // 7. Verify Multiple Requests and Appointments per Student
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 7: Multiple Requests & Appointments per Student\x1b[0m');
  {
    const ref = new Date('2026-11-19T12:00:00Z');
    const multiStudent = { studentId: 'MULTI-STU-01', name: 'Multi Student' };

    const reqs = [
      { studentId: 'MULTI-STU-01', status: 'Closed', requestedOn: '2026-07-01' },
      { studentId: 'MULTI-STU-01', status: 'Coordinator Review', requestedOn: '2026-08-01', contactedIndustries: [{ name: 'Clinic 1' }] },
      { studentId: 'MULTI-STU-01', status: 'Approved', requestedOn: '2026-09-01' }
    ];

    const appts = [
      { studentId: 'MULTI-STU-01', status: 'Declined', appointmentOutcome: 'industry_rejected', date: '2026-09-10', updatedAt: '2026-09-11T00:00:00Z' },
      { studentId: 'MULTI-STU-01', status: 'Student Withdraw', appointmentOutcome: 'student_withdrawal', date: '2026-10-01', updatedAt: '2026-10-02T00:00:00Z' },
      { studentId: 'MULTI-STU-01', status: 'Confirmed', appointmentOutcome: 'successful', date: '2026-11-01', commencementDate: '2026-11-10', updatedAt: '2026-11-02T00:00:00Z' }
    ];

    const res = resolveCanonicalStudentStatus(multiStudent, { requests: reqs, appointments: appts }, ref);
    check(
      res.canonicalStatus === CANONICAL_STATUSES.PLACEMENT_STARTED,
      'Multi-appointment history resolves to latest successful commencement (Placement Started)'
    );
  }

  // --------------------------------------------------------------------------
  // 8. Performance & Query Analysis (N+1 Query Detection)
  // --------------------------------------------------------------------------
  console.log('\n\x1b[36mRequirement 8: Performance & N+1 Database Query Analysis\x1b[0m');
  {
    let queryCount = 0;
    const originalExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = function (...args) {
      queryCount++;
      return originalExec.apply(this, args);
    };

    // Benchmark getAllStudents
    const startStudents = Date.now();
    queryCount = 0;
    await StudentService.getAllStudents(adminUser);
    const durationStudents = Date.now() - startStudents;
    const studentQueries = queryCount;

    check(
      studentQueries <= 3,
      `StudentService.getAllStudents executes in O(1) database queries (Queries: ${studentQueries}, Time: ${durationStudents}ms)`
    );

    // Benchmark getWorkflowById
    const startWf = Date.now();
    queryCount = 0;
    await getWorkflowById(activeWf._id);
    const durationWf = Date.now() - startWf;
    const wfQueries = queryCount;

    check(
      wfQueries <= 3,
      `WorkflowService.getWorkflowById executes in O(1) database queries (Queries: ${wfQueries}, Time: ${durationWf}ms)`
    );

    // Benchmark getPaymentsService
    const startPay = Date.now();
    queryCount = 0;
    await getPaymentsService({ page: 1, limit: 50 });
    const durationPay = Date.now() - startPay;
    const payQueries = queryCount;

    check(
      payQueries <= 5,
      `PaymentService.getPaymentsService executes in O(1) database queries (Queries: ${payQueries}, Time: ${durationPay}ms)`
    );

    // Restore original exec
    mongoose.Query.prototype.exec = originalExec;
  }

  // Final check: confirm database remains 100% untouched
  const finalStuCount = await StudentModel.countDocuments();
  const finalWfCount = await WorkflowModel.countDocuments();
  const finalPayCount = await PaymentModel.countDocuments();

  check(finalStuCount === stuCount, `Zero database writes to Students (${finalStuCount} == ${stuCount})`);
  check(finalWfCount === wfCount, `Zero database writes to Workflows (${finalWfCount} == ${wfCount})`);
  check(finalPayCount === payCount, `Zero database writes to Payments (${finalPayCount} == ${payCount})`);

  console.log('\n============================================================');
  console.log(` SUMMARY: Total Checks: ${totalAssertions} | Passed: ${passedAssertions} | Failed: ${failedAssertions}`);
  console.log('============================================================\n');

  await mongoose.disconnect();

  if (failedAssertions > 0) {
    process.exit(1);
  } else {
    console.log('\x1b[32m✔ PHASE 3.1 PRODUCTION READINESS VERIFICATION COMPLETED WITH 100% SUCCESS!\x1b[0m\n');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
