import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const days = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true };
  
  await db.collection('students').updateMany(
    {},
    {
      $set: {
        availabilityDays: days,
        placementHours: 120,
        availabilityFrom: '09:00 AM',
        availabilityTo: '05:00 PM',
        preferredIndustry: ['Aged Care'],
        preferredLocation: 'abbottabad, WA, 2200'
      }
    }
  );

  const wf = await db.collection('workflows').findOne({});
  if (wf) {
    const updatedInternships = (wf.internships || []).map((item, idx) => {
      let cleanId = item.intId || '';
      cleanId = cleanId.replace(/^INT-+/i, 'PL-').replace(/^PL-+/i, 'PL-');
      if (!cleanId.startsWith('PL-')) cleanId = 'PL-' + String(idx + 1).padStart(3, '0');
      return {
        ...item,
        intId: cleanId,
        company: item.company || 'TEST'
      };
    });
    await db.collection('workflows').updateOne(
      { _id: wf._id },
      { $set: { internships: updatedInternships } }
    );
  }

  console.log('Database updated successfully with availabilityDays and placementHours');
  process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
