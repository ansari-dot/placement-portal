import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ReviewModel from '../modules/review/review.model.js';
import UserModel from '../modules/user/user.model.js';
import StudentModel from '../modules/student/student.model.js';
import { ReviewService } from '../modules/review/review.service.js';

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
  console.log(`Connecting to MongoDB for Review & Policy Masking Suite: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const SUITE_TAG = `TEST_REV_${Date.now()}`;
  console.log(`\n======================================================`);
  console.log(`STARTING REVIEW, RATING & POLICY MASKING SUITE [${SUITE_TAG}]`);
  console.log(`======================================================\n`);

  try {
    // ----------------------------------------------------
    // SETUP: Create test users (Admin, Student, RTO, Industry)
    // ----------------------------------------------------
    const adminUser = await UserModel.create({
      name: `Admin ${SUITE_TAG}`,
      email: `admin_${SUITE_TAG.toLowerCase()}@mantis.test`,
      password: 'Password123!',
      role: 'Administrator',
      status: 'Active',
    });

    const studentUser = await UserModel.create({
      name: `Student Jane ${SUITE_TAG}`,
      email: `student_${SUITE_TAG.toLowerCase()}@mantis.test`,
      password: 'Password123!',
      role: 'Student',
      rtoName: 'Sydney Vocational College',
      facilityName: 'Metro Health Aged Care',
      status: 'Active',
    });

    const rtoUser = await UserModel.create({
      name: `RTO Manager Bob ${SUITE_TAG}`,
      email: `rto_${SUITE_TAG.toLowerCase()}@mantis.test`,
      password: 'Password123!',
      role: 'RTO Manager',
      rtoName: 'Apex Institute of Nursing',
      status: 'Active',
    });

    const industryUser = await UserModel.create({
      name: `Facility Lead Alice ${SUITE_TAG}`,
      email: `industry_${SUITE_TAG.toLowerCase()}@mantis.test`,
      password: 'Password123!',
      role: 'Industry',
      facilityName: 'Sunshine Care Services',
      status: 'Active',
    });

    // ----------------------------------------------------
    // 1. STUDENT REVIEW SUBMISSION
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Student Review Submission ---');
    const studentReview = await ReviewService.createReview(
      {
        rating: 5,
        title: 'Amazing Clinical Placement Support',
        comment: 'The placement coordinators and supervisors were incredibly helpful.',
        category: 'Student Portal',
      },
      studentUser
    );

    assert(Boolean(studentReview?._id), '1.1 Student review document created successfully');
    assert(studentReview.status === 'Pending', '1.2 Student review status defaults to Pending (requires Admin approval)');
    assert(studentReview.rating === 5, '1.3 Student review rating is recorded correctly');
    assert(studentReview.reviewerRole === 'Student', '1.4 Reviewer role recorded as Student');
    assert(studentReview.rtoName === 'Sydney Vocational College', '1.5 RTO name correctly resolved on student review');
    assert(studentReview.facilityName === 'Metro Health Aged Care', '1.6 Facility name correctly resolved on student review');

    // ----------------------------------------------------
    // 2. RTO MANAGER REVIEW SUBMISSION
    // ----------------------------------------------------
    console.log('\n--- 2. Testing RTO Manager Review Submission ---');
    const rtoReview = await ReviewService.createReview(
      {
        rating: 5,
        title: 'Excellent Compliance & Privacy Architecture',
        comment: 'Strict RTO partitioning and student oversight makes compliance seamless.',
        category: 'Platform Experience',
      },
      rtoUser
    );

    assert(Boolean(rtoReview?._id), '2.1 RTO Manager review document created successfully');
    assert(rtoReview.status === 'Pending', '2.2 RTO Manager review status defaults to Pending');
    assert(rtoReview.reviewerRole === 'RTO Manager', '2.3 Reviewer role recorded as RTO Manager');
    assert(rtoReview.rtoName === 'Apex Institute of Nursing', '2.4 RTO name recorded on review');

    // ----------------------------------------------------
    // 3. INDUSTRY HOST REVIEW SUBMISSION
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Industry Partner Review Submission ---');
    const industryReview = await ReviewService.createReview(
      {
        rating: 4,
        title: 'Efficient Attendance & Shift Sign-offs',
        comment: 'Very easy to log student attendance and sign off logbooks digitally.',
        category: 'Facility Management',
      },
      industryUser
    );

    assert(Boolean(industryReview?._id), '3.1 Industry review document created successfully');
    assert(industryReview.status === 'Pending', '3.2 Industry review status defaults to Pending');
    assert(industryReview.reviewerRole === 'Industry', '3.3 Reviewer role recorded as Industry');
    assert(industryReview.facilityName === 'Sunshine Care Services', '3.4 Facility name recorded on review');

    // ----------------------------------------------------
    // 4. PUBLIC LEAK TEST (Zero pending reviews before approval)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Public API Strict Leak Prevention (Pending Reviews) ---');
    let publicReviews = await ReviewService.getPublicApprovedReviews();
    const leakedStudent = publicReviews.find((r) => r.title === 'Amazing Clinical Placement Support');
    const leakedRto = publicReviews.find((r) => r.title === 'Excellent Compliance & Privacy Architecture');
    const leakedInd = publicReviews.find((r) => r.title === 'Efficient Attendance & Shift Sign-offs');

    assert(!leakedStudent && !leakedRto && !leakedInd, '4.1 Pending reviews are NEVER returned by public endpoint');

    // ----------------------------------------------------
    // 5. ADMIN MODERATION WORKFLOW
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Admin Review Moderation ---');
    const adminList = await ReviewService.getAllReviewsAdmin({ status: 'Pending' });
    assert(Array.isArray(adminList.reviews) && adminList.reviews.length >= 3, '5.1 Admin can list pending reviews');
    assert(adminList.stats.pending >= 3, '5.2 Pending review counter accurately tracks queue');

    // Admin approves student review
    const approvedStudent = await ReviewService.updateReviewStatus(
      studentReview._id,
      { status: 'Approved', isFeatured: true },
      adminUser
    );
    assert(approvedStudent.status === 'Approved', '5.3 Admin successfully approves Student review');
    assert(Boolean(approvedStudent.approvedAt), '5.4 Approved timestamp set on review');
    assert(approvedStudent.approvedBy.toString() === adminUser._id.toString(), '5.5 ApprovedBy administrator ID tracked');

    // Admin approves RTO review
    const approvedRto = await ReviewService.updateReviewStatus(
      rtoReview._id,
      { status: 'Approved' },
      adminUser
    );
    assert(approvedRto.status === 'Approved', '5.6 Admin successfully approves RTO review');

    // Admin rejects Industry review with reason
    const rejectedInd = await ReviewService.updateReviewStatus(
      industryReview._id,
      { status: 'Rejected', rejectionReason: 'Test feedback rejection' },
      adminUser
    );
    assert(rejectedInd.status === 'Rejected', '5.7 Admin successfully rejects review with reason');
    assert(rejectedInd.rejectionReason === 'Test feedback rejection', '5.8 Rejection reason recorded');

    // ----------------------------------------------------
    // 6. PUBLIC TESTIMONIALS & PRIVACY POLICY MASKING VERIFICATION
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Public Testimonials & Privacy Masking ---');
    publicReviews = await ReviewService.getPublicApprovedReviews();

    const publicStudentRev = publicReviews.find((r) => r.title === 'Amazing Clinical Placement Support');
    const publicRtoRev = publicReviews.find((r) => r.title === 'Excellent Compliance & Privacy Architecture');
    const publicRejectedRev = publicReviews.find((r) => r.title === 'Efficient Attendance & Shift Sign-offs');

    assert(Boolean(publicStudentRev), '6.1 Approved student review appears on public homepage endpoint');
    assert(Boolean(publicRtoRev), '6.2 Approved RTO review appears on public homepage endpoint');
    assert(!publicRejectedRev, '6.3 Rejected review is strictly excluded from public homepage');

    // Privacy Masking Verification:
    // Original RTO was "Sydney Vocational College"
    // Masked should be "S•••••• College"
    console.log('Public Student Review blurredRtoName:', publicStudentRev?.blurredRtoName);
    console.log('Public Student Review blurredFacilityName:', publicStudentRev?.blurredFacilityName);
    console.log('Public RTO Review blurredRtoName:', publicRtoRev?.blurredRtoName);

    assert(
      publicStudentRev?.blurredRtoName && publicStudentRev.blurredRtoName.includes('••••••'),
      '6.4 RTO name is blurred / masked on public review response'
    );
    assert(
      !publicStudentRev?.blurredRtoName.includes('Sydney Vocational College'),
      '6.5 Raw unmasked RTO name is NEVER exposed on public review response'
    );
    assert(
      publicStudentRev?.blurredFacilityName && publicStudentRev.blurredFacilityName.includes('••••••'),
      '6.6 Facility name is blurred / masked on public review response'
    );
    assert(
      !publicStudentRev?.blurredFacilityName.includes('Metro Health Aged Care'),
      '6.7 Raw unmasked Facility name is NEVER exposed on public review response'
    );
    assert(
      publicRtoRev?.blurredRtoName && publicRtoRev.blurredRtoName.includes('••••••'),
      '6.8 RTO partner name is blurred / masked on RTO review response'
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    await ReviewModel.deleteMany({ _id: { $in: [studentReview._id, rtoReview._id, industryReview._id] } });
    await UserModel.deleteMany({ _id: { $in: [adminUser._id, studentUser._id, rtoUser._id, industryUser._id] } });
    console.log('\nCleaned up test review suite fixtures.');
  } catch (err) {
    console.error('Unexpected test error in review suite:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log(`\n======================================================`);
  console.log(`REVIEW & POLICY MASKING SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  process.exit(failed > 0 ? 1 : 0);
};

runSuite();
