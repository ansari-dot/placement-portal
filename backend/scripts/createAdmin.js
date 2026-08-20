import dotenv from 'dotenv';
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

    let user = await UserModel.findOne({ email: adminEmail.toLowerCase().trim() });

    if (user) {
      console.log(`User ${adminEmail} already exists. Updating credentials to Administrator role...`);
      user.password = adminPassword;
      user.role = 'Administrator';
      user.status = 'Active';
      user.name = adminName;
      await user.save();
      console.log(`SUCCESS: Updated existing user to Administrator: ${adminEmail}`);
    } else {
      console.log(`Creating new Administrator account: ${adminEmail}`);
      user = await UserModel.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'Administrator',
        department: 'Administration & Operations',
        status: 'Active',
        phone: '+61 400 123 456',
        lastLogin: new Date(),
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
