import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/portal');
  const db = mongoose.connection.db;

  const days = {
    Mon: true,
    Tue: true,
    Wed: true,
    Monday: true,
    Tuesday: true,
    Wednesday: true,
  };

  const r2 = await db.collection('students').updateOne(
    { studentId: 'STU2' },
    {
      $set: {
        availabilityDays: days,
        availabilityFrom: '09:00 AM',
        availabilityTo: '05:00 PM',
        placementHours: 120,
      },
    }
  );
  console.log('STU2 updated:', r2.modifiedCount);

  const r1 = await db.collection('students').updateOne(
    { studentId: 'STU1' },
    {
      $set: {
        availabilityDays: days,
        availabilityFrom: '09:00 AM',
        availabilityTo: '05:00 PM',
        placementHours: 150,
      },
    }
  );
  console.log('STU1 updated:', r1.modifiedCount);

  const s2 = await db.collection('students').findOne({ studentId: 'STU2' });
  console.log('STU2 verify:', {
    studentId: s2.studentId,
    name: s2.firstName + ' ' + s2.lastName,
    availabilityDays: s2.availabilityDays,
    availabilityFrom: s2.availabilityFrom,
    availabilityTo: s2.availabilityTo,
    placementHours: s2.placementHours,
  });

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
