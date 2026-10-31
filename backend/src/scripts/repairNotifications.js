import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NotificationModel from '../modules/notification/notification.model.js';

dotenv.config();

const repair = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/portal';
  console.log(`Connecting to MongoDB for Notification Repair: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  try {
    // 1. Repair all "New User Registration Request" notifications to target only Admins
    const regResult = await NotificationModel.updateMany(
      {
        $or: [
          { title: { $regex: /Registration Request/i } },
          { desc: { $regex: /requested access/i } },
          { link: '/users' },
        ],
      },
      {
        $set: {
          targetRoles: ['Administrator', 'Admin'],
          targetRole: 'Admin',
        },
      }
    );
    console.log(`Updated ${regResult.modifiedCount} registration request notifications to Administrator-only.`);

    // 2. Repair invoice notifications to have rtoName populated and target RTO/Admin
    const invoiceNotifs = await NotificationModel.find({
      $or: [
        { title: { $regex: /Invoice Generated/i } },
        { desc: { $regex: /generated for/i } },
      ],
    }).lean();

    let invRepaired = 0;
    for (const notif of invoiceNotifs) {
      let rto = notif.rtoName;
      if (!rto && notif.desc) {
        const match = notif.desc.match(/generated for\s+([^.]+)/i);
        if (match && match[1]) {
          rto = match[1].trim();
        }
      }

      await NotificationModel.updateOne(
        { _id: notif._id },
        {
          $set: {
            rtoName: rto || '',
            targetRoles: ['Administrator', 'Admin', 'RTO', 'RTO Manager'],
            type: 'rto',
          },
        }
      );
      invRepaired++;
    }
    console.log(`Updated ${invRepaired} invoice notifications with explicit RTO targets.`);

    // 3. Clear any notifications with targetRoles containing 'All' that were meant for specific users
    const recipientRepaired = await NotificationModel.updateMany(
      {
        recipient: { $ne: null },
        targetRoles: { $in: ['All', 'all'] },
      },
      {
        $pull: { targetRoles: { $in: ['All', 'all'] } },
      }
    );
    console.log(`Removed broad 'All' role from ${recipientRepaired.modifiedCount} recipient-targeted notifications.`);

    console.log('Notification repair complete.');
  } catch (err) {
    console.error('Repair failed:', err);
  } finally {
    await mongoose.disconnect();
  }
};

repair();
