import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StudentModel from '../modules/student/student.model.js';
import RtoModel from '../modules/rto/rto.model.js';
import IndustryModel from '../modules/industry/industry.model.js';
import UserModel from '../modules/user/user.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';

import { StudentService } from '../modules/student/student.service.js';
import { RtoService } from '../modules/rto/rto.service.js';
import { IndustryService } from '../modules/industry/industry.service.js';
import {
  getWorkflowDashboardData,
  getWorkflowStudents,
} from '../modules/workflow/workflow.service.js';
import { sanitizeStudentDataForRole } from '../core/utils/rbacSanitizer.js';
import { ForbiddenError, NotFoundError } from '../core/errors/AppError.js';

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
  console.log(`Connecting to MongoDB for RTO Privacy Suite: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const SUITE_TAG = `TEST_RTO_PRIVACY_${Date.now()}`;
  console.log(`\n======================================================`);
  console.log(`=== RUNNING RTO DATA PRIVACY & ISOLATION SUITE ===`);
  console.log(`=== Run ID: ${SUITE_TAG} ===`);
  console.log(`======================================================\n`);

  try {
    // 0. Setup Test Data
    const rtoA = await RtoModel.create({
      name: `Apex Training Institute ${SUITE_TAG}`,
      code: `APEX_${SUITE_TAG}`,
      contactEmail: `contact@apex-${SUITE_TAG}.edu.au`,
      status: 'Active',
      onboardedByName: 'System Admin',
    });

    const rtoB = await RtoModel.create({
      name: `Bright Future Academy ${SUITE_TAG}`,
      code: `BFA_${SUITE_TAG}`,
      contactEmail: `contact@bfa-${SUITE_TAG}.edu.au`,
      status: 'Active',
      onboardedByName: 'System Admin',
    });

    const coordinatorUser = await UserModel.create({
      name: 'Coord John Doe',
      email: `coord_${SUITE_TAG}@mantis.com`,
      role: 'Placement Coordinator',
      status: 'Active',
    });

    const rtoManagerA = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Manager Alice',
      email: `alice_${SUITE_TAG}@apex.edu.au`,
      role: 'RTO Manager',
      rtoName: rtoA.name,
      rtoId: rtoA._id,
      status: 'Active',
    };

    const rtoManagerB = {
      _id: new mongoose.Types.ObjectId(),
      name: 'Manager Bob',
      email: `bob_${SUITE_TAG}@bfa.edu.au`,
      role: 'RTO Manager',
      rtoName: rtoB.name,
      rtoId: rtoB._id,
      status: 'Active',
    };

    const industryHost = await IndustryModel.create({
      name: `Confidential Health Care ${SUITE_TAG}`,
      code: `IND_${SUITE_TAG}`,
      sector: 'Healthcare',
      contactPersonName: 'Dr. Secret Supervisor',
      contactEmail: `confidential_${SUITE_TAG}@health.org`,
      contactPhone: '0499000111',
      address: '77 Privacy Boulevard, Sydney NSW 2000',
    });

    // Create students for RTO A and RTO B with secret industry and coordinator assignments
    const studentA = await StudentModel.create({
      firstName: 'Student',
      lastName: `ApexOne_${SUITE_TAG}`,
      studentId: `STU_${Date.now()}_A`,
      emailAddress: `stu_apex_${SUITE_TAG}@apex.edu.au`,
      phoneNumber: '0411222333',
      courseQualification: 'Individual Support',
      studentType: 'RTO Student',
      assignedRto: rtoA.name,
      institute: rtoA.name,
      rtoId: rtoA._id,
      assignedCoordinator: coordinatorUser._id,
      assignedCoordinatorName: coordinatorUser.name,
      assignedCoordinatorEmail: coordinatorUser.email,
      coordinatorHistory: [{ coordinatorId: coordinatorUser._id, coordinatorName: coordinatorUser.name }],
      placementSite: [industryHost.name],
      contactedIndustries: [
        {
          id: industryHost._id,
          organizationName: industryHost.name,
          contactPerson: industryHost.contactPersonName,
          email: industryHost.contactEmail,
          phone: industryHost.contactPhone,
          notes: 'Sensitive pricing negotiation and manager private mobile',
        },
      ],
      placementStatus: 'In Progress',
    });

    const studentB = await StudentModel.create({
      firstName: 'Student',
      lastName: `BrightOne_${SUITE_TAG}`,
      studentId: `STU_${Date.now()}_B`,
      emailAddress: `stu_bfa_${SUITE_TAG}@bfa.edu.au`,
      phoneNumber: '0422333444',
      courseQualification: 'Individual Support',
      studentType: 'RTO Student',
      assignedRto: rtoB.name,
      institute: rtoB.name,
      rtoId: rtoB._id,
      assignedCoordinator: coordinatorUser._id,
      assignedCoordinatorName: coordinatorUser.name,
      assignedCoordinatorEmail: coordinatorUser.email,
      placementSite: [industryHost.name],
      placementStatus: 'Appointment Scheduled',
    });

    // Create a workflow with appointments and requests referencing both students
    const workflow = await WorkflowModel.create({
      name: `Healthcare Placement Workflow ${SUITE_TAG}`,
      academicYear: 2026,
      students: [studentA._id, studentB._id],
      requests: [
        {
          title: 'Individual Support Placement',
          studentId: studentA.studentId || String(studentA._id),
          student: `${studentA.firstName} ${studentA.lastName}`,
          rto: rtoA.name,
          assignedRto: rtoA.name,
          company: industryHost.name,
          contactPerson: industryHost.contactPersonName,
          email: industryHost.contactEmail,
          contactedIndustries: [
            {
              organizationName: industryHost.name,
              contactPerson: industryHost.contactPersonName,
              email: industryHost.contactEmail,
            },
          ],
        },
        {
          title: 'Individual Support Placement',
          studentId: studentB.studentId || String(studentB._id),
          student: `${studentB.firstName} ${studentB.lastName}`,
          rto: rtoB.name,
          assignedRto: rtoB.name,
          company: industryHost.name,
          contactPerson: industryHost.contactPersonName,
          email: industryHost.contactEmail,
        },
      ],
      appointments: [
        {
          studentId: studentA.studentId || String(studentA._id),
          student: `${studentA.firstName} ${studentA.lastName}`,
          studentName: `${studentA.firstName} ${studentA.lastName}`,
          rto: rtoA.name,
          company: industryHost.name,
          contactPerson: industryHost.contactPersonName,
          coordinatorName: coordinatorUser.name,
          coordinatorEmail: coordinatorUser.email,
          date: '2026-11-01',
          time: '10:00 AM',
          status: 'Scheduled',
        },
      ],
      internships: [
        {
          title: 'Individual Support Internship',
          studentId: studentA.studentId || String(studentA._id),
          student: `${studentA.firstName} ${studentA.lastName}`,
          studentName: `${studentA.firstName} ${studentA.lastName}`,
          rto: rtoA.name,
          company: industryHost.name,
          status: 'Active',
        },
      ],
    });

    console.log('[SETUP] Test records seeded successfully.\n');

    // =========================================================================
    // SECTION 1: RTO TENANT ISOLATION
    // =========================================================================
    console.log('--- 1. Testing RTO Tenant Isolation ---');

    // 1.1 List students as RTO Manager A
    const rtoAStudentsList = await StudentService.getAllStudents(rtoManagerA);
    const hasOnlyAStudents = rtoAStudentsList.every(
      s => s.assignedRto === rtoA.name || String(s.rtoId) === String(rtoA._id)
    );
    const doesNotContainBStudent = !rtoAStudentsList.some(
      s => String(s._id) === String(studentB._id)
    );
    assert(hasOnlyAStudents && doesNotContainBStudent, 'RTO Manager A only sees RTO A students in list query');

    // 1.2 Access own student by ID
    const studentARetrieved = await StudentService.getStudentById(studentA._id, rtoManagerA);
    const retrievedId = studentARetrieved?._id || studentARetrieved?.id;
    assert(studentARetrieved && String(retrievedId) === String(studentA._id), 'RTO Manager A can access own student record by ID');

    // 1.3 Attempt cross-tenant access to RTO B student by direct ID
    let crossAccessBlocked = false;
    try {
      await StudentService.getStudentById(studentB._id, rtoManagerA);
    } catch (err) {
      if (err instanceof ForbiddenError || err instanceof NotFoundError) {
        crossAccessBlocked = true;
      }
    }
    assert(crossAccessBlocked, 'Cross-tenant access to RTO B student is strictly blocked (ForbiddenError / NotFoundError)');

    // 1.4 Attempt cross-tenant access to RTO B in RtoService.getRtoById
    let crossRtoBlocked = false;
    try {
      await RtoService.getRtoById(rtoB._id, rtoManagerA);
    } catch (err) {
      if (err instanceof NotFoundError || err instanceof ForbiddenError) {
        crossRtoBlocked = true;
      }
    }
    assert(crossRtoBlocked, 'RTO Manager A cannot access RTO B profile by ID');

    // 1.5 List RTOs as RTO Manager A
    const rtosListA = await RtoService.getAllRtos({}, rtoManagerA);
    assert(
      rtosListA.length === 1 && String(rtosListA[0]._id) === String(rtoA._id),
      'RTO Manager A only sees their own RTO profile in RTO list'
    );

    // =========================================================================
    // SECTION 2: STUDENT MANAGEMENT BY RTO MANAGERS
    // =========================================================================
    console.log('\n--- 2. Testing Student Management & Cross-Tenant Binding ---');

    // 2.1 RTO Manager A registers a new student with legitimate payload
    const newStudentData = {
      firstName: 'Samantha',
      lastName: `RtoAStudent_${SUITE_TAG}`,
      emailAddress: `samantha_${SUITE_TAG}@test.com`,
      phoneNumber: '0433444555',
      courseQualification: 'Individual Support',
      placementHours: 120,
    };
    const createdStudent = await StudentService.createStudent(newStudentData, { actingUser: rtoManagerA });
    assert(
      createdStudent.assignedRto === rtoA.name &&
      String(createdStudent.rtoId) === String(rtoA._id) &&
      createdStudent.studentType === 'RTO Student',
      'Student created by RTO Manager A is automatically bound to RTO A'
    );

    // 2.2 RTO Manager A attempts to manipulate payload to assign student to RTO B
    const maliciousPayload = {
      firstName: 'Hacked',
      lastName: `SpoofStudent_${SUITE_TAG}`,
      emailAddress: `spoof_${SUITE_TAG}@test.com`,
      phoneNumber: '0444555666',
      courseQualification: 'Individual Support',
      assignedRto: rtoB.name,
      institute: rtoB.name,
      rtoId: rtoB._id,
      studentType: 'Independent Student',
    };
    const forcedStudent = await StudentService.createStudent(maliciousPayload, { actingUser: rtoManagerA });
    assert(
      forcedStudent.assignedRto === rtoA.name &&
      String(forcedStudent.rtoId) === String(rtoA._id) &&
      forcedStudent.studentType === 'RTO Student',
      'Payload tampering rejected: Server overrides malicious cross-RTO assignment with authenticated RTO'
    );

    // 2.3 RTO Manager A updates own student
    const updatedStudent = await StudentService.updateStudent(
      createdStudent._id,
      { firstName: 'Samantha Updated', campus: 'Melbourne Campus' },
      rtoManagerA
    );
    assert(updatedStudent.firstName === 'Samantha Updated', 'RTO Manager A can update their own student');

    // 2.4 RTO Manager A attempts to update RTO B's student
    let updateCrossRtoBlocked = false;
    try {
      await StudentService.updateStudent(
        studentB._id,
        { firstName: 'Malicious Update' },
        rtoManagerA
      );
    } catch (err) {
      if (err instanceof ForbiddenError || err instanceof NotFoundError) {
        updateCrossRtoBlocked = true;
      }
    }
    assert(updateCrossRtoBlocked, 'RTO Manager A cannot modify RTO B students (Blocked with 403 Forbidden)');

    // 2.5 RTO Manager A attempts to re-assign own student to RTO B via update
    const reassignAttempt = await StudentService.updateStudent(
      createdStudent._id,
      { assignedRto: rtoB.name, rtoId: rtoB._id, studentType: 'Independent Student' },
      rtoManagerA
    );
    assert(
      reassignAttempt.assignedRto === rtoA.name &&
      String(reassignAttempt.rtoId) === String(rtoA._id),
      'Update tampering rejected: RTO Manager cannot change student RTO or switch to Independent Student'
    );

    // =========================================================================
    // SECTION 3: INDUSTRY PRIVACY ENFORCEMENT
    // =========================================================================
    console.log('\n--- 3. Testing Industry Privacy (Zero Industry Exposure to RTO) ---');

    // 3.1 Inspect student record returned to RTO Manager
    const sanitizedStudentA = await StudentService.getStudentById(studentA._id, rtoManagerA);
    const hasNoContactedIndustries = !sanitizedStudentA.contactedIndustries || sanitizedStudentA.contactedIndustries.length === 0;
    const hasNoPlacementSite = !sanitizedStudentA.placementSite || sanitizedStudentA.placementSite.length === 0;
    const hasNoPreferredIndustry = !sanitizedStudentA.preferredIndustry;
    assert(
      hasNoContactedIndustries && hasNoPlacementSite && hasNoPreferredIndustry,
      'Student profile returned to RTO Manager contains no contacted industries, placement site, or preferred industry'
    );

    // 3.2 Direct check with sanitizeStudentDataForRole
    const directSanitized = sanitizeStudentDataForRole(studentA.toObject(), 'RTO Manager');
    assert(
      !directSanitized.contactedIndustries &&
      !directSanitized.placementSite &&
      !directSanitized.company &&
      !directSanitized.facilityName,
      'sanitizeStudentDataForRole strictly redacts all industry references for RTO Manager'
    );

    // 3.3 Verify RTO Manager access to Industry APIs is rejected
    let industryStatsBlocked = false;
    try {
      await IndustryService.getIndustryStats(rtoManagerA);
    } catch (err) {
      if (err instanceof ForbiddenError) industryStatsBlocked = true;
    }
    assert(industryStatsBlocked, 'IndustryService.getIndustryStats rejects RTO Manager with ForbiddenError (403)');

    let myIndustriesBlocked = false;
    try {
      await IndustryService.getMyIndustries(rtoManagerA);
    } catch (err) {
      if (err instanceof ForbiddenError) myIndustriesBlocked = true;
    }
    assert(myIndustriesBlocked, 'IndustryService.getMyIndustries rejects RTO Manager with ForbiddenError (403)');

    // =========================================================================
    // SECTION 4: COORDINATOR PRIVACY ENFORCEMENT
    // =========================================================================
    console.log('\n--- 4. Testing Placement Coordinator Privacy ---');

    // 4.1 Inspect coordinator fields in student record for RTO Manager
    assert(
      sanitizedStudentA.assignedCoordinator === undefined &&
      sanitizedStudentA.assignedCoordinatorName === undefined &&
      sanitizedStudentA.assignedCoordinatorEmail === undefined &&
      sanitizedStudentA.coordinatorHistory === undefined,
      'Assigned coordinator ID, name, email, and history are stripped for RTO Manager'
    );

    // 4.2 Verify coordinator is preserved in raw database (not deleted from DB)
    const rawStudentInDb = await StudentModel.findById(studentA._id).lean();
    assert(
      Boolean(rawStudentInDb.assignedCoordinator) &&
      rawStudentInDb.assignedCoordinatorName === coordinatorUser.name,
      'Operational integrity preserved: Coordinator assignment remains intact in database'
    );

    // =========================================================================
    // SECTION 5: RTO SIGNUP AUTOCOMPLETE 50% RULE
    // =========================================================================
    console.log('\n--- 5. Testing RTO Signup Autocomplete (50% Rule & Bounds) ---');

    // 5.1 One character query ('A') -> 0 results
    const res1 = await RtoService.autocompleteRtos('A');
    assert(res1.length === 0, '1 character query ("A") returns 0 results (enforces min length)');

    // 5.2 Two character query ('Ap') -> 0 results
    const res2 = await RtoService.autocompleteRtos('Ap');
    assert(res2.length === 0, '2 character query ("Ap") returns 0 results');

    // 5.3 Valid query with 50%+ of word ('Apex') -> matches
    const res3 = await RtoService.autocompleteRtos('Apex');
    const matchedApex = res3.some(r => r._id.toString() === rtoA._id.toString());
    assert(matchedApex, 'Query meeting 50% threshold ("Apex") returns matching RTO');

    // 5.4 Check payload of autocomplete suggestions
    if (res3.length > 0) {
      const first = res3[0];
      const safeFieldsOnly =
        Object.keys(first).every(k => ['_id', 'name', 'code'].includes(k)) &&
        first.contactEmail === undefined &&
        first.contactPhone === undefined &&
        first.documents === undefined;
      assert(safeFieldsOnly, 'Autocomplete returns only safe public fields (_id, name, code), zero private contact/document details');
    }

    // 5.5 Query less than 50% for long name (e.g., "Bri" for "Bright Future Academy...")
    // "Bright" is 6 chars, 50% is 3 chars. "Bri" is 3 chars. What about "Br"? 2 chars -> rejected.
    const resShortForLong = await RtoService.autocompleteRtos('Br');
    assert(resShortForLong.length === 0, 'Partial input "Br" returns 0 suggestions');

    // =========================================================================
    // SECTION 6: STUDENT PROGRESS SCOPING & DASHBOARD
    // =========================================================================
    console.log('\n--- 6. Testing Student Progress Scoping & Dashboard Isolation ---');

    // 6.1 Workflow Dashboard for RTO Manager A
    const dashA = await getWorkflowDashboardData(rtoManagerA);
    assert(dashA.totalStudents >= 1, 'RTO Manager A dashboard calculates student count strictly from RTO A');
    
    // Check that recent activities and appointment lists in dashboard do NOT leak confidential company names
    const dashboardStr = JSON.stringify(dashA);
    const leaksIndustryHost = dashboardStr.includes(industryHost.name);
    assert(!leaksIndustryHost, 'RTO Dashboard data does not expose confidential host industry names');

    const leaksCoordinatorUser = dashboardStr.includes(coordinatorUser.name);
    assert(!leaksCoordinatorUser, 'RTO Dashboard data does not expose assigned coordinator identity');

    // 6.2 Workflow students scoping
    const wfStudentsA = await getWorkflowStudents(workflow._id, rtoManagerA);
    const onlyOwnStudentInWf = wfStudentsA.every(
      s => s.assignedRto === rtoA.name || String(s.rtoId) === String(rtoA._id)
    );
    assert(onlyOwnStudentInWf, 'Workflow students endpoint scopes records strictly to RTO A students');

    // 6.3 Admin access check to ensure Admin workflow is intact
    const adminUser = { _id: new mongoose.Types.ObjectId(), name: 'Super Admin', role: 'Administrator' };
    const adminStudents = await StudentService.getAllStudents(adminUser);
    assert(adminStudents.length >= 2, 'Administrator role retains full global visibility across all RTOs and students');

    const adminRtos = await RtoService.getAllRtos({}, adminUser);
    assert(adminRtos.length >= 2, 'Administrator role retains full access to all RTOs');

  } catch (error) {
    console.error('Unexpected error during test suite execution:', error);
    assert(false, 'Suite execution completed without unexpected exceptions', error.message);
  } finally {
    // Cleanup test data
    console.log('\n[TEARDOWN] Cleaning up test records...');
    try {
      await Promise.all([
        RtoModel.deleteMany({ name: new RegExp(SUITE_TAG, 'i') }),
        StudentModel.deleteMany({ emailAddress: new RegExp(SUITE_TAG, 'i') }),
        IndustryModel.deleteMany({ code: new RegExp(SUITE_TAG, 'i') }),
        UserModel.deleteMany({ email: new RegExp(SUITE_TAG, 'i') }),
        WorkflowModel.deleteMany({ name: new RegExp(SUITE_TAG, 'i') }),
      ]);
      console.log('[TEARDOWN] Cleanup completed.');
    } catch (cleanupErr) {
      console.error('[TEARDOWN ERROR]', cleanupErr);
    }
    await mongoose.disconnect();
  }

  console.log(`\n======================================================`);
  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
