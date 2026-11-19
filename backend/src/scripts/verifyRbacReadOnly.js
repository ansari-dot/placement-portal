import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

import StudentModel from '../modules/student/student.model.js';
import { StudentService } from '../modules/student/student.service.js';
import { sanitizeStudentDataForRole } from '../core/utils/rbacSanitizer.js';
import { getStudentQueryScope } from '../core/utils/rbacScope.js';

await mongoose.connect(process.env.MONGO_URI);

let passes = 0;
let fails = 0;

function check(cond, name) {
  if (cond) {
    passes++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name}`);
  } else {
    fails++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name}`);
  }
}

console.log('\n============================================================');
console.log(' VERIFYING RBAC & TENANT ISOLATION (READ-ONLY)');
console.log('============================================================\n');

// 1. Admin Scope
const adminScope = await getStudentQueryScope({ role: 'Administrator' });
check(Object.keys(adminScope).length === 0, 'Admin receives global scope (empty filter)');

// 2. Coordinator Scope
const testCoordId = new mongoose.Types.ObjectId();
const coordScope = await getStudentQueryScope({ role: 'Coordinator', _id: testCoordId, name: 'John Doe', email: 'coord@example.com' });
check(Boolean(coordScope.$or), 'Coordinator receives scoped filter with $or matches');

// 3. RTO Scope
const rtoScope = await getStudentQueryScope({ role: 'RTO Manager', rtoName: 'Apex Institute' });
check(Boolean(rtoScope.$or), 'RTO Manager receives scoped filter with RTO name matches');

// 4. Data Sanitization for RTO
const mockStudent = {
  _id: '6ada9366703aec5aa77e89c7',
  studentId: 'STU-001',
  firstName: 'Test',
  lastName: 'Student',
  contactedIndustries: [{ name: 'Secret Facility' }],
  company: 'Secret Facility',
  assignedCoordinator: 'Coord123',
  canonicalStatus: 'Placement Started',
  canonicalPlacementStatus: 'Placement Started',
  canonicalReason: 'Active placement',
};

const rtoSanitized = sanitizeStudentDataForRole(mockStudent, 'RTO Manager');
check(rtoSanitized.contactedIndustries === undefined, 'RTO Sanitizer: contactedIndustries is stripped');
check(rtoSanitized.company === undefined, 'RTO Sanitizer: company/facility identity is stripped');
check(rtoSanitized.assignedCoordinator === undefined, 'RTO Sanitizer: assignedCoordinator is stripped');
check(rtoSanitized.canonicalStatus === 'Placement Started', 'RTO Sanitizer: canonicalStatus is preserved');

// 5. Data Sanitization for Student
const studentSanitized = sanitizeStudentDataForRole(mockStudent, 'Student');
check(studentSanitized.contactedIndustries === undefined, 'Student Sanitizer: contactedIndustries is stripped');
check(studentSanitized.canonicalStatus === 'Placement Started', 'Student Sanitizer: canonicalStatus is preserved');

// 6. Data Sanitization for Administrator
const adminSanitized = sanitizeStudentDataForRole(mockStudent, 'Administrator');
check(adminSanitized.contactedIndustries !== undefined, 'Admin Sanitizer: full access preserved');
check(adminSanitized.canonicalStatus === 'Placement Started', 'Admin Sanitizer: canonicalStatus preserved');

console.log(`\nRBAC Checks: ${passes} Passed, ${fails} Failed\n`);
await mongoose.disconnect();
if (fails > 0) process.exit(1);
