import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    default: 51, // Start invoice numbers at sequence 51 per user prompt
  },
}, { timestamps: true });

const CounterModel = mongoose.model('Counter', counterSchema);

export const getNextSequence = async (sequenceName, initialValue = 51) => {
  const existing = await CounterModel.findOne({ name: sequenceName });
  if (!existing) {
    try {
      await CounterModel.create({ name: sequenceName, seq: initialValue });
      return initialValue;
    } catch (err) {
      // E11000 duplicate key error means a concurrent worker created the record first; fall through to atomic increment
      if (err.code !== 11000) throw err;
    }
  }

  const counter = await CounterModel.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  return counter.seq;
};

export default CounterModel;
