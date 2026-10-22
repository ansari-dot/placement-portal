import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import connectDB from '../core/config/db_config.js';
import UserModel from '../modules/user/user.model.js';
import StudentModel from '../modules/student/student.model.js';
import RtoModel from '../modules/rto/rto.model.js';
import IndustryModel from '../modules/industry/industry.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import AttendanceModel from '../modules/attendance/attendance.model.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { UserService } from '../modules/user/user.service.js';
import { AttendanceService } from '../modules/attendance/attendance.service.js';
import { StudentService } from '../modules/student/student.service.js';
import { RtoService } from '../modules/rto/rto.service.js';
import { IndustryService } from '../modules/industry/industry.service.js';
import { getWorkflowById } from '../modules/workflow/workflow.service.js';
import { filterWorkflowForUser } from '../core/utils/rbacScope.js';
import { authenticate } from '../core/guards/auth.guard.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

const results = {
  passed: 0,
  failed: 0,
  details: [],
};

const assert = (condition, description, meta = null) => {
  if (condition) {
    results.passed++;
    results.details.push({ status: 'PASS', description });
    console.log(`[PASS] ${description}`);
  } else {
    results.failed++;
    results.details.push({ status: 'FAIL', description, meta });
    console.error(`[FAIL] ${description}`, meta ? JSON.stringify(meta) : '');
  }
};

