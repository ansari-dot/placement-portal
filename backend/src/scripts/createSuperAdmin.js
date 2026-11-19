import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import connectDB from '../core/config/db_config.js';
import UserModel from '../modules/user/user.model.js';

const createSuperAdmin = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const adminEmail = '0349ansari@gmail.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Aarsu123@';
    const adminName = 'Super Administrator';

    console.log(`Checking account status for: ${adminEmail}`);

    let user = await UserModel.findOne({ email: adminEmail.toLowerCase().trim() });

    if (user) {
      console.log(`User ${adminEmail} already exists. Updating credentials...`);
      user.name = adminName;
      user.password = adminPassword;
      user.role = 'Administrator';
      user.status = 'Active';
      user.approved = true;
      user.isDeleted = false;
      user.isHidden = true;
      await user.save();
      console.log(`SUCCESS: Updated existing user to Super Administrator: ${adminEmail}`);
    } else {
      console.log(`Creating new Super Administrator account: ${adminEmail}`);
      user = await UserModel.create({
        name: adminName,
        email: adminEmail.toLowerCase().trim(),
        password: adminPassword,
        role: 'Administrator',
        department: 'Executive Administration',
        status: 'Active',
        approved: true,
        isDeleted: false,
        isHidden: true,
        phone: '+61 400 000 000',
        lastLogin: new Date(),
      });
      console.log(`SUCCESS: Created new Super Administrator account: ${adminEmail}`);
    }

    console.log('\n======================================================');
    console.log('  SUPER ADMIN ACCOUNT CONFIGURED');
    console.log('======================================================');
    console.log(`  Email       : ${adminEmail}`);
    console.log(`  Password    : ${adminPassword}`);
    console.log(`  Role        : Administrator`);
    console.log(`  Status      : Active (Approved)`);
    console.log(`  Visibility  : Hidden from UI (Admins & Staff)`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('ERROR: Failed to create super administrator account:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();
