import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../core/config/db_config.js';
import UserModel from '../modules/user/user.model.js';
import AttendanceModel from '../modules/attendance/attendance.model.js';

dotenv.config();

export const runUserLifecycleMigration = async () => {
  console.log('=== RUNNING USER LIFECYCLE & DATABASE INTEGRITY MIGRATION ===\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // 1. Backfill approved and isDeleted flags on existing UserModel records
    console.log('[1/4] Backfilling user approval status and soft-deletion flags...');

    const activeUsersResult = await UserModel.updateMany(
      {
        $or: [
          { approved: { $exists: false } },
          { approved: null },
          { isDeleted: { $exists: false } },
        ],
        status: 'Active',
      },
      {
        $set: {
          approved: true,
          isDeleted: false,
          approvedAt: new Date(),
        },
      }
    );
    console.log(` -> Updated ${activeUsersResult.modifiedCount} active users to approved: true, isDeleted: false`);

    const pendingUsersResult = await UserModel.updateMany(
      {
        $or: [
          { approved: { $exists: false } },
          { approved: null },
          { isDeleted: { $exists: false } },
        ],
        status: { $in: ['Pending', 'Inactive', 'Suspended', 'Rejected', 'Disabled'] },
      },
      {
        $set: {
          approved: false,
          isDeleted: false,
        },
      }
    );
    console.log(` -> Updated ${pendingUsersResult.modifiedCount} non-active users to approved: false, isDeleted: false`);

    // 2. Ensure administrator account preservation
    console.log('[2/4] Verifying and preserving primary administrator account...');
    const adminEmail = 'mantisplacements@gmail.com';
    const adminUser = await UserModel.findOne({ email: adminEmail });

    if (adminUser) {
      adminUser.role = 'Administrator';
      adminUser.status = 'Active';
      adminUser.approved = true;
      adminUser.isDeleted = false;
      await adminUser.save();
      console.log(` -> Verified primary admin: ${adminEmail} (Active, Approved, Not Deleted)`);
    } else {
      console.warn(` -> Warning: ${adminEmail} not found. Run createAdmin.js if needed.`);
    }

    // 3. Ensure Attendance soft-delete flag is backfilled
    console.log('[3/4] Backfilling attendance soft-delete flags...');
    const attResult = await AttendanceModel.updateMany(
      { isDeleted: { $exists: false } },
      { $set: { isDeleted: false } }
    );
    console.log(` -> Updated ${attResult.modifiedCount} attendance records to isDeleted: false`);

    // 4. Ensure Database Indexes
    console.log('[4/4] Synchronizing database indexes...');
    try {
      await mongoose.connection.collection('workflows').dropIndex('requests.reqId_1');
    } catch {}
    try {
      await mongoose.connection.collection('workflows').dropIndex('internships.intId_1');
    } catch {}
    try {
      await mongoose.connection.collection('workflows').dropIndex('appointments.apptId_1');
    } catch {}

    await UserModel.syncIndexes();
    await AttendanceModel.syncIndexes();
    const WorkflowModel = (await import('../modules/workflow/workflow.model.js')).default;
    await WorkflowModel.syncIndexes();
    console.log(' -> UserModel, AttendanceModel, and WorkflowModel indexes synchronized successfully.');

    console.log('\n=== MIGRATION COMPLETE: Database is fully aligned with RBAC specifications. ===\n');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

// Auto-run if executed directly via CLI
if (process.argv[1]?.includes('migrateUserLifecycle.js')) {
  runUserLifecycleMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
