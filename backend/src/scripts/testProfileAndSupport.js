import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import UserModel from '../modules/user/user.model.js';
import NotificationModel from '../modules/notification/notification.model.js';

dotenv.config();

const BASE_URL = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'mantis_portal_super_secret_key_2026';

let passed = 0;
let failed = 0;

const assert = (condition, description, detail = '') => {
  if (condition) {
    passed++;
    console.log(`[PASS] ${description}`);
  } else {
    failed++;
    console.error(`[FAIL] ${description} ${detail ? '-> ' + detail : ''}`);
  }
};

const runSuite = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portal';
  console.log(`Connecting to MongoDB: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const TAG = `TEST_PROFILE_${Date.now()}`;
  console.log(`\n=============================================================`);
  console.log(`=== RUNNING PROFILE SETTINGS & HELP SUPPORT VERIFICATION ===`);
  console.log(`=== Run ID: ${TAG} ===`);
  console.log(`=============================================================\n`);

  let testUser = null;

  try {
    // 1. Create a test user with a known password
    testUser = await UserModel.create({
      name: `Tester User ${TAG}`,
      email: `tester_${TAG}@example.edu.au`,
      role: 'RTO Manager',
      status: 'Active',
      approved: true,
      phone: '0400111222',
      password: 'InitialPassword123',
    });

    const token = jwt.sign(
      { id: testUser._id, role: testUser.role, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 2. Test PATCH /auth/profile - update name and phone
    const resUpdate = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `Tester Renamed ${TAG}`,
        phone: '0499888777',
      }),
    });

    assert(resUpdate.status === 200, `PATCH /auth/profile returned status ${resUpdate.status}`);
    const jsonUpdate = await resUpdate.json();
    assert(jsonUpdate.success === true, 'PATCH /auth/profile returned success: true');
    assert(
      jsonUpdate.user?.name === `Tester Renamed ${TAG}`,
      `User name successfully updated: ${jsonUpdate.user?.name}`
    );
    assert(
      jsonUpdate.user?.phone === '0499888777',
      `User phone successfully updated: ${jsonUpdate.user?.phone}`
    );

    // 3. Test PATCH /auth/profile - password change with incorrect current password
    const resBadPw = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewPassword123',
      }),
    });

    assert(
      resBadPw.status === 400,
      `Rejected password change with invalid current password (status ${resBadPw.status})`
    );

    // 4. Test PATCH /auth/profile - password change with valid current password
    const resGoodPw = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: 'InitialPassword123',
        newPassword: 'BrandNewPassword123',
      }),
    });

    assert(
      resGoodPw.status === 200,
      `Successfully changed password with valid current password (status ${resGoodPw.status})`
    );

    // Verify user can login with new password
    const resLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: 'BrandNewPassword123',
      }),
    });
    assert(resLogin.status === 200, `Successfully logged in with new password (status ${resLogin.status})`);

    // 5. Test POST /auth/support-ticket - submit inquiry
    const resTicket = await fetch(`${BASE_URL}/auth/support-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subject: `Placement Inquiry ${TAG}`,
        category: 'Placement Workflow',
        priority: 'High',
        message: 'Need assistance verifying student shift logbooks for cohort Apex.',
      }),
    });

    assert(resTicket.status === 200, `POST /auth/support-ticket returned status ${resTicket.status}`);
    const jsonTicket = await resTicket.json();
    assert(jsonTicket.success === true, 'Support ticket created successfully');
    assert(Boolean(jsonTicket.data?.ticketId), `Support ticket ID generated: ${jsonTicket.data?.ticketId}`);

    // Verify notification was created in MongoDB
    const notif = await NotificationModel.findById(jsonTicket.data?.ticketId);
    assert(
      Boolean(notif) && notif.title.includes(`Placement Inquiry ${TAG}`),
      `Support notification persisted for administrators: ${notif?.title}`
    );
    if (notif) {
      await NotificationModel.findByIdAndDelete(notif._id);
    }

    console.log(`\n=============================================================`);
    console.log(`=== PROFILE & SUPPORT TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED ===`);
    console.log(`=============================================================\n`);
  } catch (err) {
    console.error('Exception during test:', err);
    failed++;
  } finally {
    if (testUser) {
      await UserModel.findByIdAndDelete(testUser._id);
    }
    await mongoose.disconnect();
  }

  process.exit(failed > 0 ? 1 : 0);
};

runSuite();
