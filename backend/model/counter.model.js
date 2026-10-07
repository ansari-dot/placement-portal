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
  const counter = await CounterModel.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  
  if (counter.seq < initialValue) {
    counter.seq = initialValue;
    await counter.save();
  }
  
  return counter.seq;
};

export default CounterModel;
