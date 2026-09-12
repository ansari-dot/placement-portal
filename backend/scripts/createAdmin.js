import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db_config.js';
import UserModel from '../model/user.model.js';

dotenv.config();

const createAdmin = async () => {
  try {
    console.log('Connecting to MongoDB database...');
    await connectDB();

    const adminEmail = 'mantisplacements@gmail.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123';
    const adminName = 'Mantis Admin';

    console.log(`Checking admin account status for: ${adminEmail}`);
    console.log(`Password being used: ${adminPassword}`);

    // Hash the plain-text password ourselves so the pre('save') hook
    // does NOT double-hash it when we call findOneAndUpdate / updateOne.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    let user = await UserModel.findOne({ email: adminEmail.toLowerCase().trim() });

    if (user) {
      console.log(`User ${adminEmail} already exists. Resetting password & role...`);
      // Use updateOne with $set so the pre('save') hook is NOT triggered,
      // and we write the already-hashed password directly to the DB.
      await UserModel.updateOne(
        { email: adminEmail.toLowerCase().trim() },
        {
          $set: {
            password: hashedPassword,
            role: 'Administrator',
            status: 'Active',
            name: adminName,
          },
        }
      );
      console.log(`SUCCESS: Updated existing user to Administrator: ${adminEmail}`);
    } else {
      console.log(`Creating new Administrator account: ${adminEmail}`);
      // Create with pre-hashed password; mark password as already modified
      // by bypassing the hook via direct insert approach.
      user = new UserModel({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'Administrator',
        department: 'Administration & Operations',
        status: 'Active',
        phone: '+61 400 123 456',
        lastLogin: new Date(),
      });
      // Mark password as NOT modified so pre('save') skips re-hashing
      user.$set('password', hashedPassword);
      user.isNew = true;
      await UserModel.collection.insertOne({
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        password: hashedPassword,
        role: 'Administrator',
        department: 'Administration & Operations',
        status: 'Active',
        phone: '+61 400 123 456',
        lastLogin: new Date(),
        isOnline: false,
        lastActive: new Date(),
        lastSeen: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`SUCCESS: Created new Administrator user: ${adminEmail}`);
    }

    console.log('\n======================================================');
    console.log('  ADMIN CREDENTIALS SUMMARY');
    console.log('======================================================');
    console.log(`  Email    : ${adminEmail}`);
    console.log(`  Password : ${adminPassword}`);
    console.log(`  Role     : Administrator`);
    console.log(`  Status   : Active`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('ERROR: Failed to create administrator account:', error.message);
    process.exit(1);
  }
};

createAdmin();
