/**
 * Automated Live End-to-End Test Suite for Student Portal & Dynamic Status Transitions
 * 
 * Verifies the complete student lifecycle across all 5 stages over real HTTP requests:
 * - Stage 1: Enrolled / Awaiting
 * - Stage 2: Placement Request Created / In Progress
 * - Stage 3: Interview / Appointment Scheduled
 * - Stage 3.5: Appointment Outcome Successful (Commencement Date confirmed)
 * - Stage 4: Internship Commenced / Placement Started
 * - Stage 4.5: Attendance Logbook & Dynamic Hours Logged
 * - Stage 5: Placement Completed (100% Progress)
 * - Strict RBAC & Data Isolation verification (Student sees ONLY their own records & shifts)
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import UserModel from '../modules/user/user.model.js';
import StudentModel from '../modules/student/student.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import AttendanceModel from '../modules/attendance/attendance.model.js';

dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portal';

const results = [];
function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${testName} ${details ? `(${details})` : ''}`);
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runStudentPortalSuite() {
  console.log('================================================================');
  console.log('🚀 STARTING STUDENT PORTAL & DYNAMIC STATUS END-TO-END TEST SUITE');
  console.log(`📡 Target HTTP API: ${BASE_URL}`);
  console.log(`📦 MongoDB URI: ${MONGO_URI}`);
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);

  const cleanups = {
    users: [],
    students: [],
    workflows: [],
    attendances: [],
  };

  try {
    const timestamp = Date.now();
    const SUITE_TAG = `STU_SUITE_${timestamp}`;
    const studentFirstName = `Alex${timestamp.toString().slice(-4)}`;
    const studentLastName = `Turner${timestamp.toString().slice(-4)}`;
    const studentFullName = `${studentFirstName} ${studentLastName}`;

    // ── STEP 1: AUTHENTICATE AS ADMIN & SETUP ROLES ────────────────────────────
    console.log('--- Step 1: Initialize Test Roles & Authenticated Tokens ---');
    const adminUser = await UserModel.create({
      name: 'Super Admin',
      email: `admin_${SUITE_TAG}@portal.com`,
      role: 'Administrator',
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(adminUser._id);
    const tokenAdmin = jwt.sign({ id: adminUser._id, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });
    recordResult('Admin Setup & Token Generation', Boolean(tokenAdmin), `Admin ID: ${adminUser._id}`);

    // Create Student User 1
    const studentUser1 = await UserModel.create({
      name: studentFullName,
      email: `alex_${SUITE_TAG}@testportal.edu`,
      role: 'Student',
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(studentUser1._id);
    const tokenStudent1 = jwt.sign({ id: studentUser1._id, role: studentUser1.role, email: studentUser1.email }, JWT_SECRET, { expiresIn: '1h' });

    // Create Student User 2 (for strict RBAC boundary checks)
    const studentUser2 = await UserModel.create({
      name: `Chloe${timestamp.toString().slice(-4)} Smith${timestamp.toString().slice(-4)}`,
      email: `chloe_${SUITE_TAG}@testportal.edu`,
      role: 'Student',
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(studentUser2._id);
    const tokenStudent2 = jwt.sign({ id: studentUser2._id, role: studentUser2.role, email: studentUser2.email }, JWT_SECRET, { expiresIn: '1h' });
    recordResult('Student Users Initialized', Boolean(tokenStudent1 && tokenStudent2), 'Tokens signed');

    // ── STEP 2: CREATE STUDENT 1 PROFILE VIA HTTP POST ─────────────────────────
    console.log('\n--- Step 2: Create Student Profile via Admin HTTP API ---');
    const studentStuId = `STU-TEST-${timestamp.toString().slice(-4)}`;
    const createStuRes = await request('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        firstName: studentFirstName,
        lastName: studentLastName,
        name: studentFullName,
        emailAddress: studentUser1.email,
        phoneNumber: '0412345678',
        studentId: studentStuId,
        studentType: 'RTO Student',
        assignedRto: 'Global Institute of Health',
        courseQualification: 'Diploma of Community Services',
        courseLevel: 'Diploma',
        placementStatus: 'Awaiting',
        placementHours: 120
      })
    });

    if (!createStuRes.ok) {
      throw new Error(`Failed to create student via HTTP: ${createStuRes.data?.message || createStuRes.status}`);
    }
    const studentDoc1 = createStuRes.data.data;
    const studentDbId = studentDoc1.id || studentDoc1._id;
    cleanups.students.push(studentDbId);
    recordResult('Create Student Record (Admin)', true, `Student ID: ${studentStuId}, Status: Awaiting`);

    // Create Student 2 Profile
    const createStu2Res = await request('/students', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        firstName: `Chloe${timestamp.toString().slice(-4)}`,
        lastName: `Smith${timestamp.toString().slice(-4)}`,
        name: `Chloe${timestamp.toString().slice(-4)} Smith${timestamp.toString().slice(-4)}`,
        emailAddress: studentUser2.email,
        phoneNumber: '0498765432',
        studentId: `STU-OTHER-${timestamp.toString().slice(-4)}`,
        studentType: 'RTO Student',
        assignedRto: 'Elite Care Academy',
        courseQualification: 'Certificate IV in Ageing Support',
        courseLevel: 'Certificate IV',
        placementStatus: 'Awaiting',
        placementHours: 120
      })
    });
    const student2DbId = createStu2Res.data?.data?.id || createStu2Res.data?.data?._id;
    cleanups.students.push(student2DbId);

    // ── STEP 3: STAGE 1 - ENROLLED / AWAITING VERIFICATION ────────────────────
    console.log('\n--- Step 3: Verify Stage 1 (Enrolled / Awaiting Scoping) ---');
    const stuProfileRes = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const myStudentsList = stuProfileRes.data?.data || stuProfileRes.data || [];
    const isStage1Isolated = Array.isArray(myStudentsList) && myStudentsList.length === 1 && myStudentsList[0].emailAddress === studentUser1.email;
    recordResult(
      'Stage 1: Student Scoped Profile & Awaiting Status',
      isStage1Isolated && myStudentsList[0].placementStatus === 'Awaiting',
      `Found ${myStudentsList.length} student record, status: ${myStudentsList[0]?.placementStatus}`
    );

    // ── STEP 4: STAGE 2 - ADMIN CREATES WORKFLOW REQUEST ──────────────────────
    console.log('\n--- Step 4: Verify Stage 2 (Requests / Outreach) ---');
    const getWfRes = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenAdmin}` }
    });
    const workflows = getWfRes.data?.data || getWfRes.data || [];
    let workflowId = workflows[0]?.id || workflows[0]?._id;

    if (!workflowId) {
      const newWf = await request('/workflows', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({
          name: `Nursing & Community Services ${SUITE_TAG}`,
          title: `Nursing & Community Services ${SUITE_TAG}`,
          status: 'Active',
          rto: 'Global Institute of Health'
        })
      });
      workflowId = newWf.data?.data?.id || newWf.data?.data?._id;
      cleanups.workflows.push(workflowId);
    }

    const createReqRes = await request(`/workflows/${workflowId}/requests`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        title: 'Community Services Practical Placement',
        student: studentFullName,
        studentId: studentDoc1.studentId,
        company: 'Sunny Care Aged Care Facility',
        rto: 'Global Institute of Health',
        priority: 'Urgent',
        workType: 'Disability & Aged Care Support',
        duration: '120 Hours',
        location: 'Metropolitan Adelaide',
        status: 'New'
      })
    });
    if (!createReqRes.ok) console.error('Create Request Error:', createReqRes.data);
    recordResult('Admin Creates Placement Request', createReqRes.ok, `Status: ${createReqRes.status}`);

    // Verify Student 1 receives this request
    const stuWfResStage2 = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuWfs2 = stuWfResStage2.data?.data || stuWfResStage2.data || [];
    const studentRequests = (stuWfs2[0]?.requests || []).filter(
      r => r.studentId === studentDoc1.studentId || r.student === 'Alex Turner'
    );
    recordResult(
      'Stage 2: Student Receives Application Request in Real Time',
      studentRequests.length > 0 && studentRequests[0].priority === 'Urgent',
      `Found ${studentRequests.length} request(s), Priority: ${studentRequests[0]?.priority}`
    );

    // Verify student placementStatus updated in DB to 'In Progress'
    const stuProfileRes2 = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const currentStu2 = (stuProfileRes2.data?.data || [])[0];
    recordResult(
      'Stage 2: Student Profile Status Updated to In Progress',
      currentStu2?.placementStatus === 'In Progress',
      `placementStatus is: ${currentStu2?.placementStatus}`
    );

    // ── STEP 5: STAGE 3 - ADMIN SCHEDULES INTERVIEW / APPOINTMENT ─────────────
    console.log('\n--- Step 5: Verify Stage 3 (Interview / Appointment Scheduled) ---');
    const createAppointmentRes = await request(`/workflows/${workflowId}/appointments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        student: studentFullName,
        studentId: studentDoc1.studentId,
        rto: 'Global Institute of Health',
        company: 'Sunny Care Aged Care Facility',
        position: 'Community Care Trainee',
        meetingType: 'In-Person',
        date: '2026-11-10',
        time: '10:00 AM',
        interviewer: 'Sarah Jenkins',
        location: 'Level 2, 45 Flinders St, Adelaide',
        status: 'Confirmed'
      })
    });
    if (!createAppointmentRes.ok) console.error('Create Appt Error:', createAppointmentRes.data);
    recordResult('Admin Schedules Interview Appointment', createAppointmentRes.ok, `Status: ${createAppointmentRes.status}`);

    const stuWfResStage3 = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuWfs3 = stuWfResStage3.data?.data || stuWfResStage3.data || [];
    const studentAppointments = (stuWfs3[0]?.appointments || []).filter(
      a => a.studentId === studentDoc1.studentId || a.student === studentFullName
    );
    const appointmentDoc = studentAppointments[0];
    const appointmentId = appointmentDoc?.id || appointmentDoc?._id;
    recordResult(
      'Stage 3: Student Sees Scheduled Interview Details',
      Boolean(appointmentDoc && appointmentDoc.company === 'Sunny Care Aged Care Facility'),
      `Company: ${appointmentDoc?.company}, Date: ${appointmentDoc?.date}`
    );

    // Verify student placementStatus updated in DB to 'Appointment Scheduled'
    const stuProfileRes3 = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const currentStu3 = (stuProfileRes3.data?.data || [])[0];
    recordResult(
      'Stage 3: Student Profile Status Updated to Appointment Scheduled',
      currentStu3?.placementStatus === 'Appointment Scheduled',
      `placementStatus is: ${currentStu3?.placementStatus}`
    );

    // ── STEP 6: STAGE 3.5 - APPOINTMENT OUTCOME SUCCESSFUL ─────────────────────
    console.log('\n--- Step 6: Verify Stage 3.5 (Appointment Outcome: Successful) ---');
    const updateOutcomeRes = await request(`/workflows/${workflowId}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        appointmentOutcome: 'successful',
        commencementDate: '2026-11-15',
        expectedCompletionDate: '2026-12-20',
        notes: 'Excellent candidate, passed initial orientation.'
      })
    });
    if (!updateOutcomeRes.ok) console.error('Update Appt Outcome Error:', updateOutcomeRes.data);
    recordResult('Admin Updates Appointment Outcome to Successful', updateOutcomeRes.ok, `Status: ${updateOutcomeRes.status}`);

    const stuWfResStage35 = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuWfs35 = stuWfResStage35.data?.data || stuWfResStage35.data || [];
    const updatedAppt = (stuWfs35[0]?.appointments || []).find(a => (a.id || a._id) === appointmentId);
    recordResult(
      'Stage 3.5: Student Sees Confirmed Outcome & Start Date',
      updatedAppt?.appointmentOutcome === 'successful' && updatedAppt?.commencementDate === '2026-11-15',
      `Outcome: ${updatedAppt?.appointmentOutcome}, Start: ${updatedAppt?.commencementDate}`
    );

    // ── STEP 7: STAGE 4 - PLACEMENT COMMENCED / INTERNSHIP CREATED ────────────
    console.log('\n--- Step 7: Verify Stage 4 (Active Practical Placement) ---');
    const createInternRes = await request(`/workflows/${workflowId}/internships`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        student: studentFullName,
        studentId: studentDoc1.studentId,
        rto: 'Global Institute of Health',
        company: 'Sunny Care Aged Care Facility',
        title: 'Community Care Practical Placement',
        coordinator: 'Placement Team Admin',
        start: '2026-11-15',
        end: '2026-12-20',
        location: 'Level 2, 45 Flinders St, Adelaide',
        duration: '120 Hours',
        progress: 0,
        status: 'Placement Started'
      })
    });
    if (!createInternRes.ok) console.error('Create Intern Error:', createInternRes.data);
    recordResult('Admin Creates Active Internship', createInternRes.ok, `Status: ${createInternRes.status}`);

    const stuWfResStage4 = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuWfs4 = stuWfResStage4.data?.data || stuWfResStage4.data || [];
    const studentInternships = (stuWfs4[0]?.internships || []).filter(
      i => i.studentId === studentDoc1.studentId || i.student === studentFullName
    );
    const internDoc = studentInternships[0];
    const internId = internDoc?.id || internDoc?._id;
    recordResult(
      'Stage 4: Student Sees Commenced Internship',
      Boolean(internDoc && internDoc.status === 'Placement Started'),
      `Status: ${internDoc?.status}, Facility: ${internDoc?.company}`
    );

    const stuProfileRes4 = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const currentStu4 = (stuProfileRes4.data?.data || [])[0];
    recordResult(
      'Stage 4: Student Profile Status is Placement Started',
      currentStu4?.placementStatus === 'Placement Started',
      `placementStatus is: ${currentStu4?.placementStatus}`
    );

    // ── STEP 8: STAGE 4.5 - ATTENDANCE LOGBOOK & DYNAMIC HOURS ────────────────
    console.log('\n--- Step 8: Verify Stage 4.5 (Dynamic Attendance Logbook Shifts & Hours) ---');
    // Log Shift 1: 8 hrs
    const logShift1 = await request('/attendance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        student: studentDbId,
        studentId: studentDoc1.studentId,
        facilityName: 'Sunny Care Aged Care Facility',
        date: '2026-11-16',
        startTime: '08:30 AM',
        finishTime: '05:00 PM',
        breakMinutes: 30, // 8.5h - 0.5h = 8h
        status: 'Present',
        notes: 'Assisted with morning resident routine.'
      })
    });
    cleanups.attendances.push(logShift1.data?.data?.id || logShift1.data?.data?._id);
    recordResult('Log Shift 1 (8.0 Hours)', logShift1.ok, `Calculated Hours: ${logShift1.data?.data?.totalHours}`);

    // Log Shift 2: 7.5 hrs
    const logShift2 = await request('/attendance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        student: studentDbId,
        studentId: studentDoc1.studentId,
        facilityName: 'Sunny Care Aged Care Facility',
        date: '2026-11-17',
        startTime: '09:00 AM',
        finishTime: '05:00 PM',
        breakMinutes: 30, // 8h - 0.5h = 7.5h
        status: 'Present',
        notes: 'Handover report and clinical documentation.'
      })
    });
    cleanups.attendances.push(logShift2.data?.data?.id || logShift2.data?.data?._id);
    recordResult('Log Shift 2 (7.5 Hours)', logShift2.ok, `Calculated Hours: ${logShift2.data?.data?.totalHours}`);

    // Log Shift for Student 2 (Chloe) to verify strict RBAC data isolation
    const logOtherShift = await request('/attendance', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        student: student2DbId,
        studentId: `STU-OTHER-${timestamp.toString().slice(-4)}`,
        facilityName: 'Other Facility Ltd',
        date: '2026-11-16',
        startTime: '09:00 AM',
        finishTime: '05:00 PM',
        breakMinutes: 0,
        status: 'Present',
        notes: 'Private other student shift.'
      })
    });
    cleanups.attendances.push(logOtherShift.data?.data?.id || logOtherShift.data?.data?._id);

    // Query attendance as Student 1 (Alex)
    const stuAttendanceRes = await request('/attendance', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuAttList = stuAttendanceRes.data?.data || stuAttendanceRes.data || [];
    const totalStuHours = stuAttList.reduce((acc, r) => acc + (Number(r.totalHours) || 0), 0);
    const noOtherStudentRecords = stuAttList.every(r => r.studentId === studentDoc1.studentId || (r.studentName && r.studentName.includes(studentFirstName)));

    recordResult(
      'Stage 4.5: Student Attendance Dynamic Hours Aggregation',
      stuAttList.length === 2 && totalStuHours === 15.5 && noOtherStudentRecords,
      `Received ${stuAttList.length} shifts, Total verified hours: ${totalStuHours} (Expected: 15.5)`
    );

    // Query attendance as Student 2 (Chloe) - MUST NOT see Alex's records
    const otherAttRes = await request('/attendance', {
      headers: { Authorization: `Bearer ${tokenStudent2}` }
    });
    const otherAttList = otherAttRes.data?.data || otherAttRes.data || [];
    recordResult(
      'Strict RBAC Isolation: Student 2 Cannot See Alex\'s Shifts',
      otherAttList.length === 1 && otherAttList[0].studentName.includes('Chloe'),
      `Student 2 sees ${otherAttList.length} shift(s)`
    );

    // ── STEP 9: STAGE 5 - PLACEMENT COMPLETED ─────────────────────────────────
    console.log('\n--- Step 9: Verify Stage 5 (Placement Completed) ---');
    const completeInternRes = await request(`/workflows/${workflowId}/internships/${internId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: JSON.stringify({
        status: 'Placement Completed',
        progress: 100
      })
    });
    if (!completeInternRes.ok) console.error('Complete Intern Error:', completeInternRes.data);
    recordResult('Admin Marks Placement Completed', completeInternRes.ok, `Status: ${completeInternRes.status}`);

    const stuWfResStage5 = await request('/workflows', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const stuWfs5 = stuWfResStage5.data?.data || stuWfResStage5.data || [];
    const finishedIntern = (stuWfs5[0]?.internships || []).find(i => (i.id || i._id) === internId);
    recordResult(
      'Stage 5: Student Sees Placement Completed & 100% Progress',
      ['Placement Completed', 'Completed'].includes(finishedIntern?.status) && finishedIntern?.progress === 100,
      `Status: ${finishedIntern?.status}, Progress: ${finishedIntern?.progress}%`
    );

    const stuProfileRes5 = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const currentStu5 = (stuProfileRes5.data?.data || [])[0];
    recordResult(
      'Stage 5: Student Profile Status is Placement Completed',
      ['Placement Completed', 'Completed'].includes(currentStu5?.placementStatus),
      `placementStatus is: ${currentStu5?.placementStatus}`
    );

    // ── STEP 10: STUDENT PROFILE UPDATES & SUPPORT TICKETS ────────────────────
    console.log('\n--- Step 10: Student Profile Update & Support Ticket ---');
    const updateProfileRes = await request(`/students/${studentDbId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokenStudent1}` },
      body: JSON.stringify({
        address: '100 King William Street',
        suburb: 'Adelaide',
        state: 'SA',
        postCode: '5000',
        transport: 'Own Car',
        licenceNumber: 'SA-DRV-998811'
      })
    });
    if (!updateProfileRes.ok) console.error('Update Profile Error:', updateProfileRes.data);
    recordResult('Student Updates Personal Enrolment Record', updateProfileRes.ok, `Status: ${updateProfileRes.status}`);

    const verifyUpdateRes = await request('/students', {
      headers: { Authorization: `Bearer ${tokenStudent1}` }
    });
    const updatedRecord = (verifyUpdateRes.data?.data || [])[0];
    recordResult(
      'Student Enrolment Details Persisted',
      updatedRecord?.address === '100 King William Street' && updatedRecord?.licenceNumber === 'SA-DRV-998811',
      `Address: ${updatedRecord?.address}, Transport: ${updatedRecord?.transport}`
    );

    // Support ticket submission
    const supportTicketRes = await request('/auth/support-ticket', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudent1}` },
      body: JSON.stringify({
        subject: 'Logbook Hour Verification Question',
        category: 'Attendance & Logbook',
        message: 'Could my coordinator confirm if weekend shifts are verified at standard rates?'
      })
    });
    recordResult('Student Submits Help & Support Ticket', supportTicketRes.ok, `Status: ${supportTicketRes.status}`);

  } catch (err) {
    console.error('Fatal test error:', err);
    recordResult('Fatal Execution Error', false, err.message);
  } finally {
    // Clean up created test entities
    console.log('\n--- Cleaning Up Test Data ---');
    if (cleanups.users.length) await UserModel.deleteMany({ _id: { $in: cleanups.users } });
    if (cleanups.students.length) await StudentModel.deleteMany({ _id: { $in: cleanups.students } });
    if (cleanups.workflows.length) await WorkflowModel.deleteMany({ _id: { $in: cleanups.workflows } });
    if (cleanups.attendances.length) await AttendanceModel.deleteMany({ _id: { $in: cleanups.attendances } });
    await mongoose.disconnect();
    console.log('Test database entities cleaned up successfully.');
  }

  console.log('\n================================================================');
  console.log('📊 FINAL TEST RESULTS SUMMARY');
  console.log('================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${failedCount}`);
  if (failedCount === 0) {
    console.log('\n🎉 ALL STUDENT PORTAL FEATURES & DYNAMIC STATUSES VERIFIED 100% WORKING!\n');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED. PLEASE REVIEW DETAILS ABOVE.\n');
  }
}

runStudentPortalSuite();
