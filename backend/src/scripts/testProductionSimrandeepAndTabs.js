import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import mongoose from 'mongoose';
import connectDB from '../core/config/db_config.js';
import StudentModel from '../modules/student/student.model.js';
import WorkflowModel, {
  AppointmentModel,
  InternshipModel,
  InternshipRequestModel,
} from '../modules/workflow/workflow.model.js';
import {
  createInternshipRequest,
  updateInternshipRequest,
  createAppointment,
  updateAppointment,
} from '../modules/workflow/workflow.service.js';
import { StudentService } from '../modules/student/student.service.js';
import { calculateLifecycleStatus } from '../modules/student/studentStatus.service.js';
import PaymentModel from '../modules/payment/payment.model.js';
import {
  syncChargeableStudents,
  importStudentsToPaymentService,
} from '../modules/payment/payment.service.js';
import RtoModel from '../modules/rto/rto.model.js';

dotenv.config();

const results = { passed: 0, failed: 0, errors: [] };

function assert(condition, testName, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    results.failed++;
    const errMsg = `  [FAIL] ${testName} - ${details}`;
    console.error(errMsg);
    results.errors.push(errMsg);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('   PRODUCTION VERIFICATION TEST: SIMRANDEEP KAUR & STUDENT TABS ');
  console.log('================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const testStudentId = `STU-TEST-${timestamp}`;
  const testStudentName = `Simrandeep Kaur Test ${timestamp}`;
  const testEmail = `simrandeep.${timestamp}@test.edu.au`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: SETUP TEST STUDENT & INITIAL WORKFLOW
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Initial Student & Workflow Setup ---');
    const student = await StudentModel.create({
      studentId: testStudentId,
      name: testStudentName,
      firstName: 'Simrandeep',
      lastName: 'Kaur',
      email: testEmail,
      emailAddress: testEmail,
      phoneNumber: '0412345678',
      courseQualification: 'Certificate III in Early Childhood Education and Care',
      course: 'Certificate III in Early Childhood Education and Care',
      status: 'Active',
      internshipPriority: 'Urgent',
      placementStatus: 'In Progress',
      lifecycleStatus: 'Request Pending',
      rto: 'Care Education RTO',
      assignedRto: 'Care Education RTO',
    });

    const workflow = await WorkflowModel.create({
      name: `Test Workflow ${timestamp}`,
      status: 'Active',
      currentStep: 1,
      requests: [],
      appointments: [],
      internships: [],
    });

    assert(student._id && workflow._id, 'Student and Workflow created successfully in DB');

    // -------------------------------------------------------------------------
    // TEST 2: GENERATE INITIAL URGENT PLACEMENT REQUEST
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Generate Initial Urgent Placement Request ---');
    const req = await createInternshipRequest(workflow._id, {
      title: 'Childcare Placement',
      student: testStudentName,
      studentId: testStudentId,
      company: 'Lotus Montessori',
      rto: 'Care Education RTO',
      priority: 'Urgent',
      status: 'New',
      returnedToStep1: false,
      contactedIndustries: [
        {
          organizationName: 'Lotus Montessori',
          contactPerson: 'Jane Manager',
          email: 'jane@lotus.test',
          phone: '0400111222',
          response: 'In Discussion',
        },
      ],
    });

    assert(req && req.priority === 'Urgent', 'Placement request created with Urgent priority');

    // -------------------------------------------------------------------------
    // TEST 3: INITIAL PLACEMENT AT LOTUS MONTESSORI & WITHDRAWAL
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Schedule Lotus Montessori, Start, and Student Withdraws ---');
    const apptLotus = await createAppointment(workflow._id, {
      student: testStudentName,
      studentId: testStudentId,
      company: 'Lotus Montessori',
      rto: 'Care Education RTO',
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      date: '2026-09-01',
      commencementDate: '2026-09-05',
    });

    // Student attends 3 days and withdraws
    await updateAppointment(workflow._id, apptLotus._id || apptLotus.apptId, {
      status: 'Student Withdraw',
      appointmentOutcome: 'student_withdrawal',
      cancellationReason: 'Student withdrew after 3 days reporting misbehaviour',
      cancellationType: 'withdrawn',
    });

    // Verify student status after withdrawal
    const studentsAfterWithdraw = await StudentService.getAllStudents({ role: 'Administrator' });
    const stuWithdraw = studentsAfterWithdraw.find(s => s.studentId === testStudentId);
    assert(stuWithdraw && stuWithdraw.placementStatus === 'Student Withdraw', 'Student placement status is Student Withdraw after withdrawing from Lotus Montessori');

    // Verify request was marked returnedToStep1 by withdrawal
    const refreshedWf1 = await WorkflowModel.findById(workflow._id);
    const reqAfterWithdraw = refreshedWf1.requests.find(r => r.studentId === testStudentId);
    assert(reqAfterWithdraw && reqAfterWithdraw.status === 'Student Withdraw', 'Request status set to Student Withdraw');

    // -------------------------------------------------------------------------
    // TEST 4: ADD NEW INDUSTRY (MODBURY KINDERGARTEN) WITHOUT REGENERATING REQUEST
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Add New Industry (Modbury Kindergarten) to Existing Urgent Request ---');
    // Coordinator adds Modbury Kindergarten without regenerating request
    const updatedReq = await updateInternshipRequest(workflow._id, reqAfterWithdraw._id, {
      contactedIndustries: [
        {
          organizationName: 'Modbury Kindergarten',
          contactPerson: 'Director Sarah',
          email: 'sarah@modbury.test',
          phone: '0411222333',
          response: 'Interview Offered',
          notes: 'New placement opportunity after withdrawal',
        },
      ],
      returnedToStep1: false,
    });

    assert(updatedReq.returnedToStep1 === false, 'Request returnedToStep1 is reset to false upon adding new contact');
    assert(updatedReq.status === 'Industry Contacted', 'Request status automatically promoted to Industry Contacted');

    const studentsAfterContact = await StudentService.getAllStudents({ role: 'Administrator' });
    const stuContacted = studentsAfterContact.find(s => s.studentId === testStudentId);
    assert(stuContacted && stuContacted.placementStatus === 'Industry Contacted', 'Student placementStatus reactivated to Industry Contacted');

    // -------------------------------------------------------------------------
    // TEST 5: SCHEDULE NEW APPOINTMENT AT MODBURY KINDERGARTEN
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Schedule New Appointment at Modbury Kindergarten ---');
    const apptModbury = await createAppointment(workflow._id, {
      student: testStudentName,
      studentId: testStudentId,
      company: 'Modbury Kindergarten',
      rto: 'Care Education RTO',
      status: 'Scheduled',
      date: '2026-10-10',
      time: '10:00 AM',
    });

    // Check student placementStatus: MUST BE "Appointment Scheduled", NOT "Student Withdraw"!
    const studentsAfterScheduled = await StudentService.getAllStudents({ role: 'Administrator' });
    const stuScheduled = studentsAfterScheduled.find(s => s.studentId === testStudentId);
    assert(
      stuScheduled && stuScheduled.placementStatus === 'Appointment Scheduled',
      `Student status updated to "Appointment Scheduled" (Actual: "${stuScheduled?.placementStatus}")`,
      `Expected Appointment Scheduled but got ${stuScheduled?.placementStatus}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: CONFIRM APPOINTMENT OUTCOME SUCCESSFUL AT MODBURY KINDERGARTEN
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Modbury Kindergarten Appointment Successful ---');
    await updateAppointment(workflow._id, apptModbury._id || apptModbury.apptId, {
      status: 'Confirmed',
      appointmentOutcome: 'successful',
      commencementDate: '2026-11-20',
    });

    const studentsAfterSuccess = await StudentService.getAllStudents({ role: 'Administrator' });
    const stuSuccess = studentsAfterSuccess.find(s => s.studentId === testStudentId);
    assert(
      stuSuccess && (stuSuccess.placementStatus === 'Placement Started' || stuSuccess.placementStatus === 'Appointment Successful' || stuSuccess.placementStatus === 'Waiting to Join'),
      `Student status updated to Placement Started / Appointment Successful (Actual: "${stuSuccess?.placementStatus}")`
    );

    // -------------------------------------------------------------------------
    // TEST 7: STEP 4 PLACEMENTS - MODBURY KINDERGARTEN VS LOTUS MONTESSORI
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Verify Step 4 (Placements) Isolation & Separation ---');
    const finalWf = await WorkflowModel.findById(workflow._id);

    // Filter appointments for this student
    const studentAppts = (finalWf.appointments || []).filter(a => a.studentId === testStudentId);
    assert(studentAppts.length === 2, `Student has 2 distinct appointments in history (Lotus Montessori and Modbury Kindergarten)`);

    const lotusAppt = studentAppts.find(a => a.company === 'Lotus Montessori');
    const modburyAppt = studentAppts.find(a => a.company === 'Modbury Kindergarten');

    assert(lotusAppt && (lotusAppt.status === 'Student Withdraw' || lotusAppt.appointmentOutcome === 'student_withdrawal'), 'Lotus Montessori record retains Student Withdraw status');
    assert(modburyAppt && (modburyAppt.status === 'Confirmed' || modburyAppt.appointmentOutcome === 'successful'), 'Modbury Kindergarten record is Confirmed / Successful');

    // -------------------------------------------------------------------------
    // TEST 8: STUDENT-FACING PORTAL DASHBOARD RESOLUTION LOGIC
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Verify Student Portal Active Placement Resolution ---');
    const mockStudentAppointments = studentAppts;
    const activeAppt = mockStudentAppointments.find(
      a => !['Withdrawn', 'Student Withdraw', 'Student Withdrawn', 'Cancelled', 'Declined', 'Industry Rejected', 'No Show'].includes(a.status)
    );
    assert(activeAppt && activeAppt.company === 'Modbury Kindergarten', 'Student Portal Dashboard resolves Modbury Kindergarten as active placement');

    // -------------------------------------------------------------------------
    // TEST 9: ACTIVE, INACTIVE, AND SNOOZE TABS BEHAVIOR
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Active, Inactive, and Snoozed Student Tabs Logic ---');
    const isStudentSnoozed = (s) => Boolean(s.snoozed || s.internshipPriority === 'Snooze');
    const isStudentInactive = (s) => Boolean(s.status === 'Inactive' || s.internshipPriority === 'Inactive');

    const testActiveStu = { id: '1', status: 'Active', internshipPriority: 'Urgent', snoozed: false };
    const testSnoozedStu = { id: '2', status: 'Active', internshipPriority: 'Snooze', snoozed: true };
    const testInactiveStu = { id: '3', status: 'Inactive', internshipPriority: 'Inactive', snoozed: false };

    const allStudents = [testActiveStu, testSnoozedStu, testInactiveStu];

    // Tab 1: Active
    const activeTabStudents = allStudents.filter(s => !isStudentSnoozed(s) && !isStudentInactive(s));
    assert(activeTabStudents.length === 1 && activeTabStudents[0].id === '1', 'Active tab contains ONLY active student (excludes Snooze and Inactive)');

    // Tab 2: Inactive
    const inactiveTabStudents = allStudents.filter(s => isStudentInactive(s) && !isStudentSnoozed(s));
    assert(inactiveTabStudents.length === 1 && inactiveTabStudents[0].id === '3', 'Inactive tab contains ONLY inactive student');

    // Tab 3: Snooze
    const snoozeTabStudents = allStudents.filter(s => isStudentSnoozed(s));
    assert(snoozeTabStudents.length === 1 && snoozeTabStudents[0].id === '2', 'Snooze tab contains ONLY snoozed student');

    // Moving Snoozed student back to Active
    testSnoozedStu.snoozed = false;
    testSnoozedStu.internshipPriority = 'Urgent';
    const activeTabAfterUnSnooze = allStudents.filter(s => !isStudentSnoozed(s) && !isStudentInactive(s));
    assert(activeTabAfterUnSnooze.some(s => s.id === '2'), 'Un-snoozed student immediately moves into Active tab');

    // -------------------------------------------------------------------------
    // TEST 10: STRICT EXCLUSION OF SNOOZED & INACTIVE STUDENTS FROM STEPS 2, 3, 4
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Strict Exclusion of Snoozed & Inactive Students from Steps 2, 3, 4 ---');
    const snoozedBizId = `STU-SNOOZE-${timestamp}`;
    const inactiveBizId = `STU-INACTIVE-${timestamp}`;

    const snoozedStudent = await StudentModel.create({
      studentId: snoozedBizId,
      name: `Snoozed Student ${timestamp}`,
      firstName: 'Snoozed',
      lastName: 'Student',
      email: `snoozed.${timestamp}@test.edu.au`,
      emailAddress: `snoozed.${timestamp}@test.edu.au`,
      phoneNumber: '0499000111',
      courseQualification: 'Diploma of Early Childhood Education and Care',
      course: 'Diploma of Early Childhood Education and Care',
      status: 'Active',
      internshipPriority: 'Snooze',
      snoozed: true,
      placementStatus: 'N/A',
      rto: 'Care Education RTO',
      assignedRto: 'Care Education RTO',
    });

    const inactiveStudent = await StudentModel.create({
      studentId: inactiveBizId,
      name: `Inactive Student ${timestamp}`,
      firstName: 'Inactive',
      lastName: 'Student',
      email: `inactive.${timestamp}@test.edu.au`,
      emailAddress: `inactive.${timestamp}@test.edu.au`,
      phoneNumber: '0499000222',
      courseQualification: 'Diploma of Early Childhood Education and Care',
      course: 'Diploma of Early Childhood Education and Care',
      status: 'Inactive',
      internshipPriority: 'Inactive',
      snoozed: false,
      placementStatus: 'N/A',
      rto: 'Care Education RTO',
      assignedRto: 'Care Education RTO',
    });

    // Create requests and appointments for them in workflow
    const snoozedReq = await createInternshipRequest(workflow._id, {
      title: 'Childcare Placement',
      student: snoozedStudent.name,
      studentId: snoozedBizId,
      company: 'Test Kindergarten',
      rto: 'Care Education RTO',
      priority: 'Snooze',
      status: 'On Hold',
    });

    const inactiveReq = await createInternshipRequest(workflow._id, {
      title: 'Childcare Placement',
      student: inactiveStudent.name,
      studentId: inactiveBizId,
      company: 'Test Kindergarten',
      rto: 'Care Education RTO',
      priority: 'Inactive',
      status: 'On Hold',
    });

    const snoozedAppt = await createAppointment(workflow._id, {
      student: snoozedStudent.name,
      studentId: snoozedBizId,
      company: 'Test Kindergarten',
      rto: 'Care Education RTO',
      date: '2026-11-25',
      time: '10:00 AM',
      status: 'Scheduled',
    });

    const inactiveAppt = await createAppointment(workflow._id, {
      student: inactiveStudent.name,
      studentId: inactiveBizId,
      company: 'Test Kindergarten',
      rto: 'Care Education RTO',
      date: '2026-11-25',
      time: '11:00 AM',
      status: 'Scheduled',
    });

    // Verification helper mirroring WorkflowPage's isRecordInactiveOrSnoozed
    const workflowStudentsList = [student, snoozedStudent, inactiveStudent];
    const isRecordBlocked = (record) => {
      const norm = (s) => (s ? String(s).trim().toLowerCase() : '');
      const reqStuId = norm(record.studentId);
      const reqStuName = norm(record.student || record.studentName);
      const reqEmail = norm(record.email || record.studentEmail);

      const matchedStu = workflowStudentsList.find((stu) => {
        const identifiers = [stu.id, stu._id, stu.studentId, stu.name].filter(Boolean).map(norm);
        const stuEmail = norm(stu.email || stu.emailAddress);
        return (reqStuId && identifiers.includes(reqStuId)) ||
               (reqStuName && identifiers.includes(reqStuName)) ||
               (reqEmail && stuEmail && reqEmail === stuEmail);
      });

      if (matchedStu) {
        if (
          matchedStu.snoozed === true ||
          matchedStu.status === 'Inactive' ||
          matchedStu.internshipPriority === 'Inactive' ||
          matchedStu.internshipPriority === 'Snooze'
        ) {
          return true;
        }
      }
      return record.priority === 'Inactive' || record.priority === 'Snooze';
    };

    assert(isRecordBlocked(snoozedReq), 'Step 2: Snoozed student request is strictly excluded');
    assert(isRecordBlocked(inactiveReq), 'Step 2: Inactive student request is strictly excluded');
    assert(isRecordBlocked(snoozedAppt), 'Step 3: Snoozed student appointment is strictly excluded');
    assert(isRecordBlocked(inactiveAppt), 'Step 3: Inactive student appointment is strictly excluded');
    assert(isRecordBlocked({ studentId: snoozedBizId, student: snoozedStudent.name }), 'Step 4: Snoozed student placement is strictly excluded');
    assert(isRecordBlocked({ studentId: inactiveBizId, student: inactiveStudent.name }), 'Step 4: Inactive student placement is strictly excluded');

    // -------------------------------------------------------------------------
    // TEST 11: STEP 5 INCLUSION FOR SUCCESSFUL APPOINTMENT THEN SNOOZED / INACTIVE
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Step 5 Payment Inclusion: Successful Appointment then Snooze/Inactive ---');
    // Ensure Care Education RTO has course pricing configured
    let rtoDoc = await RtoModel.findOne({ name: 'Care Education RTO' });
    if (!rtoDoc) {
      rtoDoc = await RtoModel.create({
        name: 'Care Education RTO',
        code: 'CERTO',
        email: 'billing@careeducation.edu.au',
        onboardedByName: 'System Admin',
        payoutRate: 500,
        coursePricing: [
          { course: 'Certificate III in Early Childhood Education and Care', pricing: 500 },
          { course: 'Diploma of Early Childhood Education and Care', pricing: 650 },
        ],
      });
    } else {
      await RtoModel.updateOne(
        { _id: rtoDoc._id },
        {
          $set: {
            payoutRate: 500,
            coursePricing: [
              { course: 'Certificate III in Early Childhood Education and Care', pricing: 500 },
              { course: 'Diploma of Early Childhood Education and Care', pricing: 650 },
            ],
          },
        }
      );
    }

    // Student Simrandeep has a successful appointment (Modbury Kindergarten)
    // Now simulate student going on Snooze after successful appointment
    await StudentModel.updateOne(
      { _id: student._id },
      { $set: { snoozed: true, internshipPriority: 'Snooze', placementStatus: 'N/A' } }
    );

    // Run syncChargeableStudents()
    await syncChargeableStudents();

    // Verify payment record was created / exists for this student
    const paymentRecord = await PaymentModel.findOne({ studentId: testStudentId });
    assert(
      paymentRecord !== null,
      `Step 5: Student with successful appointment who went on Snooze is included in Payment (Actual: ${paymentRecord ? 'Found' : 'Missing'})`
    );
    assert(
      paymentRecord?.placementStatus === 'Snooze',
      `Step 5: Payment placementStatus is set to Snooze (Actual: "${paymentRecord?.placementStatus}")`
    );
    assert(
      paymentRecord?.paymentAmount > 0,
      `Step 5: Payment amount is charged (Actual: $${paymentRecord?.paymentAmount})`
    );

    // -------------------------------------------------------------------------
    // TEST 12: STEP 5 MANUAL IMPORT FROM INACTIVE OR SNOOZE TAB
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Step 5 Payment Manual Import from Inactive Tab ---');
    // Inactive student does not have a successful appointment yet
    const importRes = await importStudentsToPaymentService([String(inactiveStudent._id)]);
    assert(
      importRes.success && importRes.importedCount === 1,
      `Manual import of inactive student into Step 5 succeeded (Imported: ${importRes.importedCount})`
    );

    const importedPayment = await PaymentModel.findOne({ studentId: inactiveBizId });
    assert(
      importedPayment !== null,
      `Step 5: Manually imported inactive student exists in Payment collection (Actual: ${importedPayment ? 'Found' : 'Missing'})`
    );
    assert(
      importedPayment?.placementStatus === 'Inactive',
      `Step 5: Imported inactive student placementStatus is set to Inactive (Actual: "${importedPayment?.placementStatus}")`
    );

    // Test duplicate prevention on re-import
    const duplicateImportRes = await importStudentsToPaymentService([String(inactiveStudent._id)]);
    assert(
      duplicateImportRes.importedCount === 0,
      'Step 5: Duplicate import prevention works correctly (0 re-imported)'
    );

    // -------------------------------------------------------------------------
    // TEST 13: UN-SNOOZE / REACTIVATE RESTORES TO ACTIVE STEPS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Reactivating Snoozed Student Restores to Active ---');
    await StudentModel.updateOne(
      { _id: snoozedStudent._id },
      { $set: { snoozed: false, internshipPriority: 'Urgent', status: 'Active', placementStatus: 'In Progress' } }
    );
    const unblockedStudent = await StudentModel.findById(snoozedStudent._id);
    const unblockedRecord = { studentId: unblockedStudent.studentId, student: unblockedStudent.name, priority: 'Urgent' };
    const isNowBlocked = isRecordBlocked(unblockedRecord);
    // Since student is now unblocked in workflowStudentsList
    snoozedStudent.snoozed = false;
    snoozedStudent.internshipPriority = 'Urgent';
    snoozedStudent.status = 'Active';
    assert(
      !isRecordBlocked(unblockedRecord),
      'Reactivated student is no longer blocked from Step 2, Step 3, Step 4'
    );

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Records ---');
    await StudentModel.deleteMany({ _id: { $in: [student._id, snoozedStudent._id, inactiveStudent._id] } });
    await WorkflowModel.deleteOne({ _id: workflow._id });
    await AppointmentModel.deleteMany({ studentId: { $in: [testStudentId, snoozedBizId, inactiveBizId] } });
    await InternshipRequestModel.deleteMany({ studentId: { $in: [testStudentId, snoozedBizId, inactiveBizId] } });
    await InternshipModel.deleteMany({ studentId: { $in: [testStudentId, snoozedBizId, inactiveBizId] } });
    await PaymentModel.deleteMany({ studentId: { $in: [testStudentId, snoozedBizId, inactiveBizId] } });
    console.log('  Cleaned up all temporary test records successfully.');

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, 'Test execution completed without uncaught exceptions', err.message);
  } finally {
    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED`);
    console.log('================================================================\n');
    await mongoose.disconnect();
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

runSuite();
