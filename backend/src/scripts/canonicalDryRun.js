import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portal';

const StudentModel = mongoose.model('Student_DryRun', new mongoose.Schema({}, { strict: false, collection: 'students' }));
const WorkflowModel = mongoose.model('Workflow_DryRun', new mongoose.Schema({}, { strict: false, collection: 'workflows' }));
const PaymentModel = mongoose.model('Payment_DryRun', new mongoose.Schema({}, { strict: false, collection: 'payments' }));

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

async function runDryRun() {
  console.log(`[DryRun] Connecting to ${MONGO_URI} in READ-ONLY mode...`);
  await mongoose.connect(MONGO_URI);
  console.log('[DryRun] Connected.\n');

  const [students, workflows, payments] = await Promise.all([
    StudentModel.find({}).lean(),
    WorkflowModel.find({}).lean(),
    PaymentModel.find({}).lean(),
  ]);

  const allRequests = workflows.flatMap((w) => (w.requests || []).map((r) => ({ ...r, _wfId: w._id, _wfName: w.name })));
  const allAppointments = workflows.flatMap((w) => (w.appointments || []).map((a) => ({ ...a, _wfId: w._id, _wfName: w.name })));
  const allInternships = workflows.flatMap((w) => (w.internships || []).map((i) => ({ ...i, _wfId: w._id, _wfName: w.name })));

  // Count name occurrences to ensure name fallback is only used for strictly unique names
  const nameCounts = new Map();
  students.forEach((s) => {
    const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
    if (sName) {
      nameCounts.set(sName, (nameCounts.get(sName) || 0) + 1);
    }
  });

  const studentIdsSet = new Set(students.map((s) => norm(s.studentId)).filter(Boolean));
  const studentDbIdsSet = new Set(students.map((s) => norm(s._id)).filter(Boolean));

  // Helper: Exact matching
  const matchItems = (items, s) => {
    const sId = norm(s.studentId);
    const sDbId = norm(s._id);
    const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
    const isNameUnique = sName && nameCounts.get(sName) === 1;

    return items.filter((item) => {
      const itemStuId = norm(item.studentId || item.id);
      const itemStuDbId = norm(item.studentDbId);
      const itemStudent = norm(item.student || item.studentName);

      // Primary: Exact ID match
      if (sId && (itemStuId === sId || itemStuDbId === sId)) return true;
      if (sDbId && (itemStuDbId === sDbId || itemStuId === sDbId)) return true;

      // Secondary: ONLY match name if student name is 100% unique across all students
      if (isNameUnique && itemStudent === sName) return true;

      return false;
    });
  };

  // Match orphaned appointments (not linked to any student)
  const orphanedAppts = allAppointments.filter((a) => {
    const aStuId = norm(a.studentId || a.id);
    const aDbId = norm(a.studentDbId);
    const aName = norm(a.student);
    const hasIdMatch = (aStuId && studentIdsSet.has(aStuId)) || (aDbId && studentDbIdsSet.has(aDbId));
    if (hasIdMatch) return false;
    if (aName && nameCounts.get(aName) === 1) return false;
    return true;
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const results = [];

  for (const s of students) {
    const matchingReqs = matchItems(allRequests, s);
    const matchingAppts = matchItems(allAppointments, s);
    const matchingInts = matchItems(allInternships, s);
    const matchingPayments = payments.filter((p) => {
      const sId = norm(s.studentId);
      const sDbId = norm(s._id);
      const sName = norm(s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim());
      const isNameUnique = sName && nameCounts.get(sName) === 1;

      if (sId && norm(p.studentId) === sId) return true;
      if (sDbId && norm(p.student) === sDbId) return true;
      if (isNameUnique && norm(p.studentName) === sName) return true;
      return false;
    });

    // Chronological sorting of appointments
    const sortedAppts = [...matchingAppts].sort((a, b) => {
      const da = parseDate(a.date || a.updatedAt || a.createdAt) || new Date(0);
      const db = parseDate(b.date || b.updatedAt || b.createdAt) || new Date(0);
      return db - da; // newest first
    });

    const sortedInts = [...matchingInts].sort((a, b) => {
      const da = parseDate(a.start || a.updatedAt || a.createdAt) || new Date(0);
      const db = parseDate(b.start || b.updatedAt || b.createdAt) || new Date(0);
      return db - da;
    });

    const currentPlacementStatus = s.placementStatus || 'Awaiting';
    const currentAccountStatus = s.status || 'Active';
    const currentPriority = s.internshipPriority || 'Normal';
    const isSnoozed = Boolean(s.snoozed || currentPriority === 'Snooze');
    const isInactive = currentAccountStatus === 'Inactive' || currentPriority === 'Inactive';

    let proposedStatus = 'Awaiting';
    let confidence = 'High';
    let reason = '';
    let evidence = [];

    // --- RULE 1: Snooze / Inactive Preservation ---
    if (isSnoozed) {
      proposedStatus = 'Snooze';
      confidence = 'High';
      reason = 'Student has active Snooze flag/priority set in profile.';
      evidence.push(`snoozed=${s.snoozed}, internshipPriority=${currentPriority}, snoozeReason="${s.snoozeReason || ''}"`);
    } else if (isInactive) {
      proposedStatus = 'Inactive';
      confidence = 'High';
      reason = 'Student account status is Inactive in database.';
      evidence.push(`status="${currentAccountStatus}", internshipPriority="${currentPriority}"`);
    } else {
      // --- Active Student Pipeline Evaluation ---
      const completedInt = sortedInts.find((i) => ['Completed', 'Placement Completed'].includes(i.status));
      const pastEndDateInt = sortedInts.find((i) => {
        const end = parseLocalDateNoon(i.end);
        return end && end < todayStart && !['Cancelled', 'Withdrawn'].includes(i.status);
      });

      const activeInt = sortedInts.find((i) => {
        if (['Completed', 'Placement Completed', 'Cancelled', 'Withdrawn', 'Declined'].includes(i.status)) return false;
        const start = parseLocalDateNoon(i.start);
        return ['Active', 'Placement Started', 'Joined'].includes(i.status) || (start && start <= todayStart);
      });

      const activeCommencementAppt = sortedAppts.find((a) => {
        if (['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
        if (a.appointmentOutcome === 'successful' || a.status === 'Confirmed') {
          const commDate = parseLocalDateNoon(a.commencementDate);
          return commDate && commDate <= todayStart;
        }
        return false;
      });

      const successfulAppt = sortedAppts.find((a) => {
        if (['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status)) return false;
        return a.appointmentOutcome === 'successful' || a.status === 'Confirmed';
      });

      const scheduledAppt = sortedAppts.find((a) => {
        return (
          ['Scheduled', 'Rescheduled'].includes(a.status) &&
          !['Cancelled', 'Withdrawn', 'Student Withdraw', 'Declined', 'Industry Rejected', 'No Show', 'Not Suitable Site'].includes(a.status) &&
          a.appointmentOutcome !== 'student_withdrawal'
        );
      });

      const latestAppt = sortedAppts[0];
      const hasTerminalOutcome = latestAppt && (
        ['Student Withdraw', 'Industry Rejected', 'Student Missed Appointment', 'Not Suitable Site', 'Cancelled'].includes(latestAppt.status) ||
        ['student_withdrawal', 'industry_rejected', 'student_missed', 'not_suitable_site'].includes(latestAppt.appointmentOutcome)
      );

      const hasContactedIndustry = matchingReqs.some((r) => {
        return (r.contactedIndustries && r.contactedIndustries.length > 0) || r.status === 'Industry Contacted';
      }) || (s.contactedIndustries && s.contactedIndustries.length > 0);

      const hasOpenRequest = matchingReqs.some((r) => !['Closed', 'Cancelled', 'Rejected'].includes(r.status));

      if (completedInt || (pastEndDateInt && currentPlacementStatus === 'Placement Completed')) {
        proposedStatus = 'Placement Completed';
        confidence = completedInt ? 'High' : 'Medium';
        reason = 'Internship record completed or end date elapsed with verified completion.';
        evidence.push(completedInt ? `Internship ${completedInt.intId || completedInt.id}: status=${completedInt.status}` : `Internship end date elapsed: ${pastEndDateInt?.end}`);
      } else if (activeInt || activeCommencementAppt) {
        proposedStatus = 'Placement Started';
        confidence = 'High';
        reason = 'Placement commenced with verified start/commencement date.';
        evidence.push(activeInt ? `Internship ${activeInt.intId || activeInt.id}: status="${activeInt.status}", start="${activeInt.start}"` : `Appointment ${activeCommencementAppt.apptId || activeCommencementAppt.id}: commencementDate="${activeCommencementAppt.commencementDate}"`);
      } else if (successfulAppt) {
        const commDate = parseLocalDateNoon(successfulAppt.commencementDate);
        if (commDate && commDate > todayStart) {
          proposedStatus = 'Appointment Successful';
          confidence = 'High';
          reason = `Appointment confirmed/successful. Scheduled placement commencement date is in the future (${successfulAppt.commencementDate}).`;
          evidence.push(`Appointment ${successfulAppt.apptId || successfulAppt.id}: status="${successfulAppt.status}", outcome="${successfulAppt.appointmentOutcome}", commencementDate="${successfulAppt.commencementDate}"`);
        } else if (latestAppt && latestAppt !== successfulAppt && hasTerminalOutcome) {
          confidence = 'Manual Review';
          proposedStatus = 'Manual Review';
          reason = `Conflicting appointment history: older appointment was successful, but latest appointment has terminal outcome (${latestAppt.status || latestAppt.appointmentOutcome}).`;
          evidence.push(`Latest Appt: ${latestAppt.status} [${latestAppt.appointmentOutcome}] on ${latestAppt.date}`);
          evidence.push(`Prior Successful Appt: ${successfulAppt.status} on ${successfulAppt.date}`);
        } else {
          proposedStatus = 'Appointment Successful';
          confidence = 'High';
          reason = 'Interview completed successfully; awaiting placement commencement.';
          evidence.push(`Appointment ${successfulAppt.apptId || successfulAppt.id}: status="${successfulAppt.status}", outcome="${successfulAppt.appointmentOutcome}", date="${successfulAppt.date}"`);
        }
      } else if (scheduledAppt) {
        proposedStatus = 'Appointment Scheduled';
        confidence = 'High';
        reason = `Active interview booked for ${scheduledAppt.date || 'upcoming date'} at ${scheduledAppt.time || ''} with ${scheduledAppt.company || 'host'}.`;
        evidence.push(`Appointment ${scheduledAppt.apptId || scheduledAppt.id}: status="${scheduledAppt.status}", date="${scheduledAppt.date}", company="${scheduledAppt.company}"`);
      } else if (hasTerminalOutcome) {
        if (latestAppt.status === 'Student Withdraw' || latestAppt.appointmentOutcome === 'student_withdrawal') {
          proposedStatus = 'Student Withdraw';
        } else if (latestAppt.status === 'Industry Rejected' || latestAppt.appointmentOutcome === 'industry_rejected') {
          proposedStatus = 'Industry Rejected';
        } else if (latestAppt.status === 'Student Missed Appointment' || latestAppt.appointmentOutcome === 'student_missed') {
          proposedStatus = 'Student Missed Appointment';
        } else if (latestAppt.status === 'Not Suitable Site' || latestAppt.appointmentOutcome === 'not_suitable_site') {
          proposedStatus = 'Not Suitable Site';
        } else {
          proposedStatus = 'Student Withdraw';
        }
        confidence = 'High';
        reason = `Latest appointment event recorded terminal outcome: "${proposedStatus}".`;
        evidence.push(`Appointment ${latestAppt.apptId || latestAppt.id}: status="${latestAppt.status}", outcome="${latestAppt.appointmentOutcome}", reason="${latestAppt.cancellationReason || 'N/A'}"`);
      } else if (hasContactedIndustry) {
        proposedStatus = 'Industry Contacted';
        confidence = 'High';
        reason = 'Industry contact record added, awaiting interview scheduling.';
        evidence.push(`Request has contacted industries: ${matchingReqs.map(r => r.contactedIndustries?.length || 0).join(', ')} contacts`);
      } else if (hasOpenRequest) {
        proposedStatus = 'In Progress';
        confidence = 'High';
        reason = 'Placement request active in Step 2, searching for host facility.';
        evidence.push(`Request ${matchingReqs[0].reqId || matchingReqs[0].id}: status="${matchingReqs[0].status}", priority="${matchingReqs[0].priority}"`);
      } else {
        proposedStatus = 'Awaiting';
        confidence = 'High';
        reason = 'Student registered; no placement requests or downstream workflow records generated yet.';
        evidence.push('Zero active requests, zero appointments, zero internships.');
      }
    }

    if (matchingReqs.length > 1 && confidence !== 'Manual Review') {
      evidence.push(`Note: Student has ${matchingReqs.length} duplicate/historical requests in Step 2.`);
    }
    if (matchingAppts.length > 1 && confidence !== 'Manual Review') {
      evidence.push(`Note: Student has ${matchingAppts.length} appointment records in Step 3 history.`);
    }

    const matchesCurrent = (norm(currentPlacementStatus) === norm(proposedStatus)) || (currentPlacementStatus === 'N/A' && (proposedStatus === 'Snooze' || proposedStatus === 'Inactive'));

    results.push({
      studentId: s.studentId || String(s._id),
      name: s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      email: s.emailAddress || s.email || '—',
      rto: s.assignedRto || s.rto || '—',
      currentStatus: currentPlacementStatus,
      currentAccountStatus: currentAccountStatus,
      proposedStatus,
      matchesCurrent,
      confidence,
      reason,
      evidence,
      counts: {
        requests: matchingReqs.length,
        appointments: matchingAppts.length,
        internships: matchingInts.length,
        payments: matchingPayments.length,
      },
    });
  }

  const dryRunSummary = {
    timestamp: new Date().toISOString(),
    totalStudents: students.length,
    alreadyMatching: results.filter((r) => r.matchesCurrent).length,
    needsUpdate: results.filter((r) => !r.matchesCurrent && r.confidence !== 'Manual Review').length,
    manualReviewRequired: results.filter((r) => r.confidence === 'Manual Review').length,
    confidenceBreakdown: {
      high: results.filter((r) => r.confidence === 'High').length,
      medium: results.filter((r) => r.confidence === 'Medium').length,
      manualReview: results.filter((r) => r.confidence === 'Manual Review').length,
    },
    orphanedAppointmentsCount: orphanedAppts.length,
    orphanedAppointmentsSample: orphanedAppts.map((a) => ({
      apptId: a.apptId || a.id,
      student: a.student,
      studentId: a.studentId,
      status: a.status,
      date: a.date,
      company: a.company,
      outcome: a.appointmentOutcome,
    })),
    students: results,
  };

  const outputPath = path.resolve('dry_run_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(dryRunSummary, null, 2), 'utf-8');
  console.log(`[DryRun] Strict dry-run results written to: ${outputPath}`);

  console.log('\n========================================');
  console.log('PHASE 2 STRICT DRY-RUN PREVIEW SUMMARY');
  console.log('========================================');
  console.log(`Total Audited Students:        ${dryRunSummary.totalStudents}`);
  console.log(`Already Matching Canonical:    ${dryRunSummary.alreadyMatching}`);
  console.log(`Need Status Update:            ${dryRunSummary.needsUpdate}`);
  console.log(`Requires Manual Review:        ${dryRunSummary.manualReviewRequired}`);
  console.log(`Orphaned Appointments:         ${dryRunSummary.orphanedAppointmentsCount} (Preserved)\n`);

  await mongoose.disconnect();
  console.log('[DryRun] Disconnected from MongoDB (READ-ONLY).');
}

runDryRun().catch((err) => {
  console.error('[DryRun] Failed:', err);
  process.exit(1);
});
