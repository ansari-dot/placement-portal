import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load backend .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portal';

// Schemas for read-only inspection (strict: false, lean: true)
const StudentModel = mongoose.model('Student_Audit', new mongoose.Schema({}, { strict: false, collection: 'students' }));
const WorkflowModel = mongoose.model('Workflow_Audit', new mongoose.Schema({}, { strict: false, collection: 'workflows' }));
const PaymentModel = mongoose.model('Payment_Audit', new mongoose.Schema({}, { strict: false, collection: 'payments' }));

async function runAudit() {
  console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully (READ-ONLY MODE).\n');

  // Read all collections lean
  const [students, workflows, payments] = await Promise.all([
    StudentModel.find({}).lean(),
    WorkflowModel.find({}).lean(),
    PaymentModel.find({}).lean(),
  ]);

  console.log(`Found:`);
  console.log(`  - Students: ${students.length}`);
  console.log(`  - Workflows: ${workflows.length}`);
  console.log(`  - Payments: ${payments.length}`);

  // Flatten workflow subdocuments
  const allRequests = workflows.flatMap((w) => (w.requests || []).map((r) => ({ ...r, _wfId: w._id })));
  const allAppointments = workflows.flatMap((w) => (w.appointments || []).map((a) => ({ ...a, _wfId: w._id })));
  const allInternships = workflows.flatMap((w) => (w.internships || []).map((i) => ({ ...i, _wfId: w._id })));

  console.log(`  - Workflow Requests (Step 2): ${allRequests.length}`);
  console.log(`  - Workflow Appointments (Step 3): ${allAppointments.length}`);
  console.log(`  - Workflow Internships (Step 4): ${allInternships.length}\n`);

  const auditRows = [];

  const norm = (v) => String(v || '').trim().toLowerCase();

  for (const s of students) {
    const sId = norm(s.studentId);
    const sDbId = norm(s._id);
    const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());

    // Match Requests (Step 2)
    const matchingReqs = allRequests.filter((r) => {
      return (
        (sId && (norm(r.studentId) === sId || norm(r.id) === sId)) ||
        (sDbId && (norm(r.studentDbId) === sDbId || norm(r.studentId) === sDbId)) ||
        (sName && norm(r.student) === sName)
      );
    });

    // Match Appointments (Step 3)
    const matchingAppts = allAppointments.filter((a) => {
      return (
        (sId && (norm(a.studentId) === sId || norm(a.id) === sId)) ||
        (sDbId && norm(a.studentDbId) === sDbId) ||
        (sName && norm(a.student) === sName)
      );
    });

    // Match Internships (Step 4)
    const matchingInts = allInternships.filter((i) => {
      return (
        (sId && (norm(i.studentId) === sId || norm(i.id) === sId)) ||
        (sName && norm(i.student) === sName)
      );
    });

    // Match Payments (Step 5)
    const matchingPayments = payments.filter((p) => {
      return (
        (sId && norm(p.studentId) === sId) ||
        (sDbId && norm(p.student) === sDbId) ||
        (sName && norm(p.studentName) === sName)
      );
    });

    // Step 1 status
    const step1Status = s.placementStatus || '(None)';
    const step1AccStatus = s.status || 'Active';
    const step1Priority = s.internshipPriority || 'Normal';
    const step1Snoozed = Boolean(s.snoozed);

    // Step 2 status(es)
    const step2Statuses = matchingReqs.map((r) => r.status || 'New');
    const step2Str = step2Statuses.length > 0 ? step2Statuses.join(', ') : '(No Request)';

    // Step 3 status(es)
    const step3Details = matchingAppts.map((a) => {
      const outcome = a.appointmentOutcome ? ` [outcome: ${a.appointmentOutcome}]` : '';
      return `${a.status || 'Scheduled'}${outcome}`;
    });
    const step3Str = step3Details.length > 0 ? step3Details.join(', ') : '(No Appt)';

    // Step 4 status(es)
    const step4Statuses = matchingInts.map((i) => `${i.status || 'Active'} (${i.start || 'no start'} to ${i.end || 'no end'})`);
    const step4Str = step4Statuses.length > 0 ? step4Statuses.join(', ') : '(No Placement)';

    // Step 5 status(es)
    const step5Details = matchingPayments.map((p) => {
      return `[PS: ${p.placementStatus || '—'} | Pay: ${p.paymentStatus || 'Pending'} | ${p.chargePercentage ?? 100}% | $${p.paymentAmount ?? 0}]`;
    });
    const step5Str = step5Details.length > 0 ? step5Details.join(', ') : '(No Payment)';

    // Identify discrepancies & issues
    const issues = [];

    // Issue: Snoozed or Inactive inconsistency
    if ((step1Snoozed || step1Priority === 'Snooze' || step1Priority === 'Inactive' || step1AccStatus === 'Inactive') && step1Status !== 'N/A') {
      issues.push(`Step 1: Student is marked ${step1Snoozed ? 'Snooze' : step1AccStatus}, but placementStatus is "${step1Status}" (expected "N/A")`);
    }

    // Issue: Advanced in Appointment / Placement but Step 1 is Awaiting or In Progress
    const hasSuccessfulAppt = matchingAppts.some((a) => a.appointmentOutcome === 'successful' || a.status === 'Confirmed');
    const hasWithdrawnAppt = matchingAppts.some((a) => a.appointmentOutcome === 'student_withdrawal' || a.status === 'Student Withdraw');
    const hasRejectedAppt = matchingAppts.some((a) => a.appointmentOutcome === 'industry_rejected' || a.status === 'Industry Rejected');
    const hasMissedAppt = matchingAppts.some((a) => a.appointmentOutcome === 'student_missed' || a.status === 'Student Missed Appointment');

    if (hasSuccessfulAppt && !['Appointment Successful', 'Placement Started', 'Placement Completed', 'Completed'].includes(step1Status)) {
      issues.push(`Step 3 has Successful appointment, but Step 1 is "${step1Status}"`);
    }

    if (hasWithdrawnAppt && !['Student Withdraw', 'Student Withdrawn', 'Withdrawn'].includes(step1Status)) {
      issues.push(`Step 3 has Withdrawn appointment, but Step 1 is "${step1Status}"`);
    }

    if (hasRejectedAppt && !['Industry Rejected', 'Declined'].includes(step1Status)) {
      issues.push(`Step 3 has Industry Rejected appointment, but Step 1 is "${step1Status}"`);
    }

    if (hasMissedAppt && !['Student Missed Appointment', 'No Show'].includes(step1Status)) {
      issues.push(`Step 3 has Missed appointment, but Step 1 is "${step1Status}"`);
    }

    // Step 4 vs Step 1
    const hasCompletedPlacement = matchingInts.some((i) => ['Completed', 'Placement Completed'].includes(i.status));
    if (hasCompletedPlacement && step1Status !== 'Placement Completed' && step1Status !== 'Completed') {
      issues.push(`Step 4 has Completed placement, but Step 1 is "${step1Status}"`);
    }

    // Step 5 snapshot mismatch
    for (const p of matchingPayments) {
      if (p.placementStatus && step1Status !== 'N/A' && p.placementStatus !== step1Status) {
        issues.push(`Step 5 payment snapshot ("${p.placementStatus}") != Step 1 ("${step1Status}")`);
      }
    }

    // Multiple active requests
    if (matchingReqs.length > 1) {
      issues.push(`Multiple requests in Step 2 (${matchingReqs.length} records)`);
    }

    // Multiple appointments
    if (matchingAppts.length > 1) {
      issues.push(`Multiple appointments in Step 3 (${matchingAppts.length} records)`);
    }

    // Unlinked Request (In Step 2 with no Step 1 placement status advance)
    if (matchingReqs.length > 0 && step1Status === 'Awaiting') {
      issues.push(`Step 2 has placement request, but Step 1 placementStatus is still "Awaiting"`);
    }

    auditRows.push({
      studentId: s.studentId || String(s._id),
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      email: s.emailAddress || s.email || '—',
      rto: s.assignedRto || s.rto || '—',
      step1: step1Status,
      step1Acc: step1AccStatus,
      step2: step2Str,
      step3: step3Str,
      step4: step4Str,
      step5: step5Str,
      issues: issues,
    });
  }

  // Check for Orphaned Records
  const studentIdsSet = new Set(students.map((s) => norm(s.studentId)).filter(Boolean));
  const studentDbIdsSet = new Set(students.map((s) => norm(s._id)).filter(Boolean));
  const studentNamesSet = new Set(students.map((s) => norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim())).filter(Boolean));

  const isMatched = (bizId, dbId, name) => {
    return (
      (bizId && studentIdsSet.has(norm(bizId))) ||
      (dbId && studentDbIdsSet.has(norm(dbId))) ||
      (name && studentNamesSet.has(norm(name)))
    );
  };

  const orphanedReqs = allRequests.filter((r) => !isMatched(r.studentId, r.studentDbId, r.student)).map(r => ({
    id: r.reqId || r.id,
    student: r.student,
    studentId: r.studentId,
    status: r.status,
  }));
  const orphanedAppts = allAppointments.filter((a) => !isMatched(a.studentId, a.studentDbId, a.student)).map(a => ({
    id: a.apptId || a.id,
    student: a.student,
    studentId: a.studentId,
    status: a.status,
  }));
  const orphanedInts = allInternships.filter((i) => !isMatched(i.studentId, null, i.student)).map(i => ({
    id: i.intId || i.id,
    student: i.student,
    studentId: i.studentId,
    status: i.status,
  }));
  const orphanedPayments = payments.filter((p) => !isMatched(p.studentId, p.student, p.studentName)).map(p => ({
    id: p._id,
    studentName: p.studentName,
    studentId: p.studentId,
    amount: p.paymentAmount,
  }));

  console.log(`Orphaned Records:`);
  console.log(`  - Orphaned Requests: ${orphanedReqs.length}`);
  console.log(`  - Orphaned Appointments: ${orphanedAppts.length}`);
  console.log(`  - Orphaned Internships: ${orphanedInts.length}`);
  console.log(`  - Orphaned Payments: ${orphanedPayments.length}\n`);

  const summary = {
    timestamp: new Date().toISOString(),
    totalStudents: students.length,
    studentsWithIssues: auditRows.filter((r) => r.issues.length > 0).length,
    studentsClean: auditRows.filter((r) => r.issues.length === 0).length,
    orphanedRecords: {
      requests: orphanedReqs,
      appointments: orphanedAppts,
      internships: orphanedInts,
      payments: orphanedPayments,
    },
    students: auditRows,
  };

  const reportPath = path.resolve('audit_report_raw.json');
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(`Audit report written to: ${reportPath}`);

  await mongoose.disconnect();
  console.log('Audit completed. Disconnected from MongoDB (READ-ONLY).');
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
