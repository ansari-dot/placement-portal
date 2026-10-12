import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CounterModel, { getNextSequence } from '../modules/invoice/counter.model.js';
import { studentSchema } from '../modules/student/student.dto.js';
import { bulkGenerateInvoiceSchema } from '../modules/invoice/invoice.dto.js';
import { updatePaymentStatusSchema } from '../modules/payment/payment.dto.js';
import { normalizeAndValidateState } from '../modules/industry/industry.dto.js';
import { loginSchema } from '../modules/auth/auth.dto.js';
import { createAttendanceSchema } from '../modules/attendance/attendance.dto.js';

dotenv.config();

const results = {
  passed: 0,
  failed: 0,
  details: []
};

const assert = (condition, title, meta = null) => {
  if (condition) {
    results.passed++;
    results.details.push({ title, status: 'PASS', meta });
    console.log(`✅ [PASS] ${title}`);
  } else {
    results.failed++;
    results.details.push({ title, status: 'FAIL', meta });
    console.error(`❌ [FAIL] ${title}`, meta ? JSON.stringify(meta) : '');
  }
};

async function runBusinessWorkflowValidation() {
  console.log('\n=== RUNNING BUSINESS WORKFLOW & INTEGRITY VALIDATION ===\n');

  // 1. DTO Validation Suite (100% in-memory, non-destructive)
  console.log('--- 1. Testing Domain DTO Validation & Error Response Envelopes ---');

  // Student DTO: Valid student
  const validStudent = {
    firstName: 'Audit',
    lastName: 'Tester',
    emailAddress: 'audit.tester@test.com',
    phoneNumber: '0412345678',
    studentType: 'RTO Student',
    courseQualification: 'Certificate III in Individual Support',
    assignedRto: 'Sydney College',
  };
  const resValidStudent = studentSchema.safeParse(validStudent);
  assert(resValidStudent.success, 'DTO: Valid Student payload accepted');

  // Student DTO: Invalid student (missing mandatory names and bad email)
  const invalidStudent = {
    firstName: '',
    emailAddress: 'bad-email',
  };
  const resInvalidStudent = studentSchema.safeParse(invalidStudent);
  assert(!resInvalidStudent.success, 'DTO: Invalid Student payload correctly rejected with validation errors');

  // Auth DTO: Valid login
  const resValidLogin = loginSchema.safeParse({ email: 'user@test.com', password: 'Password123' });
  assert(resValidLogin.success, 'DTO: Valid Login payload accepted');

  // Auth DTO: Invalid login (invalid email)
  const resInvalidLogin = loginSchema.safeParse({ email: 'notanemail', password: '12' });
  assert(!resInvalidLogin.success, 'DTO: Malformed email and short password in Login rejected');

  // Industry DTO: Invalid state normalization
  const stateRes = normalizeAndValidateState('TEXAS', true);
  assert(!stateRes.valid, 'DTO: Non-Australian state string rejected by Industry state normalizer');

  // Payment DTO: Negative originalPrice
  const resBadPayment = updatePaymentStatusSchema.safeParse({ originalPrice: -100 });
  assert(!resBadPayment.success, 'DTO: Negative originalPrice rejected by Payment DTO');

  // Invoice DTO: Empty paymentIds rejected
  const resBadInvoice = bulkGenerateInvoiceSchema.safeParse({ paymentIds: [] });
  assert(!resBadInvoice.success, 'DTO: Empty paymentIds rejected by Invoice DTO');

  // Attendance DTO: Missing studentId and date
  const resBadAttendance = createAttendanceSchema.safeParse({ notes: 'missing mandatory fields' });
  assert(!resBadAttendance.success, 'DTO: Missing studentId & date rejected by Attendance DTO');

  // 2. Concurrency & Sequence Integrity Check (Isolated test counter)
  console.log('\n--- 2. Testing Concurrent Invoice Sequence Generation ---');
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/placement_portal';
  await mongoose.connect(mongoUri);

  const TEST_SEQ_NAME = `TEST_CONCURRENT_SEQ_${Date.now()}`;
  const CONCURRENT_COUNT = 15;
  const promises = [];

  for (let i = 0; i < CONCURRENT_COUNT; i++) {
    promises.push(getNextSequence(TEST_SEQ_NAME, 100));
  }

  const generatedSequences = await Promise.all(promises);
  const uniqueSequences = new Set(generatedSequences);

  assert(
    generatedSequences.length === CONCURRENT_COUNT && uniqueSequences.size === CONCURRENT_COUNT,
    `Counter: Concurrent sequence generation produces exactly ${CONCURRENT_COUNT} unique sequential numbers without collisions`,
    { sequences: generatedSequences.sort((a, b) => a - b) }
  );

  // Clean up only our ephemeral test counter sequence record
  await CounterModel.deleteOne({ name: TEST_SEQ_NAME });

  // 3. Database Preservation Check (Confirm production collections exist and are readable)
  console.log('\n--- 3. Database Collection Preservation Check (Read-Only) ---');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  console.log(`Discovered ${collectionNames.length} existing MongoDB collections:`, collectionNames.join(', '));
  assert(collectionNames.length > 0, 'Database: Existing MongoDB database has active collections intact');

  await mongoose.disconnect();

  console.log('\n======================================================');
  console.log(`TOTAL BUSINESS CHECKS: ${results.passed + results.failed}`);
  console.log(`PASSED: ${results.passed}`);
  console.log(`FAILED: ${results.failed}`);
  console.log('======================================================\n');

  if (results.failed > 0) process.exitCode = 1;
  else process.exitCode = 0;
}

runBusinessWorkflowValidation().catch((err) => {
  console.error('Workflow validation error:', err);
  process.exitCode = 1;
});
