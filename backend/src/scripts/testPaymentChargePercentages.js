import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PaymentModel from '../modules/payment/payment.model.js';
import StudentModel from '../modules/student/student.model.js';
import { PaymentService, updatePaymentStatusService, syncChargeableStudents } from '../modules/payment/payment.service.js';

dotenv.config();

async function runTests() {
  console.log('--- STARTING PAYMENT CHARGE PERCENTAGE TEST SUITE ---');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portal');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Create a test student who withdrew (should be 30% charge automatically)
  const testStudentId = 'TEST_CLARK_' + Date.now();
  const testStudent = await StudentModel.create({
    studentId: testStudentId,
    firstName: 'Clark',
    lastName: 'Angelo',
    emailAddress: 'clark.angelo@test.com',
    phoneNumber: '0412345678',
    courseQualification: 'Diploma of Nursing',
    studentType: 'Independent Student',
    independentFee: 1000,
    placementStatus: 'Student Withdraw',
    status: 'Active',
  });

  // Run syncChargeableStudents
  await syncChargeableStudents();

  let payment = await PaymentModel.findOne({ studentId: testStudentId });
  assert('Student Withdraw automatically assigned 30% charge', payment && payment.chargePercentage === 30 && payment.paymentAmount === 300);
  assert('Default isPercentageOverridden is false', payment && payment.isPercentageOverridden === false);

  // 2. Admin manually changes charge percentage to 100%
  const updated = await updatePaymentStatusService(payment._id, {
    chargePercentage: 100,
    isPercentageOverridden: true,
  });
  assert('updatePaymentStatusService updates charge to 100%', updated.chargePercentage === 100 && updated.paymentAmount === 1000);
  assert('updatePaymentStatusService sets isPercentageOverridden: true', updated.isPercentageOverridden === true);

  // 3. Run syncChargeableStudents again while student is still 'Student Withdraw'
  // Sync MUST NOT overwrite manual 100% override!
  await syncChargeableStudents();
  payment = await PaymentModel.findById(payment._id);
  assert('Background sync PRESERVES manual 100% override despite withdrawal status', payment.chargePercentage === 100 && payment.paymentAmount === 1000);

  // 4. Admin resets back to auto (isPercentageOverridden: false)
  const resetAuto = await updatePaymentStatusService(payment._id, {
    isPercentageOverridden: false,
  });
  assert('Reset to auto recalculates 30% because student is currently withdrawn', resetAuto.chargePercentage === 30 && resetAuto.paymentAmount === 300);
  assert('Reset to auto clears isPercentageOverridden', resetAuto.isPercentageOverridden === false);

  // 5. Student re-engages and gets an active appointment / placement (e.g. Appointment Successful)
  await StudentModel.updateOne(
    { _id: testStudent._id },
    { $set: { placementStatus: 'Appointment Successful' } }
  );
  await syncChargeableStudents();
  payment = await PaymentModel.findById(payment._id);
  assert('Sync automatically updates charge to 100% when student moves to active status', payment.chargePercentage === 100 && payment.paymentAmount === 1000);

  // 6. Test GST toggle and Status changes
  const gstUpdated = await updatePaymentStatusService(payment._id, {
    gstEnabled: true,
    paymentStatus: 'Invoice Generated',
  });
  assert('GST toggle sets gstAmount to 10% (100) and totalAmount to 1100', gstUpdated.gstAmount === 100 && gstUpdated.totalAmount === 1100);
  assert('Status updated to Invoice Generated', gstUpdated.paymentStatus === 'Invoice Generated');

  // 7. Check Simrandeep Kaur in local DB if present: sync should have fixed her if she is Appointment Successful
  const simran = await PaymentModel.findOne({ studentName: 'Simrandeep Kaur', placementStatus: 'Appointment Successful' });
  if (simran) {
    assert('Simrandeep Kaur charge percentage is updated to 100% after sync', simran.chargePercentage === 100);
  }

  // Cleanup test student and test payment
  await StudentModel.deleteOne({ _id: testStudent._id });
  await PaymentModel.deleteOne({ _id: payment._id });

  console.log(`--- TEST RESULTS: ${passed} passed, ${failed} failed ---`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
