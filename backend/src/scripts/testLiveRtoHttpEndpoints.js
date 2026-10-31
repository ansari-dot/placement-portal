import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import RtoModel from '../modules/rto/rto.model.js';
import StudentModel from '../modules/student/student.model.js';
import IndustryModel from '../modules/industry/industry.model.js';
import UserModel from '../modules/user/user.model.js';
import WorkflowModel from '../modules/workflow/workflow.model.js';
import AttendanceModel from '../modules/attendance/attendance.model.js';
import PaymentModel from '../modules/payment/payment.model.js';
import InvoiceModel from '../modules/invoice/invoice.model.js';
import NotificationModel from '../modules/notification/notification.model.js';
import { InvoiceService } from '../modules/invoice/invoice.service.js';

dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

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
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portal';
  console.log(`Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const SUITE_TAG = `LIVE_HTTP_RTO_${Date.now()}`;
  console.log(`\n================================================================`);
  console.log(`=== RUNNING LIVE HTTP ENDPOINTS TEST ON ${BASE_URL} ===`);
  console.log(`=== Run ID: ${SUITE_TAG} ===`);
  console.log(`================================================================\n`);

  const cleanups = {
    rtos: [],
    users: [],
    industries: [],
    students: [],
    workflows: [],
    attendances: [],
    payments: [],
    invoices: [],
    notifications: [],
  };

  try {
    // -------------------------------------------------------------
    // 1. SETUP DATABASE ENTITIES & AUTH TOKENS
    // -------------------------------------------------------------
    console.log('--- 1. Setting Up RTOs, Users, and Authenticated Tokens ---');

    const rtoA = await RtoModel.create({
      name: `Apex Living Academy ${SUITE_TAG}`,
      code: `ALA_${SUITE_TAG}`,
      contactEmail: `contact@apex-${SUITE_TAG}.edu.au`,
      contactPhone: '02 9111 2222',
      address: '100 Sussex St, Sydney NSW 2000',
      status: 'Active',
      onboardedByName: 'System Admin',
    });
    cleanups.rtos.push(rtoA._id);

    const rtoB = await RtoModel.create({
      name: `Beacon Institute ${SUITE_TAG}`,
      code: `BI_${SUITE_TAG}`,
      contactEmail: `contact@beacon-${SUITE_TAG}.edu.au`,
      contactPhone: '03 9222 3333',
      address: '200 Flinders Lane, Melbourne VIC 3000',
      status: 'Active',
      onboardedByName: 'System Admin',
    });
    cleanups.rtos.push(rtoB._id);

    const userA = await UserModel.create({
      name: 'Manager Alice',
      email: `alice_${SUITE_TAG}@apex.edu.au`,
      role: 'RTO Manager',
      rtoName: rtoA.name,
      rtoId: rtoA._id,
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(userA._id);

    const userB = await UserModel.create({
      name: 'Manager Bob',
      email: `bob_${SUITE_TAG}@beacon.edu.au`,
      role: 'RTO Manager',
      rtoName: rtoB.name,
      rtoId: rtoB._id,
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(userB._id);

    const adminUser = await UserModel.create({
      name: 'Super Admin',
      email: `admin_${SUITE_TAG}@portal.com`,
      role: 'Administrator',
      status: 'Active',
      approved: true,
      approvalStatus: 'Approved',
    });
    cleanups.users.push(adminUser._id);

    const tokenA = jwt.sign({ id: userA._id, role: userA.role }, JWT_SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ id: userB._id, role: userB.role }, JWT_SECRET, { expiresIn: '1h' });
    const tokenAdmin = jwt.sign({ id: adminUser._id, role: adminUser.role }, JWT_SECRET, { expiresIn: '1h' });

    assert(Boolean(tokenA && tokenB), 'Successfully created active users and signed JWT session tokens');

    // -------------------------------------------------------------
    // 2. TEST HTTP: GET /rtos/my & GET /rtos
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing HTTP: GET /rtos/my & GET /rtos ---');

    const resMyRto = await fetch(`${BASE_URL}/rtos/my`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resMyRto.status === 200, `GET /rtos/my returned status ${resMyRto.status}`);
    const jsonMyRto = await resMyRto.json();
    const myRtoList = Array.isArray(jsonMyRto.data) ? jsonMyRto.data : (jsonMyRto.rtos || [jsonMyRto.data]);
    assert(
      myRtoList.length > 0 && myRtoList[0]?.name === rtoA.name,
      'GET /rtos/my successfully returned authenticated RTO A profile'
    );

    const resAllRto = await fetch(`${BASE_URL}/rtos`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resAllRto.status === 200, `GET /rtos returned status ${resAllRto.status}`);
    const jsonAllRto = await resAllRto.json();
    const rtoScopeList = Array.isArray(jsonAllRto.data) ? jsonAllRto.data : (jsonAllRto.rtos || []);
    const onlySawRtoA = rtoScopeList.every((r) => r.name === rtoA.name || String(r._id) === String(rtoA._id));
    assert(
      onlySawRtoA,
      'GET /rtos strictly returns ONLY RTO A to Manager A over HTTP'
    );

    // -------------------------------------------------------------
    // 3. TEST HTTP: POST /students (Creation & Auto-binding)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing HTTP: POST /students ---');

    const studentPayloadA = {
      studentId: `STU_LIVE_A_${Date.now()}`,
      firstName: 'Daniel',
      lastName: 'Day',
      emailAddress: `daniel_${SUITE_TAG}@student.apex.edu.au`,
      phoneNumber: '0433444555',
      dateOfBirth: '2001-09-15',
      gender: 'Male',
      address: '42 Wallaby Way, Sydney NSW',
      courseQualification: 'Diploma of Community Services',
      // Attacker tampering:
      assignedRto: 'Injected Malicious Institute',
      assignedCoordinator: new mongoose.Types.ObjectId(),
    };

    const resCreateStudent = await fetch(`${BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(studentPayloadA),
    });
    assert(resCreateStudent.status === 201, `POST /students returned status ${resCreateStudent.status}`);
    const jsonCreateStudent = await resCreateStudent.json();
    const createdStudent = jsonCreateStudent.data;
    cleanups.students.push(createdStudent._id || createdStudent.id);

    assert(
      (createdStudent.assignedRto === rtoA.name || createdStudent.institute === rtoA.name),
      'Created student is strictly auto-bound to authenticated RTO A on the live server'
    );
    assert(
      !createdStudent.assignedCoordinator,
      'Restricted fields like assignedCoordinator are stripped by HTTP controller'
    );

    // Create a student for RTO B in DB
    const studentB = await StudentModel.create({
      studentId: `STU_LIVE_B_${Date.now()}`,
      firstName: 'Bella',
      lastName: 'Brite',
      emailAddress: `bella_${SUITE_TAG}@student.beacon.edu.au`,
      phoneNumber: '0455666777',
      dateOfBirth: new Date('2000-01-10'),
      gender: 'Female',
      address: '88 River Rd, Melbourne VIC',
      courseQualification: 'Certificate III in Individual Support',
      assignedRto: rtoB.name,
      institute: rtoB.name,
      placementStatus: 'Awaiting',
    });
    cleanups.students.push(studentB._id);

    // -------------------------------------------------------------
    // 4. TEST HTTP: GET /students (Dynamic Status & Redaction)
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing HTTP: GET /students (Live Dynamic Status Sync) ---');

    // Create a host industry
    const hostIndustry = await IndustryModel.create({
      name: `Secret Health Facility ${SUITE_TAG}`,
      code: `IND_SEC_${SUITE_TAG}`,
      sector: 'Healthcare',
      contactPersonName: 'Private Contact',
      contactEmail: `secret_${SUITE_TAG}@health.org`,
      contactPhone: '0477888999',
      address: '99 Secret Way, Sydney NSW',
      status: 'Active',
    });
    cleanups.industries.push(hostIndustry._id);

    // Create workflow with appointment for Student A
    const apptDateStr = '2026-11-25';
    const apptTimeStr = '02:00 PM';
    const workflowA = await WorkflowModel.create({
      name: `Workflow for ${createdStudent.firstName} ${createdStudent.lastName}`,
      student: createdStudent._id || createdStudent.id,
      students: [createdStudent._id || createdStudent.id],
      course: 'Diploma of Community Services',
      currentStep: 3,
      appointments: [
        {
          _id: new mongoose.Types.ObjectId(),
          studentId: createdStudent.studentId,
          student: `${createdStudent.firstName} ${createdStudent.lastName}`,
          rto: rtoA.name,
          type: 'Interview',
          date: apptDateStr,
          time: apptTimeStr,
          company: hostIndustry.name,
          location: hostIndustry.address,
          status: 'Scheduled',
          notes: 'Confidential coordinator notes',
        },
      ],
    });
    cleanups.workflows.push(workflowA._id);

    const resGetStudents1 = await fetch(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resGetStudents1.status === 200, `GET /students returned status ${resGetStudents1.status}`);
    const jsonGetStudents1 = await resGetStudents1.json();
    const studentsListA1 = Array.isArray(jsonGetStudents1.data) ? jsonGetStudents1.data : [];

    const foundLiveStudent1 = studentsListA1.find((s) => s.studentId === createdStudent.studentId);
    assert(foundLiveStudent1 !== undefined, 'Live student returned in GET /students for RTO Manager A');
    assert(
      foundLiveStudent1?.placementStatus === 'Appointment Scheduled',
      `Live status synchronized dynamically: expected 'Appointment Scheduled', got '${foundLiveStudent1?.placementStatus}'`
    );
    assert(
      foundLiveStudent1?.appointmentTime === apptTimeStr,
      `Live appointment time synced: got '${foundLiveStudent1?.appointmentTime}'`
    );
    assert(
      !studentsListA1.some((s) => s.studentId === studentB.studentId),
      'Tenant Isolation: RTO B student is completely excluded from RTO A response'
    );
    assert(
      !foundLiveStudent1?.company && !foundLiveStudent1?.facilityName && !foundLiveStudent1?.contactedIndustries,
      'Host industry and facility names are strictly stripped from student payload'
    );

    // -------------------------------------------------------------
    // 5. TEST HTTP: GET /attendance (Hours Calculation & Scoping)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing HTTP: GET /attendance ---');

    const attA1 = await AttendanceModel.create({
      student: createdStudent._id || createdStudent.id,
      studentId: createdStudent.studentId,
      studentName: `${createdStudent.firstName} ${createdStudent.lastName}`,
      facilityName: hostIndustry.name,
      date: '2026-11-20',
      startTime: '08:00 AM',
      finishTime: '04:30 PM',
      totalHours: 8.5,
      status: 'Present',
    });
    cleanups.attendances.push(attA1._id);

    const attB1 = await AttendanceModel.create({
      student: studentB._id,
      studentId: studentB.studentId,
      studentName: `${studentB.firstName} ${studentB.lastName}`,
      facilityName: 'Other Facility',
      date: '2026-11-20',
      startTime: '09:00 AM',
      finishTime: '05:00 PM',
      totalHours: 8.0,
      status: 'Present',
    });
    cleanups.attendances.push(attB1._id);

    const resAttendance = await fetch(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resAttendance.status === 200, `GET /attendance returned status ${resAttendance.status}`);
    const jsonAttendance = await resAttendance.json();
    const attList = Array.isArray(jsonAttendance.data) ? jsonAttendance.data : (jsonAttendance.records || []);

    const foundAttA = attList.filter((a) => a.studentId === createdStudent.studentId || String(a.student) === String(createdStudent._id || createdStudent.id));
    assert(foundAttA.length === 1, 'Only attendance records for RTO A student are returned');
    assert(foundAttA[0]?.totalHours === 8.5, `Shift total hours dynamically returned: ${foundAttA[0]?.totalHours} hrs`);
    assert(
      !foundAttA[0]?.facilityName || foundAttA[0]?.facilityName === 'Host Facility' || !foundAttA[0]?.facilityName.includes('Secret Health Facility'),
      'Facility name is sanitized / masked as Host Facility in attendance records'
    );

    // -------------------------------------------------------------
    // 6. TEST HTTP: INVOICING & PAYMENTS (/payments, /totals, /pdf)
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing HTTP: Invoicing, Payments, and PDF Download ---');

    const paymentA = await PaymentModel.create({
      student: createdStudent._id || createdStudent.id,
      studentId: createdStudent.studentId,
      studentName: `${createdStudent.firstName} ${createdStudent.lastName}`,
      rto: rtoA.name,
      course: createdStudent.courseQualification,
      placementStatus: 'Internship Started',
      paymentAmount: 750.0,
      originalPrice: 750.0,
      chargePercentage: 100,
      paymentStatus: 'Pending',
      priceConfigured: true,
      spokesperson: rtoA.name,
      address: rtoA.address,
    });
    cleanups.payments.push(paymentA._id);

    // Admin generates invoice via bulk invoice service
    const invoiceGenResult = await InvoiceService.bulkGenerateInvoice(
      {
        paymentSelections: [
          {
            paymentId: paymentA._id,
            chargePercentage: 100,
            originalPrice: 750.0,
          },
        ],
        gstEnabled: true,
      },
      adminUser
    );
    const invoiceNumber = invoiceGenResult.invoices[0].invoiceNumber;
    cleanups.invoices.push(invoiceNumber);
    console.log(`Admin generated invoice: ${invoiceNumber}`);

    // Test GET /payments with Manager A token
    const resPaymentsA = await fetch(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resPaymentsA.status === 200, `GET /payments returned status ${resPaymentsA.status}`);
    const jsonPaymentsA = await resPaymentsA.json();
    const paymentsListA = Array.isArray(jsonPaymentsA.data) ? jsonPaymentsA.data : [];
    const foundInvoice = paymentsListA.find((p) => p.invoiceNumber === invoiceNumber);
    assert(
      foundInvoice !== undefined,
      `Admin generated invoice dynamically appears in GET /payments for RTO Manager A (${foundInvoice?.invoiceNumber})`
    );
    assert(
      foundInvoice?.paymentStatus === 'Invoice Generated',
      `Payment status dynamically reflected as 'Invoice Generated' (got '${foundInvoice?.paymentStatus}')`
    );

    // Test GET /payments with Manager B token (Zero leakage check)
    const resPaymentsB = await fetch(`${BASE_URL}/payments`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resPaymentsB.status === 200, `GET /payments for Manager B returned status ${resPaymentsB.status}`);
    const jsonPaymentsB = await resPaymentsB.json();
    const paymentsListB = Array.isArray(jsonPaymentsB.data) ? jsonPaymentsB.data : [];
    const leakedToB = paymentsListB.some((p) => p.invoiceNumber === invoiceNumber);
    assert(!leakedToB, 'Zero Leakage: Invoice generated for RTO A is completely invisible to RTO Manager B');

    // Test GET /payments/totals with Manager A token
    const resTotalsA = await fetch(`${BASE_URL}/payments/totals`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resTotalsA.status === 200, `GET /payments/totals returned status ${resTotalsA.status}`);
    const jsonTotalsA = await resTotalsA.json();
    const totalsA = jsonTotalsA.data;
    assert(
      totalsA && (totalsA.totalAmount >= 750 || totalsA.invoicedAmount >= 750),
      `Dynamic financial totals aggregated for RTO A: total=$${totalsA?.totalAmount}, pending=$${totalsA?.pendingAmount}`
    );

    // Test GET /payments/invoice/:invoiceNumber/pdf with Manager A token
    const resPdfA = await fetch(`${BASE_URL}/payments/invoice/${invoiceNumber}/pdf`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resPdfA.status === 200, `GET invoice PDF returned status ${resPdfA.status}`);
    const pdfBlob = await resPdfA.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBlob);
    assert(
      pdfBuffer.length > 500 && pdfBuffer.slice(0, 4).toString() === '%PDF',
      `Valid PDF buffer downloaded with %PDF header (${pdfBuffer.length} bytes)`
    );

    // Negative Security Test: Manager B tries to download Manager A's invoice PDF
    const resPdfB = await fetch(`${BASE_URL}/payments/invoice/${invoiceNumber}/pdf`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(
      resPdfB.status === 403,
      `Manager B downloading RTO A invoice is strictly rejected with 403 Forbidden (got status ${resPdfB.status})`
    );

    // -------------------------------------------------------------
    // 8. LIVE HTTP NOTIFICATION PRIVACY & MULTI-TENANT ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 8. Testing Live HTTP Notification Privacy & Isolation ---');

    // Create an Admin-only registration request notification
    const adminRegNotif = await NotificationModel.create({
      title: 'New User Registration Request',
      desc: 'Pending User (Student) has requested access. Please review and approve.',
      type: 'request',
      link: '/users',
      targetRoles: ['Administrator', 'Admin'],
      isRead: false,
    });
    cleanups.notifications.push(adminRegNotif._id);

    // Create an RTO A specific notification
    const rtoANotif = await NotificationModel.create({
      title: `Invoice Generated — ${invoiceNumber}`,
      desc: `Invoice ${invoiceNumber} of $750.00 AUD generated for ${rtoA.name}`,
      type: 'rto',
      link: '/payments',
      rtoName: rtoA.name,
      targetRoles: ['Administrator', 'Admin', 'RTO', 'RTO Manager'],
      isRead: false,
    });
    cleanups.notifications.push(rtoANotif._id);

    // 1. Fetch notifications as RTO Manager A
    const resNotifA = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(resNotifA.status === 200, `GET /notifications for Manager A returned status 200`);
    const jsonNotifA = await resNotifA.json();
    const notifsListA = Array.isArray(jsonNotifA.data) ? jsonNotifA.data : [];

    // Assert Manager A never sees Admin registration notifications
    const adminLeakA = notifsListA.some(
      (n) => n.link === '/users' || (n.title && n.title.includes('Registration Request'))
    );
    assert(!adminLeakA, 'Security: Admin user registration requests are 100% blocked from RTO Manager A');

    // Assert Manager A sees their own RTO's invoice notification
    const invoiceInA = notifsListA.some((n) => n._id.toString() === rtoANotif._id.toString());
    assert(invoiceInA, `Manager A successfully receives notification for their own RTO's invoice (${invoiceNumber})`);

    // 2. Fetch notifications as RTO Manager B
    const resNotifB = await fetch(`${BASE_URL}/notifications`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(resNotifB.status === 200, `GET /notifications for Manager B returned status 200`);
    const jsonNotifB = await resNotifB.json();
    const notifsListB = Array.isArray(jsonNotifB.data) ? jsonNotifB.data : [];

    // Assert Manager B never sees Admin registration notifications
    const adminLeakB = notifsListB.some(
      (n) => n.link === '/users' || (n.title && n.title.includes('Registration Request'))
    );
    assert(!adminLeakB, 'Security: Admin user registration requests are 100% blocked from RTO Manager B');

    // Assert Manager B NEVER sees RTO A's invoice notification
    const invoiceLeakB = notifsListB.some((n) => n._id.toString() === rtoANotif._id.toString());
    assert(!invoiceLeakB, `Multi-Tenant Isolation: RTO A invoice notification is completely invisible to Manager B`);

    console.log('\n================================================================');
    console.log(`=== LIVE HTTP SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('LIVE HTTP SUITE EXCEPTION:', error);
    failed++;
  } finally {
    console.log('--- Cleaning Up Test Artifacts ---');
    try {
      if (cleanups.notifications.length > 0) {
        await NotificationModel.deleteMany({ _id: { $in: cleanups.notifications } });
      }
      if (cleanups.students.length > 0) {
        await StudentModel.deleteMany({ _id: { $in: cleanups.students } });
      }
      if (cleanups.workflows.length > 0) {
        await WorkflowModel.deleteMany({ _id: { $in: cleanups.workflows } });
      }
      if (cleanups.attendances.length > 0) {
        await AttendanceModel.deleteMany({ _id: { $in: cleanups.attendances } });
      }
      if (cleanups.payments.length > 0) {
        await PaymentModel.deleteMany({ _id: { $in: cleanups.payments } });
      }
      if (cleanups.invoices.length > 0) {
        await InvoiceModel.deleteMany({ invoiceNumber: { $in: cleanups.invoices } });
      }
      if (cleanups.industries.length > 0) {
        await IndustryModel.deleteMany({ _id: { $in: cleanups.industries } });
      }
      if (cleanups.users.length > 0) {
        await UserModel.deleteMany({ _id: { $in: cleanups.users } });
      }
      if (cleanups.rtos.length > 0) {
        await RtoModel.deleteMany({ _id: { $in: cleanups.rtos } });
      }
      console.log('Cleanup complete.');
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr.message);
    }
    await mongoose.disconnect();
  }

  return { passed, failed };
};

runSuite().then(({ passed, failed }) => {
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
