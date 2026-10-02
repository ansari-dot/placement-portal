import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RtoModel from '../model/rto.model.js';
import StudentModel from '../model/student.model.js';
import PaymentModel from '../model/payment.model.js';
import { CHARGEABLE_PLACEMENT_STATUSES, THIRTY_PERCENT_STATUSES } from '../controller/payment.controller.js';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    // 1. Wipe existing payments and test students
    await PaymentModel.deleteMany({});
    await StudentModel.deleteMany({});
    console.log('Cleared existing Payments and Students collections.');

    // 2. Ensure sample RTOs exist with custom pricing
    await RtoModel.deleteMany({});
    const rto1 = await RtoModel.create({
      name: 'Sydney City College',
      code: 'SCC01',
      payoutRate: 500,
      coursePricing: [
        {
          course: 'Certificate III in Individual Support',
          qualification: 'Certificate III in Individual Support',
          pricing: 650,
          notes: 'Standard Individual Support rate',
        },
      ],
      onboardedByName: 'System Admin',
    });

    const rto2 = await RtoModel.create({
      name: 'Melbourne Institute of Technology',
      code: 'MIT02',
      payoutRate: 550,
      coursePricing: [],
      onboardedByName: 'System Admin',
    });

    console.log('Seeded 2 RTOs with custom course pricing and base payout rates.');

    // 3. Create 5 Diverse Test Students
    const testStudents = [
      {
        studentId: 'STU-101',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        emailAddress: 'sarah.jenkins@test.com',
        phoneNumber: '+61 400 111 222',
        courseQualification: 'Certificate III in Individual Support',
        assignedRto: 'Sydney City College',
        placementStatus: 'Placement Started',
      },
      {
        studentId: 'STU-102',
        firstName: 'Michael',
        lastName: 'Chang',
        emailAddress: 'michael.chang@test.com',
        phoneNumber: '+61 400 333 444',
        courseQualification: 'Diploma of Nursing',
        assignedRto: 'Sydney City College',
        placementStatus: 'Placement Completed',
      },
      {
        studentId: 'STU-103',
        firstName: 'Emma',
        lastName: 'Watson',
        emailAddress: 'emma.watson@test.com',
        phoneNumber: '+61 400 555 666',
        courseQualification: 'Certificate IV in Ageing Support',
        assignedRto: 'Melbourne Institute of Technology',
        placementStatus: 'Appointment Scheduled',
      },
      {
        studentId: 'STU-104',
        firstName: 'David',
        lastName: 'Miller',
        emailAddress: 'david.miller@test.com',
        phoneNumber: '+61 400 777 888',
        courseQualification: 'Certificate III in Individual Support',
        assignedRto: 'Melbourne Institute of Technology',
        placementStatus: 'Student Withdraw',
      },
      {
        studentId: 'STU-105',
        firstName: 'Jessica',
        lastName: 'Taylor',
        emailAddress: 'jessica.taylor@test.com',
        phoneNumber: '+61 400 999 000',
        courseQualification: 'Diploma of Nursing',
        assignedRto: 'Sydney City College',
        placementStatus: 'Student Missed Appointment',
      },
    ];

    await StudentModel.create(testStudents);
    console.log(`Seeded ${testStudents.length} test students with varied placement statuses.`);

    // 4. Populate Payment Collection
    for (const stu of await StudentModel.find().lean()) {
      const is30 = THIRTY_PERCENT_STATUSES.includes(stu.placementStatus);
      const originalPrice = stu.assignedRto === 'Sydney City College' && stu.courseQualification.includes('Individual Support') ? 650 : (stu.assignedRto === 'Melbourne Institute of Technology' ? 550 : 500);
      const chargePercentage = is30 ? 30 : 100;
      const paymentAmount = is30 ? Number((originalPrice * 0.3).toFixed(2)) : originalPrice;

      await PaymentModel.create({
        studentId: stu.studentId,
        student: stu._id,
        studentName: `${stu.firstName} ${stu.lastName}`,
        rto: stu.assignedRto,
        course: stu.courseQualification,
        placementStatus: stu.placementStatus,
        originalPrice,
        chargePercentage,
        paymentAmount,
        paymentStatus: 'Pending',
        priceConfigured: true,
      });
    }

    console.log('Seeded Payments collection cleanly with 5 payment records!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
