/**
 * One-time repair script: fixes students whose assignedRto was wiped by the Zod default bug.
 * Recovers RTO name from: rtoId → RTO collection, or existing payment record's rto field.
 *
 * Run: node src/scripts/repairStudentRto.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import StudentModel from '../modules/student/student.model.js';
import RtoModel from '../modules/rto/rto.model.js';
import PaymentModel from '../modules/payment/payment.model.js';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function repair() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // All students with rtoId set but assignedRto empty/missing
  const broken = await StudentModel.find({
    rtoId: { $ne: null, $exists: true },
    $or: [{ assignedRto: '' }, { assignedRto: { $exists: false } }],
  }).lean();

  console.log(`Found ${broken.length} students with rtoId but no assignedRto`);

  if (broken.length === 0) {
    // Also check students with no rtoId but payment has rto
    const noRtoId = await StudentModel.find({
      $or: [{ rtoId: null }, { rtoId: { $exists: false } }],
      $or: [{ assignedRto: '' }, { assignedRto: { $exists: false } }],
      studentType: { $ne: 'Independent Student' },
    }).lean();

    console.log(`Found ${noRtoId.length} students with no rtoId and no assignedRto (non-independent)`);

    if (noRtoId.length > 0) {
      const payments = await PaymentModel.find(
        { student: { $in: noRtoId.map(s => s._id) }, rto: { $ne: '' }, rto: { $ne: 'Independent Student' } },
        { student: 1, rto: 1 }
      ).lean();
      const payMap = new Map(payments.filter(p => p.rto).map(p => [String(p.student), p.rto]));

      const ops = [];
      for (const s of noRtoId) {
        const rtoName = payMap.get(String(s._id));
        if (rtoName) {
          ops.push({ updateOne: { filter: { _id: s._id }, update: { $set: { assignedRto: rtoName, studentType: 'RTO Student' } } } });
          console.log(`  Repair via payment: ${s.firstName} ${s.lastName} → ${rtoName}`);
        }
      }
      if (ops.length > 0) {
        await StudentModel.bulkWrite(ops);
        console.log(`Repaired ${ops.length} students via payment record`);
      }
    }

    await mongoose.disconnect();
    return;
  }

  const allRtos = await RtoModel.find({}, { _id: 1, name: 1 }).lean();
  const rtoIdToName = new Map(allRtos.map(r => [String(r._id), r.name]));

  // Also fetch payment records for fallback
  const payments = await PaymentModel.find(
    { student: { $in: broken.map(s => s._id) } },
    { student: 1, rto: 1 }
  ).lean();
  const payMap = new Map(payments.filter(p => p.rto && p.rto !== 'Independent Student').map(p => [String(p.student), p.rto]));

  const ops = [];
  for (const s of broken) {
    const rtoName = rtoIdToName.get(String(s.rtoId)) || payMap.get(String(s._id));
    if (rtoName) {
      ops.push({ updateOne: { filter: { _id: s._id }, update: { $set: { assignedRto: rtoName, studentType: 'RTO Student' } } } });
      console.log(`  Repair: ${s.firstName} ${s.lastName} → ${rtoName}`);
    } else {
      console.log(`  SKIP (no RTO found): ${s.firstName} ${s.lastName} (rtoId: ${s.rtoId})`);
    }
  }

  if (ops.length > 0) {
    await StudentModel.bulkWrite(ops);
    console.log(`\nRepaired ${ops.length} / ${broken.length} students`);
  } else {
    console.log('No repairs made');
  }

  await mongoose.disconnect();
  console.log('Done');
}

repair().catch(err => { console.error(err); process.exit(1); });
