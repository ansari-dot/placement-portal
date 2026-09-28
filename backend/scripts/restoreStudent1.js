import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/portal');
  const db = mongoose.connection.db;

  const adminId = new mongoose.Types.ObjectId('6a8c81db597f7a6bd73bc4db');

  // 1. Bring Student 1 back to Step 2
  await db.collection('workflows').updateOne(
    { 'requests.reqId': 'REQ-000057' },
    {
      $set: {
        'requests.$.returnedToStep1': false,
        'requests.$.priority': 'Normal',
        'requests.$.status': 'New',
        'requests.$.notes': 'Restored to Step 2'
      }
    }
  );

  // 2. Assign coordinator to STU1 and add placement fields
  await db.collection('students').updateOne(
    { studentId: 'STU1' },
    {
      $set: {
        assignedCoordinator: adminId,
        assignedCoordinatorName: 'Mantis Admin',
        assignedCoordinatorAt: new Date(),
        internshipPriority: 'Normal',
        preferredIndustry: ['Individual Support', 'Aged Care'],
        placementSite: ['St Vincent Hospital', 'Regis Aged Care'],
        placementHours: 120,
        preferredLocation: 'Sydney NSW',
        placementRadius: '25km',
        willingToRelocate: 'Within 30km',
        availabilityDays: { Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true },
        availabilityFrom: '09:00 AM',
        availabilityTo: '05:00 PM',
        licenceNumber: 'NSW-9843217',
        placementNotes: 'Student prefers morning shifts in aged care facilities.',
        additionalNotes: 'Police check and NDIS screening verified.'
      }
    }
  );

  // 3. Make sure STU2 also has coordinator and placement fields
  await db.collection('students').updateOne(
    { studentId: 'STU2' },
    {
      $set: {
        assignedCoordinator: adminId,
        assignedCoordinatorName: 'Mantis Admin',
        assignedCoordinatorAt: new Date(),
        internshipPriority: 'Urgent',
        preferredIndustry: ['ECEC', 'Childcare'],
        placementSite: ['Goodstart Early Learning', 'Guardian Childcare'],
        placementHours: 150,
        preferredLocation: 'Melbourne VIC',
        placementRadius: '20km',
        willingToRelocate: 'No',
        availabilityDays: { Monday: true, Wednesday: true, Friday: true },
        availabilityFrom: '08:30 AM',
        availabilityTo: '04:30 PM',
        licenceNumber: 'VIC-4567891',
        placementNotes: 'Student requires early childhood education placement.',
        additionalNotes: 'Working With Children Check (WWCC) active.'
      }
    }
  );

  console.log('Successfully updated STU1 and STU2!');
  await mongoose.disconnect();
}

run().catch(console.error);
