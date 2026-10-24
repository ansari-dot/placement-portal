import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StudentModel from '../modules/student/student.model.js';
import IndustryModel from '../modules/industry/industry.model.js';
import UserModel from '../modules/user/user.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import AttendanceModel from '../modules/attendance/attendance.model.js';

import { StudentService } from '../modules/student/student.service.js';
import { IndustryService } from '../modules/industry/industry.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UserService } from '../modules/user/user.service.js';
import { AttendanceService } from '../modules/attendance/attendance.service.js';
import { NotFoundError, ForbiddenError } from '../core/errors/AppError.js';

dotenv.config();

let passed = 0;
let failed = 0;
const results = [];

const assert = (condition, description, detail = '') => {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', description });
    console.log(`[PASS] ${description}`);
  } else {
    failed++;
    results.push({ status: 'FAIL', description, detail });
    console.error(`[FAIL] ${description} ${detail ? '-> ' + detail : ''}`);
  }
};

const runSuite = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';
  console.log(`Connecting to MongoDB for Industry Privacy Suite: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const SUITE_TAG = `TEST_IND_PRIVACY_${Date.now()}`;
  console.log(`\n======================================================`);
  console.log(`=== RUNNING INDUSTRY DATA PRIVACY & AUTOCOMPLETE SUITE ===`);
  console.log(`=== Run ID: ${SUITE_TAG} ===`);
  console.log(`======================================================\n`);

  let industryA = null;
  let industryB = null;
  let inactiveIndustry = null;
  let adminUser = null;
  let industryUserA = null;
  let industryUserB = null;
  let studentA = null;
  let studentB = null;
  let workflow = null;
  let attendanceRecordA = null;

  try {
    // -------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------
    console.log('--- Setting up test fixtures ---');

    industryA = await IndustryModel.create({
      name: `Melbourne Health Care ${SUITE_TAG}`,
      code: `MHC${Math.floor(100 + Math.random() * 900)}`,
      sector: 'Aged Care',
      contactPersonName: 'Arthur Dent',
      contactEmail: `mhc_${SUITE_TAG}@testfacility.com`,
      contactPhone: '0398765432',
      address: '100 Collins Street',
      suburb: 'Melbourne',
      state: 'VIC',
      postCode: '3000',
      location: '100 Collins Street, Melbourne, VIC',
      status: 'Active',
      industryCategory: 'Partner',
    });

    industryB = await IndustryModel.create({
      name: `Sydney Coastal Hospital ${SUITE_TAG}`,
      code: `SCH${Math.floor(100 + Math.random() * 900)}`,
      sector: 'Disability',
      contactPersonName: 'Ford Prefect',
      contactEmail: `sch_${SUITE_TAG}@testfacility.com`,
      contactPhone: '0298765432',
      address: '200 George Street',
      suburb: 'Sydney',
      state: 'NSW',
      postCode: '2000',
      location: '200 George Street, Sydney, NSW',
      status: 'Active',
      industryCategory: 'Partner',
    });

    inactiveIndustry = await IndustryModel.create({
      name: `Inactive Wellness Facility ${SUITE_TAG}`,
      code: `IWF${Math.floor(100 + Math.random() * 900)}`,
      sector: 'Mental Health',
      contactPersonName: 'Tricia McMillan',
      contactEmail: `iwf_${SUITE_TAG}@testfacility.com`,
      contactPhone: '0898765432',
      address: '50 Terrace Road',
      suburb: 'Perth',
      state: 'WA',
      postCode: '6000',
      location: '50 Terrace Road, Perth, WA',
      status: 'Inactive',
      industryCategory: 'Random',
    });

    adminUser = await UserModel.create({
      name: `Admin Industry Tester ${SUITE_TAG}`,
      email: `admin_ind_${SUITE_TAG}@mantis.com`,
      password: 'Password@123',
      role: 'Administrator',
      status: 'Active',
      approved: true,
    });

    studentA = await StudentModel.create({
      firstName: 'PlacementA',
      lastName: `Candidate_${SUITE_TAG}`,
      studentId: `STU_INDA_${Date.now()}`,
      emailAddress: `stu_inda_${SUITE_TAG}@portal.com`,
      phoneNumber: '0411000111',
      courseQualification: 'Certificate IV in Disability',
      studentType: 'Independent Student',
      placementSite: [industryA.name],
      placementStatus: 'In Progress',
    });

    studentB = await StudentModel.create({
      firstName: 'PlacementB',
      lastName: `Candidate_${SUITE_TAG}`,
      studentId: `STU_INDB_${Date.now()}`,
      emailAddress: `stu_indb_${SUITE_TAG}@portal.com`,
      phoneNumber: '0422000222',
      courseQualification: 'Certificate III in Individual Support',
      studentType: 'Independent Student',
      placementSite: [industryB.name],
      placementStatus: 'Appointment Scheduled',
    });

    // Workflow with appointment at Industry A for Student A, and at Industry B for Student B
    workflow = await WorkflowModel.create({
      name: `Workflow ${SUITE_TAG}`,
      academicYear: 2026,
      students: [studentA._id, studentB._id],
      appointments: [
        {
          title: 'Disability Care Orientation',
          studentId: studentA.studentId,
          student: `${studentA.firstName} ${studentA.lastName}`,
          company: industryA.name,
          rto: 'Test RTO College',
          date: '2026-11-10',
          time: '09:00 AM',
          status: 'Confirmed',
        },
        {
          title: 'Individual Support Orientation',
          studentId: studentB.studentId,
          student: `${studentB.firstName} ${studentB.lastName}`,
          company: industryB.name,
          rto: 'Test RTO College',
          date: '2026-11-12',
          time: '10:00 AM',
          status: 'Scheduled',
        },
      ],
      internships: [
        {
          title: 'Disability Care Placement',
          intId: `INT_A_${Date.now()}`,
          studentId: studentA.studentId,
          student: `${studentA.firstName} ${studentA.lastName}`,
          company: industryA.name,
          rto: 'Test RTO College',
          start: '2026-11-15',
          end: '2026-12-15',
          status: 'Active',
        },
      ],
    });


    // =============================================================
    // SECTION 1: AUTOCOMPLETE 50% NAME RULE & PRIVACY ENFORCEMENT
    // =============================================================
    console.log('\n--- SECTION 1: Industry Autocomplete 50% Rule & Privacy ---');

    // 1.1 Query with < 3 characters must return empty list []
    const ac1 = await IndustryService.autocompleteIndustries('M');
    assert(Array.isArray(ac1) && ac1.length === 0, '1.1 Autocomplete query of 1 char returns empty array []');

    const ac2 = await IndustryService.autocompleteIndustries('Me');
    assert(Array.isArray(ac2) && ac2.length === 0, '1.2 Autocomplete query of 2 chars returns empty array []');

    const acSpaces = await IndustryService.autocompleteIndustries('   ');
    assert(Array.isArray(acSpaces) && acSpaces.length === 0, '1.3 Blank whitespace autocomplete returns empty array []');

    // 1.2 Query with < 50% of the distinctive token / name must return []
    // "Melbourne Health Care" token "Melbourne" (len 9) -> 50% is 5 chars.
    // Query "Mel" (len 3) is < 50% of 9 -> must not match Melbourne
    const acShort = await IndustryService.autocompleteIndustries('Mel');
    const matchedShort = acShort.find((i) => i._id.toString() === industryA._id.toString());
    assert(!matchedShort, '1.4 Query "Mel" (3 chars < 50% of "Melbourne") does not match "Melbourne Health Care"');

    // Query "Melb" (len 4 < 50% of 9)
    const acMelb = await IndustryService.autocompleteIndustries('Melb');
    const matchedMelb = acMelb.find((i) => i._id.toString() === industryA._id.toString());
    assert(!matchedMelb, '1.5 Query "Melb" (4 chars < 50% of 9) does not match "Melbourne Health Care"');

    // Query "Melbo" (len 5 >= 50% of 9) -> MUST match!
    const acMelbo = await IndustryService.autocompleteIndustries('Melbo');
    const matchedMelbo = acMelbo.find((i) => i._id.toString() === industryA._id.toString());
    assert(Boolean(matchedMelbo), '1.6 Query "Melbo" (5 chars >= 50% of "Melbourne") successfully matches');

    // Matching full token "Melbourne"
    const acFull = await IndustryService.autocompleteIndustries('Melbourne');
    const matchedFull = acFull.find((i) => i._id.toString() === industryA._id.toString());
    assert(Boolean(matchedFull), '1.7 Query "Melbourne" (full word token) successfully matches');

    // 1.3 Safe projection check: strictly non-confidential public fields only
    if (matchedFull) {
      assert(matchedFull._id && matchedFull.name, '1.8 Match includes _id and name');
      assert(!matchedFull.contactEmail, '1.9 Contact email is NOT exposed in autocomplete response');
      assert(!matchedFull.contactPhone, '1.10 Contact phone is NOT exposed in autocomplete response');
      assert(!matchedFull.contactPersonName, '1.11 Contact person name is NOT exposed in autocomplete response');
      assert(!matchedFull.abn, '1.12 ABN is NOT exposed in autocomplete response');
    }

    // 1.4 Inactive industries must not appear in autocomplete
    const acInactive = await IndustryService.autocompleteIndustries('Inactive Wellness');
    const foundInactive = acInactive.find((i) => i._id.toString() === inactiveIndustry._id.toString());
    assert(!foundInactive, '1.13 Inactive industry is excluded from public autocomplete suggestions');

    // 1.5 Bounded results: max 8
    assert(acFull.length <= 8, '1.14 Autocomplete results are strictly bounded to maximum 8 items');

    // =============================================================
    // SECTION 2: INDUSTRY REGISTRATION & AUTO-BINDING
    // =============================================================
    console.log('\n--- SECTION 2: Industry Public Signup & Tenant Auto-Binding ---');

    const signupResultA = await AuthService.signup({
      name: `Manager Facility A ${SUITE_TAG}`,
      email: `mgr_fac_a_${SUITE_TAG}@testindustry.com`,
      password: 'FacilityPassword@123',
      role: 'Industry',
      facilityName: industryA.name,
      phone: '0433111222',
    });

    assert(signupResultA && signupResultA._id, '2.1 Industry signup creates user successfully');
    assert(signupResultA.status === 'Pending', '2.2 New industry user status defaults to Pending');
    assert(signupResultA.approved === false, '2.3 New industry user approved flag defaults to false');
    assert(signupResultA.role === 'Industry', '2.4 Canonical role is Industry');
    assert(
      signupResultA.industryId && signupResultA.industryId.toString() === industryA._id.toString(),
      '2.5 Industry signup auto-binds matching industryId'
    );
    assert(
      signupResultA.facilityName === industryA.name,
      '2.6 Industry signup auto-binds canonical facilityName'
    );

    // Signup for Industry B
    const signupResultB = await AuthService.signup({
      name: `Manager Facility B ${SUITE_TAG}`,
      email: `mgr_fac_b_${SUITE_TAG}@testindustry.com`,
      password: 'FacilityPassword@123',
      role: 'Industry',
      facilityName: industryB.name,
      phone: '0444222333',
    });

    industryUserA = signupResultA;
    industryUserB = signupResultB;

    // Approve both users via Administrator
    const approvedUserA = await UserService.approveUser(signupResultA._id, adminUser);

    assert(approvedUserA.status === 'Active' && approvedUserA.approved === true, '2.7 Admin approval activates Industry User A');
    assert(
      approvedUserA.industryId && approvedUserA.industryId.toString() === industryA._id.toString(),
      '2.8 Approved Industry User A retains bound industryId'
    );

    const approvedUserB = await UserService.approveUser(signupResultB._id, adminUser);
    assert(approvedUserB.status === 'Active' && approvedUserB.approved === true, '2.9 Admin approval activates Industry User B');

    industryUserA = await UserModel.findById(signupResultA._id);
    industryUserB = await UserModel.findById(signupResultB._id);

    // =============================================================
    // SECTION 3: STRICT DATA ISOLATION & STUDENT SCOPING
    // =============================================================
    console.log('\n--- SECTION 3: Strict Industry Student Data Isolation ---');

    // 3.1 Industry User A gets all students: must see only Student A
    const studentsForA = await StudentService.getAllStudents(industryUserA);
    const hasStudentAInA = studentsForA.some((s) => s.studentId === studentA.studentId);
    const hasStudentBInA = studentsForA.some((s) => s.studentId === studentB.studentId);

    assert(hasStudentAInA, '3.1 Industry User A sees placed Student A');
    assert(!hasStudentBInA, '3.2 Industry User A CANNOT see Student B (placed at Industry B)');

    // 3.2 Industry User B gets all students: must see only Student B
    const studentsForB = await StudentService.getAllStudents(industryUserB);
    const hasStudentAInB = studentsForB.some((s) => s.studentId === studentA.studentId);
    const hasStudentBInB = studentsForB.some((s) => s.studentId === studentB.studentId);

    assert(hasStudentBInB, '3.3 Industry User B sees placed Student B');
    assert(!hasStudentAInB, '3.4 Industry User B CANNOT see Student A (placed at Industry A)');

    // 3.3 Direct ID access by Industry User A to Student A succeeds
    const directA = await StudentService.getStudentById(studentA._id, industryUserA);
    assert(directA && directA.studentId === studentA.studentId, '3.5 Direct getStudentById for own placed student succeeds');

    // 3.4 Direct ID access by Industry User A to foreign Student B returns 404 (non-disclosing)
    let foreignAccessBlocked = false;
    try {
      await StudentService.getStudentById(studentB._id, industryUserA);
    } catch (err) {
      if (err instanceof NotFoundError) {
        foreignAccessBlocked = true;
      }
    }
    assert(foreignAccessBlocked, '3.6 Direct getStudentById on foreign student returns 404 Not Found');

    // =============================================================
    // SECTION 4: STRICT INDUSTRY ATTENDANCE ISOLATION
    // =============================================================
    console.log('\n--- SECTION 4: Strict Industry Attendance Isolation ---');

    // 4.1 Industry User A creates attendance for Student A: succeeds
    attendanceRecordA = await AttendanceService.createAttendance(
      {
        student: studentA._id,
        date: '2026-11-16',
        startTime: '09:00 AM',
        finishTime: '05:00 PM',
        breakMinutes: 30,
        status: 'Present',
        notes: 'Great performance on morning orientation shift',
      },
      industryUserA
    );

    assert(Boolean(attendanceRecordA?._id), '4.1 Industry User A creates attendance for own student successfully');
    assert(attendanceRecordA.totalHours === 7.5, '4.2 Server computes exact attendance hours deducting breaks (8.0 - 0.5 = 7.5)');
    assert(attendanceRecordA.facilityName === industryA.name, '4.3 Attendance record bound to Industry A facility name');

    // 4.2 Industry User A attempts to create attendance for Student B (Industry B): blocked with ForbiddenError
    let crossAttendanceCreateBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentB._id,
          date: '2026-11-16',
          startTime: '09:00 AM',
          finishTime: '05:00 PM',
        },
        industryUserA
      );
    } catch (err) {
      if (err instanceof ForbiddenError) {
        crossAttendanceCreateBlocked = true;
      }
    }
    assert(crossAttendanceCreateBlocked, '4.4 Industry User A blocked (403) from creating attendance for foreign student');

    // 4.3 Industry User A lists attendance: sees record A
    const attendanceListA = await AttendanceService.getAllAttendance({}, industryUserA);
    const hasRecordAInA = attendanceListA.some((rec) => rec._id.toString() === attendanceRecordA._id.toString());
    assert(hasRecordAInA, '4.5 Industry User A sees own facility attendance record');

    // 4.4 Industry User B lists attendance: CANNOT see record A
    const attendanceListB = await AttendanceService.getAllAttendance({}, industryUserB);
    const hasRecordAInB = attendanceListB.some((rec) => rec._id.toString() === attendanceRecordA._id.toString());
    assert(!hasRecordAInB, '4.6 Industry User B CANNOT see Industry A attendance records');

    // 4.5 Industry User B attempts to update Industry A's attendance record: blocked with 404
    let crossUpdateBlocked = false;
    try {
      await AttendanceService.updateAttendance(
        attendanceRecordA._id,
        { status: 'Absent', notes: 'Tampered note' },
        industryUserB
      );
    } catch (err) {
      if (err instanceof NotFoundError) {
        crossUpdateBlocked = true;
      }
    }
    assert(crossUpdateBlocked, '4.7 Industry User B blocked (404) from updating Industry A attendance record');

    // 4.6 Industry User B attempts to delete Industry A's attendance record: blocked with 404
    let crossDeleteBlocked = false;
    try {
      await AttendanceService.deleteAttendance(attendanceRecordA._id, industryUserB);
    } catch (err) {
      if (err instanceof NotFoundError) {
        crossDeleteBlocked = true;
      }
    }
    assert(crossDeleteBlocked, '4.8 Industry User B blocked (404) from deleting Industry A attendance record');

  } catch (error) {
    console.error('Fatal test error in Industry Privacy Suite:', error);
    assert(false, 'Test suite ran without unexpected errors', error.message);
  } finally {
    console.log('\n--- Cleaning up test fixtures ---');
    try {
      if (attendanceRecordA?._id) await AttendanceModel.deleteOne({ _id: attendanceRecordA._id });
      if (workflow?._id) await WorkflowModel.deleteOne({ _id: workflow._id });
      if (studentA?._id) await StudentModel.deleteOne({ _id: studentA._id });
      if (studentB?._id) await StudentModel.deleteOne({ _id: studentB._id });
      if (industryUserA?._id) await UserModel.deleteOne({ _id: industryUserA._id });
      if (industryUserB?._id) await UserModel.deleteOne({ _id: industryUserB._id });
      if (adminUser?._id) await UserModel.deleteOne({ _id: adminUser._id });
      if (industryA?._id) await IndustryModel.deleteOne({ _id: industryA._id });
      if (industryB?._id) await IndustryModel.deleteOne({ _id: industryB._id });
      if (inactiveIndustry?._id) await IndustryModel.deleteOne({ _id: inactiveIndustry._id });
      console.log('Cleaned up test fixtures.');
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }

    await mongoose.disconnect();

    console.log('\n======================================================');
    console.log(`=== INDUSTRY PRIVACY SUITE COMPLETED ===`);
    console.log(`Passed: ${passed} | Failed: ${failed}`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
};

runSuite();
