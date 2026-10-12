import mongoose from 'mongoose';
import logger from './logger.js';

const lockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    lockedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    owner: { type: String, default: '' },
  },
  { collection: 'system_locks', versionKey: false }
);

// MongoDB TTL index for automatic expiry safety
lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const LockModel = mongoose.models.SystemLock || mongoose.model('SystemLock', lockSchema);

// In-memory fallback if MongoDB is not connected
const inMemoryLocks = new Map();

/**
 * Acquire an atomic lock across all processes/containers.
 * @param {string} lockKey - Unique identifier for the lock
 * @param {number} ttlMs - Lock expiry in milliseconds (defaults to 45 seconds)
 * @param {string|number} owner - Identifier of the acquiring worker
 * @returns {Promise<boolean>} - True if acquired, false if held by another worker
 */
export const acquireDistributedLock = async (lockKey, ttlMs = 45000, owner = process.pid) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  // If Mongoose is not yet connected, use in-memory fallback
  if (mongoose.connection.readyState !== 1) {
    const existing = inMemoryLocks.get(lockKey);
    if (existing && existing > Date.now()) return false;
    inMemoryLocks.set(lockKey, Date.now() + ttlMs);
    return true;
  }

  try {
    await LockModel.create({
      _id: lockKey,
      lockedAt: now,
      expiresAt,
      owner: String(owner),
    });
    return true;
  } catch (err) {
    if (err.code === 11000) {
      // Lock document exists: check if expired and reclaim if so
      const reclaimed = await LockModel.findOneAndUpdate(
        {
          _id: lockKey,
          expiresAt: { $lt: now },
        },
        {
          $set: {
            lockedAt: now,
            expiresAt,
            owner: String(owner),
          },
        },
        { returnDocument: 'after' }
      );
      return Boolean(reclaimed);
    }
    logger.warn(`DistributedLock acquisition error for ${lockKey}: ${err.message}`);
    return false;
  }
};

/**
 * Release an acquired atomic lock.
 * @param {string} lockKey - Unique identifier for the lock
 * @param {string|number} owner - Identifier of the acquiring worker
 */
export const releaseDistributedLock = async (lockKey, owner = process.pid) => {
  if (mongoose.connection.readyState !== 1) {
    inMemoryLocks.delete(lockKey);
    return;
  }

  try {
    await LockModel.deleteOne({ _id: lockKey, owner: String(owner) });
  } catch (err) {
    logger.warn(`DistributedLock release error for ${lockKey}: ${err.message}`);
  }
};
