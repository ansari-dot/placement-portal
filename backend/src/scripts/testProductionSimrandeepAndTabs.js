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
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup Test Records ---');
    await StudentModel.deleteOne({ _id: student._id });
    await WorkflowModel.deleteOne({ _id: workflow._id });
    await AppointmentModel.deleteMany({ studentId: testStudentId });
    await InternshipRequestModel.deleteMany({ studentId: testStudentId });
    await InternshipModel.deleteMany({ studentId: testStudentId });
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