export const runE2EAcceptanceSuite = async () => {
  console.log('================================================================');
  console.log('   MANTIS PLACEMENTS — FINAL E2E ACCEPTANCE & TENANT ISOLATION  ');
  console.log('================================================================\n');

  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }

  const RUN_TAG = `E2E_${Date.now()}`;
  const testEmail = (name) => `${name}.${RUN_TAG}@mantis-e2e.test`.toLowerCase();

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP FIXTURES: TENANTS & ADMINISTRATIVE ACTORS
    // -------------------------------------------------------------------------
    console.log('--- 1. Setting up Test Fixtures for Dual-Tenant Isolation ---');

    // Admin Actor
    const adminUser = await UserModel.create({
      name: 'Super Admin E2E',
      email: testEmail('admin'),
      password: 'Password@123',
      role: 'Administrator',
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(adminUser._id, 'Admin user fixture created');

    // Tenant 1: RTO Alpha
    const rtoAlpha = await RtoModel.create({
      name: `RTO Alpha ${RUN_TAG}`,
      rtoCode: `RTO-A-${RUN_TAG.slice(-4)}`,
      contactEmail: testEmail('rto.alpha.contact'),
      contactPerson: 'Director Alpha',
      contactPhone: '0400111111',
      payoutRate: 550,
      coursePricing: [{ course: 'Certificate III in Individual Support', rate: 650 }],
      onboardedByName: adminUser.name,
      onboardedBy: adminUser._id,
    });

    const userRtoAlpha = await UserModel.create({
      name: 'Manager RTO Alpha',
      email: testEmail('rto.alpha.mgr'),
      password: 'Password@123',
      role: 'RTO Manager',
      rtoId: rtoAlpha._id,
      rtoName: rtoAlpha.name,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(userRtoAlpha._id, `RTO Alpha Manager created: ${userRtoAlpha.email}`);

    // Tenant 2: RTO Beta
    const rtoBeta = await RtoModel.create({
      name: `RTO Beta ${RUN_TAG}`,
      rtoCode: `RTO-B-${RUN_TAG.slice(-4)}`,
      contactEmail: testEmail('rto.beta.contact'),
      contactPerson: 'Director Beta',
      contactPhone: '0400222222',
      payoutRate: 500,
      onboardedByName: adminUser.name,
      onboardedBy: adminUser._id,
    });

    const userRtoBeta = await UserModel.create({
      name: 'Manager RTO Beta',
      email: testEmail('rto.beta.mgr'),
      password: 'Password@123',
      role: 'RTO Manager',
      rtoId: rtoBeta._id,
      rtoName: rtoBeta.name,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(userRtoBeta._id, `RTO Beta Manager created: ${userRtoBeta.email}`);

    // Coordinator Chloe
    const userCoordinatorChloe = await UserModel.create({
      name: `Chloe Coordinator ${RUN_TAG}`,
      email: testEmail('chloe.coordinator'),
      password: 'Password@123',
      role: 'Coordinator',
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(userCoordinatorChloe._id, `Coordinator Chloe created: ${userCoordinatorChloe.email}`);

    // RTO Chloe (onboarded by Coordinator Chloe)
    const rtoChloe = await RtoModel.create({
      name: `RTO Chloe ${RUN_TAG}`,
      rtoCode: `RTO-C-${RUN_TAG.slice(-4)}`,
      contactEmail: testEmail('rto.chloe.contact'),
      contactPerson: 'Director Chloe',
      contactPhone: '0400999999',
      payoutRate: 450,
      onboardedByName: userCoordinatorChloe.name,
      onboardedBy: userCoordinatorChloe._id,
      createdBy: userCoordinatorChloe._id,
    });
    assert(rtoChloe._id, `RTO Chloe created by Coordinator: ${rtoChloe.name}`);

    // Facility 1: Industry Facility North
    const facilityNorth = await IndustryModel.create({
      name: `Care North ${RUN_TAG}`,
      code: `IND-N-${RUN_TAG.slice(-4)}`,
      sector: 'Aged Care',
      contactPersonName: 'Manager North',
      contactEmail: testEmail('industry.north'),
      contactPhone: '0400333333',
      address: '100 North Rd, Melbourne VIC 3000',
      state: 'VIC',
    });

    const userIndustryNorth = await UserModel.create({
      name: 'Industry Lead North',
      email: testEmail('industry.north.user'),
      password: 'Password@123',
      role: 'Industry',
      industryId: facilityNorth._id,
      facilityName: facilityNorth.name,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(userIndustryNorth._id, `Industry North Lead created: ${facilityNorth.name}`);

    // Facility 2: Industry Facility South
    const facilitySouth = await IndustryModel.create({
      name: `Care South ${RUN_TAG}`,
      code: `IND-S-${RUN_TAG.slice(-4)}`,
      sector: 'Disability Support',
      contactPersonName: 'Manager South',
      contactEmail: testEmail('industry.south'),
      contactPhone: '0400444444',
      address: '200 South Rd, Sydney NSW 2000',
      state: 'NSW',
    });

    const userIndustrySouth = await UserModel.create({
      name: 'Industry Lead South',
      email: testEmail('industry.south.user'),
      password: 'Password@123',
      role: 'Industry',
      industryId: facilitySouth._id,
      facilityName: facilitySouth.name,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(userIndustrySouth._id, `Industry South Lead created: ${facilitySouth.name}`);

    // Student A (RTO Alpha)
    const studentAlpha = await StudentModel.create({
      studentId: `STU-A-${RUN_TAG.slice(-4)}`,
      firstName: 'Alice',
      lastName: 'Alpha',
      emailAddress: testEmail('alice.alpha'),
      phoneNumber: '0400123456',
      courseQualification: 'Certificate III in Individual Support',
      assignedRto: rtoAlpha.name,
      rtoId: rtoAlpha._id,
      classification: 'RTO Student',
      placementStatus: 'Appointment Successful',
      commencementDate: '2026-11-01',
      completionDate: '2026-11-30',
      placementSite: facilityNorth.name,
      isDeleted: false,
    });

    const userStudentAlpha = await UserModel.create({
      name: 'Alice Alpha',
      email: studentAlpha.emailAddress,
      password: 'Password@123',
      role: 'Student',
      studentIdRef: studentAlpha._id,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(studentAlpha._id, `Student Alpha registered: ${studentAlpha.studentId}`);

    // Student B (RTO Beta)
    const studentBeta = await StudentModel.create({
      studentId: `STU-B-${RUN_TAG.slice(-4)}`,
      firstName: 'Bob',
      lastName: 'Beta',
      emailAddress: testEmail('bob.beta'),
      phoneNumber: '0400654321',
      courseQualification: 'Certificate III in Individual Support',
      assignedRto: rtoBeta.name,
      rtoId: rtoBeta._id,
      classification: 'RTO Student',
      placementStatus: 'Placement Started',
      commencementDate: '2026-11-05',
      completionDate: '2026-12-05',
      placementSite: facilitySouth.name,
      isDeleted: false,
    });

    const userStudentBeta = await UserModel.create({
      name: 'Bob Beta',
      email: studentBeta.emailAddress,
      password: 'Password@123',
      role: 'Student',
      studentIdRef: studentBeta._id,
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    assert(studentBeta._id, `Student Beta registered: ${studentBeta.studentId}`);

    // Workflow with placements & orientation appointments
    const workflowDoc = await WorkflowModel.create({
      name: `Workflow ${RUN_TAG}`,
      currentStep: 4,
      students: [studentAlpha._id, studentBeta._id],
      appointments: [
        {
          studentId: studentAlpha.studentId,
          student: 'Alice Alpha',
          company: facilityNorth.name,
          rto: rtoAlpha.name,
          date: '2026-10-30',
          time: '10:00 AM',
          status: 'Confirmed',
        },
        {
          studentId: studentBeta.studentId,
          student: 'Bob Beta',
          company: facilitySouth.name,
          rto: rtoBeta.name,
          date: '2026-11-02',
          time: '02:00 PM',
          status: 'Confirmed',
        },
      ],
      internships: [
        {
          title: 'Individual Support Placement',
          studentId: studentAlpha.studentId,
          student: 'Alice Alpha',
          company: facilityNorth.name,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          status: 'In Progress',
        },
        {
          title: 'Individual Support Placement',
          studentId: studentBeta.studentId,
          student: 'Bob Beta',
          company: facilitySouth.name,
          startDate: '2026-11-05',
          endDate: '2026-12-05',
          status: 'In Progress',
        },
      ],
    });
    assert(workflowDoc._id, `Workflow created with placements for Facility North & South`);

    // -------------------------------------------------------------------------
    // 2. ACCOUNT LIFECYCLE & ACTIVE SESSION INVALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Account Lifecycle & Active Session Invalidation ---');

    // 2.1 Public signup for all 4 roles creates Pending account without token
    for (const r of ['Student', 'RTO', 'Placement Coordinator', 'Industry/Host']) {
      const email = testEmail(`signup.${r.replace(/[^a-zA-Z]/g, '')}`);
      const signupRes = await AuthService.signup({
        name: `New ${r}`,
        email,
        password: 'Password@123',
        role: r,
      });
      assert(signupRes.status === 'Pending', `Signup for ${r} created account with status: Pending`);
      assert(signupRes.approved === false, `Signup for ${r} created account with approved: false`);
      assert(!signupRes.token, `Zero JWT session token issued for ${r} on signup`);
    }

    // 2.2 Public signup for Administrator blocked
    let adminSignupBlocked = false;
    try {
      await AuthService.signup({
        name: 'Attacker Admin',
        email: testEmail('attacker.admin'),
        password: 'Password@123',
        role: 'Administrator',
      });
    } catch (err) {
      adminSignupBlocked = err.statusCode === 400;
    }
    assert(adminSignupBlocked, 'Public signup for Administrator is strictly rejected with 400 Bad Request');

    // 2.3 Active Session Invalidation: Disable user -> token immediately rejected
    const sessionUser = await UserModel.create({
      name: 'Session Test User',
      email: testEmail('session.user'),
      password: 'Password@123',
      role: 'Staff',
      status: 'Active',
      approved: true,
      isDeleted: false,
    });
    const sessionToken = jwt.sign(
      { id: sessionUser._id, email: sessionUser.email, role: sessionUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Verify token works before disabling
    let initialAuthPassed = false;
    const reqMock1 = {
      headers: { authorization: `Bearer ${sessionToken}` },
      cookies: {},
    };
    const resMock1 = {
      status: () => ({ json: () => {} }),
    };
    await authenticate(reqMock1, resMock1, () => {
      initialAuthPassed = true;
    });
    assert(initialAuthPassed, 'Active session token authenticates successfully while user is Active');

    // Admin disables the user
    await UserService.updateUserStatus(sessionUser._id, 'Disabled', adminUser);

    // Verify previously-issued token is now rejected
    let disabledTokenBlocked = false;
    let blockedCode = null;
    const reqMock2 = {
      headers: { authorization: `Bearer ${sessionToken}` },
      cookies: {},
    };
    const resMock2 = {
      status: (code) => ({
        json: (data) => {
          if (code === 401) {
            disabledTokenBlocked = true;
            blockedCode = data.code;
          }
        },
      }),
    };
    await authenticate(reqMock2, resMock2, () => {});
    assert(disabledTokenBlocked && blockedCode === 'ACCOUNT_UNAVAILABLE',
      'Existing session token is IMMEDIATELY rejected with 401 ACCOUNT_UNAVAILABLE once account is disabled');

    // 2.4 Reactivation safety: cannot reactivate a Rejected user directly
    const rejectedUser = await UserModel.create({
      name: 'Rejected Guy',
      email: testEmail('rejected.guy'),
      password: 'Password@123',
      role: 'Staff',
      status: 'Rejected',
      approved: false,
      isDeleted: false,
    });
    let directReactivationBlocked = false;
    try {
      await UserService.reactivateUser(rejectedUser._id, adminUser);
    } catch (err) {
      directReactivationBlocked = err.statusCode === 400;
    }
    assert(directReactivationBlocked, 'Direct reactivation of Rejected user strictly blocked (requires formal reapproval)');

    // 2.5 Last Active Administrator Protection
    let lastAdminDeactivationBlocked = false;
    const activeAdmins = await UserModel.find({
      role: { $in: ['Administrator', 'Admin'] },
      status: 'Active',
      isDeleted: { $ne: true },
    });
    if (activeAdmins.length === 1) {
      try {
        await UserService.updateUserStatus(activeAdmins[0]._id, 'Disabled', activeAdmins[0]);
      } catch (err) {
        lastAdminDeactivationBlocked = err.statusCode === 400;
      }
    } else {
      const targetAdmin = activeAdmins[0];
      const otherAdminIds = activeAdmins.slice(1).map((a) => a._id);
      await UserModel.updateMany({ _id: { $in: otherAdminIds } }, { $set: { status: 'Inactive' } });
      try {
        await UserService.updateUserStatus(targetAdmin._id, 'Disabled', targetAdmin);
      } catch (err) {
        lastAdminDeactivationBlocked = err.statusCode === 400;
      }
      await UserModel.updateMany({ _id: { $in: otherAdminIds } }, { $set: { status: 'Active' } });
    }
    assert(lastAdminDeactivationBlocked, 'Last active administrator cannot be deactivated or disabled');

    // -------------------------------------------------------------------------
    // 3. MULTI-TENANT ISOLATION: RTO A vs RTO B
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Multi-Tenant Isolation: RTO A vs RTO B ---');

    // 3.1 RTO Alpha listing students -> sees Student Alpha only
    const rtoAlphaStudents = await StudentService.getAllStudents(userRtoAlpha);
    const rtoAlphaStudentIds = rtoAlphaStudents.map((s) => s.studentId);
    assert(rtoAlphaStudentIds.includes(studentAlpha.studentId), 'RTO Alpha successfully sees its own student (Alice Alpha)');
    assert(!rtoAlphaStudentIds.includes(studentBeta.studentId), 'RTO Alpha CANNOT see RTO Beta student (Bob Beta)');

    // 3.2 RTO Alpha querying Student Beta by direct ID -> 404 Not Found
    let rtoAlphaDirectAccessBlocked = false;
    try {
      await StudentService.getStudentById(studentBeta._id, userRtoAlpha);
    } catch (err) {
      rtoAlphaDirectAccessBlocked = err.statusCode === 404;
    }
    assert(rtoAlphaDirectAccessBlocked, 'RTO Alpha direct-ID lookup for RTO Beta student returns non-disclosing 404 Not Found');

    // 3.3 RTO Alpha querying RTO Beta organisation by direct ID -> 404 Not Found
    let rtoBetaOrgDirectAccessBlocked = false;
    try {
      await RtoService.getRtoById(rtoBeta._id, userRtoAlpha);
    } catch (err) {
      rtoBetaOrgDirectAccessBlocked = err.statusCode === 404;
    }
    assert(rtoBetaOrgDirectAccessBlocked, 'RTO Alpha direct-ID lookup for RTO Beta organisation returns non-disclosing 404 Not Found');

    // 3.4 Data Redaction: Host facility names and internal notes redacted for RTO
    const sanitizedStudentForRto = await StudentService.getStudentById(studentAlpha._id, userRtoAlpha);
    assert(sanitizedStudentForRto.placementSite === undefined, 'Host facility / placementSite redacted from Student payload for RTO Manager');
    assert(sanitizedStudentForRto.additionalNotes === undefined, 'Internal notes redacted from Student payload for RTO Manager');

    // 3.5 Coordinator RTO Scoping: Coordinator only sees their onboarded RTO, not Admin RTOs
    const chloeRtos = await RtoService.getAllRtos({}, userCoordinatorChloe);
    const chloeRtoNames = chloeRtos.map((r) => r.name);
    assert(chloeRtoNames.includes(rtoChloe.name), 'Coordinator Chloe sees her own onboarded RTO');
    assert(!chloeRtoNames.includes(rtoAlpha.name), 'Coordinator Chloe CANNOT see Admin-created RTO Alpha in RTO list');
    assert(!chloeRtoNames.includes(rtoBeta.name), 'Coordinator Chloe CANNOT see Admin-created RTO Beta in RTO list');

    // 3.6 Direct ID access by Coordinator Chloe to Admin RTO -> 403 Forbidden
    let chloeDirectAdminRtoBlocked = false;
    try {
      await RtoService.getRtoById(rtoAlpha._id, userCoordinatorChloe);
    } catch (err) {
      chloeDirectAdminRtoBlocked = err.statusCode === 403;
    }
    assert(chloeDirectAdminRtoBlocked, 'Coordinator direct getRtoById access to Admin RTO returns 403 Forbidden');

    // -------------------------------------------------------------------------
    // 4. MULTI-TENANT ISOLATION: INDUSTRY NORTH vs INDUSTRY SOUTH
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Multi-Tenant Isolation: Industry North vs Industry South ---');

    // 4.1 Industry North querying students -> sees Alice Alpha (assigned to Care North), not Bob Beta (assigned to Care South)
    const indNorthStudents = await StudentService.getAllStudents(userIndustryNorth);
    const indNorthStudentIds = indNorthStudents.map((s) => s.studentId);
    assert(indNorthStudentIds.includes(studentAlpha.studentId), 'Industry North sees assigned student (Alice Alpha)');
    assert(!indNorthStudentIds.includes(studentBeta.studentId), 'Industry North CANNOT see unassigned student (Bob Beta)');

    // 4.2 Industry North direct-ID lookup for Bob Beta -> 404 Not Found
    let indNorthDirectAccessBlocked = false;
    try {
      await StudentService.getStudentById(studentBeta._id, userIndustryNorth);
    } catch (err) {
      indNorthDirectAccessBlocked = err.statusCode === 404;
    }
    assert(indNorthDirectAccessBlocked, 'Industry North direct-ID lookup for Bob Beta returns non-disclosing 404 Not Found');

    // 4.3 Industry North querying Industries list -> scoped to Facility North only
    const indNorthRes = await IndustryService.getAllIndustries({}, userIndustryNorth);
    const indNorthFacilities = indNorthRes.industries || indNorthRes;
    assert(indNorthFacilities.length === 1 && indNorthFacilities[0].name === facilityNorth.name,
      'Industry North GET /industries query is strictly scoped to own facility record');

    // 4.4 Workflow appointments scoping for Industry
    const rawWf = await getWorkflowById(workflowDoc._id);
    const wfForIndNorth = await filterWorkflowForUser(rawWf, userIndustryNorth);
    const apptCompanies = (wfForIndNorth.appointments || []).map((a) => a.company);
    assert(apptCompanies.includes(facilityNorth.name), 'Industry North sees orientation appointment for Care North');
    assert(!apptCompanies.includes(facilitySouth.name), 'Industry North orientation appointments do NOT disclose Care South');

    // -------------------------------------------------------------------------
    // 5. ATTENDANCE INTEGRITY, LINKAGE & CALCULATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Attendance Integrity, Linkage & Calculations ---');

    // 5.1 Valid Attendance creation with break calculation & placement linkage
    const attRecord = await AttendanceService.createAttendance(
      {
        student: studentAlpha._id,
        date: '2026-11-10',
        startTime: '09:00 AM',
        finishTime: '05:00 PM',
        breakMinutes: 30,
        status: 'Present',
        notes: 'Shift completed with 30m break',
      },
      userIndustryNorth
    );
    assert(attRecord.id || attRecord._id, 'Attendance record created successfully by authorized Industry user');
    assert(attRecord.totalHours === 7.5, `Server accurately calculated 8h shift - 30m break = 7.5 hours (got: ${attRecord.totalHours})`);
    assert(attRecord.placement, 'Attendance automatically linked to student active placement/workflow document');
    assert(attRecord.facilityName === facilityNorth.name, `Attendance verified with trusted facility document: ${attRecord.facilityName}`);

    // 5.2 Excessive break validation: break >= shift duration
    let excessiveBreakBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentAlpha._id,
          date: '2026-11-11',
          startTime: '09:00 AM',
          finishTime: '01:00 PM', // 4 hours = 240 mins
          breakMinutes: 240,     // 240 mins break
          status: 'Present',
        },
        userIndustryNorth
      );
    } catch (err) {
      excessiveBreakBlocked = err.statusCode === 400;
    }
    assert(excessiveBreakBlocked, 'Excessive break duration (break >= shift duration) rejected with 400 Bad Request');

    // 5.3 Negative break validation
    let negativeBreakBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentAlpha._id,
          date: '2026-11-12',
          startTime: '09:00 AM',
          finishTime: '05:00 PM',
          breakMinutes: -15,
          status: 'Present',
        },
        userIndustryNorth
      );
    } catch (err) {
      negativeBreakBlocked = err.statusCode === 400;
    }
    assert(negativeBreakBlocked, 'Negative break minutes rejected with 400 Bad Request');

    // 5.4 Finish time before start time validation
    let invalidTimesBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentAlpha._id,
          date: '2026-11-13',
          startTime: '05:00 PM',
          finishTime: '09:00 AM',
          breakMinutes: 0,
          status: 'Present',
        },
        userIndustryNorth
      );
    } catch (err) {
      invalidTimesBlocked = err.statusCode === 400;
    }
    assert(invalidTimesBlocked, 'Finish time before start time (overnight shift) rejected with 400 Bad Request');

    // 5.5 Duplicate Attendance on Same Date (Compound Partial Index test)
    let duplicateAttendanceBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentAlpha._id,
          date: '2026-11-10', // same student and same date as 5.1
          startTime: '10:00 AM',
          finishTime: '02:00 PM',
          breakMinutes: 0,
          status: 'Present',
        },
        userIndustryNorth
      );
    } catch (err) {
      duplicateAttendanceBlocked = err.statusCode === 409 || err.code === 11000;
    }
    assert(duplicateAttendanceBlocked, 'Duplicate attendance on same calendar day rejected by compound unique index');

    // 5.6 Parameter Tampering: Industry North attempting to log attendance for Bob Beta (Care South)
    let crossFacilityAttendanceBlocked = false;
    try {
      await AttendanceService.createAttendance(
        {
          student: studentBeta._id, // Bob Beta belongs to Care South
          date: '2026-11-14',
          startTime: '09:00 AM',
          finishTime: '05:00 PM',
          status: 'Present',
        },
        userIndustryNorth // Industry North caller
      );
    } catch (err) {
      crossFacilityAttendanceBlocked = err.statusCode === 404 || err.statusCode === 403;
    }
    assert(crossFacilityAttendanceBlocked, 'Industry North forbidden from creating attendance for student at Care South');

    // 5.7 Attendance Query Scoping: Industry North only sees Care North attendance
    const indNorthAttendanceList = await AttendanceService.getAllAttendance({}, userIndustryNorth);
    const facilitiesInList = indNorthAttendanceList.map((a) => a.facilityName);
    assert(facilitiesInList.every((f) => f === facilityNorth.name), 'Industry North attendance list contains only Care North records');

    // -------------------------------------------------------------------------
    // 6. PLACEMENT LIFECYCLE & WORKFLOW SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Placement Lifecycle & Workflow Synchronization ---');

    // 6.1 Industry North updates placement dates & status on Student Alpha
    const updatedStudentAlpha = await StudentService.updateStudent(
      studentAlpha._id,
      {
        commencementDate: '2026-11-02',
        completionDate: '2026-12-02',
        placementStatus: 'Placement Started',
        notes: 'Commencement confirmed by facility supervisor.',
      },
      userIndustryNorth
    );
    assert(updatedStudentAlpha.commencementDate === '2026-11-02', 'Commencement date successfully updated by Industry user');
    assert(updatedStudentAlpha.completionDate === '2026-12-02', 'Completion date successfully updated by Industry user');
    assert(updatedStudentAlpha.placementStatus === 'Placement Started', 'Placement status successfully updated to Placement Started');

    // 6.2 Verify dates synchronized to Workflow Internships subdocument
    const reloadedWf = await WorkflowModel.findById(workflowDoc._id).lean();
    const aliceInternship = reloadedWf.internships.find((i) => i.studentId === studentAlpha.studentId);
    assert(aliceInternship && (aliceInternship.start === '2026-11-02' || aliceInternship.startDate === '2026-11-02') && (aliceInternship.end === '2026-12-02' || aliceInternship.endDate === '2026-12-02'),
      'Student placement date updates automatically synchronized to Workflow internships subdocument');

    // 6.3 Reject impossible date chronology: completion before commencement
    let invalidDatesBlocked = false;
    try {
      await StudentService.updateStudent(
        studentAlpha._id,
        {
          commencementDate: '2026-12-05',
          completionDate: '2026-11-01', // Before commencement!
        },
        userIndustryNorth
      );
    } catch (err) {
      invalidDatesBlocked = err.statusCode === 400;
    }
    assert(invalidDatesBlocked, 'Impossible date sequence (completionDate before commencementDate) rejected with 400 Bad Request');

    // -------------------------------------------------------------------------
    // 7. STUDENT SELF-ACCESS PERMISSIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Student Self-Access Permissions ---');

    // 7.1 Student can update own phone and emergency contact
    const updatedStudentSelf = await StudentService.updateStudent(
      studentAlpha._id,
      {
        phoneNumber: '0499888777',
        emergencyContactName: 'John Alpha',
        emergencyContactPhone: '0499111222',
        emergencyContactRelationship: 'Father',
        // Malicious attempt to change role, placement fee, or status
        status: 'Active',
        role: 'Administrator',
        independentFee: 0,
      },
      userStudentAlpha
    );
    assert(updatedStudentSelf.phoneNumber === '0499888777', 'Student successfully updated personal phone number');
    assert(updatedStudentSelf.emergencyContactName === 'John Alpha', 'Student successfully updated emergency contact');
    const dbReloadedStudent = await StudentModel.findById(studentAlpha._id).lean();
    assert(dbReloadedStudent.independentFee !== 0, 'Student attempt to modify financial independentFee was strictly ignored');

    // 7.2 Student direct-ID lookup for Bob Beta returns 404
    let stuCrossAccessBlocked = false;
    try {
      await StudentService.getStudentById(studentBeta._id, userStudentAlpha);
    } catch (err) {
      stuCrossAccessBlocked = err.statusCode === 404;
    }
    assert(stuCrossAccessBlocked, 'Student attempting direct-ID access to another student receives 404 Not Found');

    console.log('\n================================================================');
    console.log(`E2E ACCEPTANCE RESULTS: TOTAL ${results.passed + results.failed} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
    console.log('================================================================\n');

    // -------------------------------------------------------------------------
    // CLEANUP TEMPORARY FIXTURES
    // -------------------------------------------------------------------------
    console.log(`[Cleanup] Purging temporary test fixtures for tag: ${RUN_TAG}...`);
    await UserModel.deleteMany({ email: { $regex: RUN_TAG, $options: 'i' } });
    await StudentModel.deleteMany({ studentId: { $regex: RUN_TAG, $options: 'i' } });
    await RtoModel.deleteMany({ name: { $regex: RUN_TAG, $options: 'i' } });
    await IndustryModel.deleteMany({ name: { $regex: RUN_TAG, $options: 'i' } });
    await WorkflowModel.deleteOne({ _id: workflowDoc._id });
    await AttendanceModel.deleteMany({ student: { $in: [studentAlpha._id, studentBeta._id] } });
    console.log('[Cleanup] Temporary test fixtures successfully cleaned up.');

    return results;
  } catch (error) {
    console.error('Fatal error during E2E acceptance suite execution:', error);
    throw error;
  }
};

// Execute if run directly
if (process.argv[1]?.includes('testE2EAcceptance.js')) {
  runE2EAcceptanceSuite()
    .then((res) => process.exit(res.failed > 0 ? 1 : 0))
    .catch(() => process.exit(1));
}
