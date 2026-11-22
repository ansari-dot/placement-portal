import mongoose from 'mongoose';
import UserLogModel from './audit.model.js';
import { generateHumanDescription } from './auditDescription.js';
import { BadRequestError, NotFoundError } from '../../core/errors/AppError.js';
import logger from '../../core/utils/logger.js';

const resolveModel = (resource) => {
  try {
    switch (resource?.toLowerCase()) {
      case 'student': return mongoose.model('Student');
      case 'industry': return mongoose.model('Industry');
      case 'payment': return mongoose.model('Payment');
      case 'rto': return mongoose.model('RTO');
      case 'user': return mongoose.model('User');
      case 'workflow': return mongoose.model('Workflow');
      default: return null;
    }
  } catch (_) {
    return null;
  }
};

export class AuditService {
  static async getLogs({ page = 1, limit = 25, resource, action, search }) {
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(10, Number.parseInt(limit, 10) || 25));
    const query = {};

    if (resource && resource !== 'All') query.resource = resource;
    if (action && action !== 'All') {
      const methodByAction = { created: 'POST', updated: { $in: ['PUT', 'PATCH'] }, deleted: 'DELETE' };
      query.method = methodByAction[action] || action;
    }
    if (search) {
      const term = String(search).trim().slice(0, 100);
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { actorName: { $regex: escaped, $options: 'i' } },
        { actorEmail: { $regex: escaped, $options: 'i' } },
        { action: { $regex: escaped, $options: 'i' } },
        { path: { $regex: escaped, $options: 'i' } },
        { humanDescription: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [rawLogs, total] = await Promise.all([
      UserLogModel.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      UserLogModel.countDocuments(query),
    ]);

    // Ensure humanDescription is populated for all records
    const logs = rawLogs.map((log) => ({
      ...log,
      humanDescription: log.humanDescription || generateHumanDescription(log),
    }));

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  static async revertLog(logId, user) {
    const log = await UserLogModel.findById(logId);
    if (!log) {
      throw new NotFoundError('Audit log entry not found');
    }

    if (log.isReverted) {
      throw new BadRequestError('This change has already been reverted');
    }

    const resource = (log.resource || '').toLowerCase();
    const method = (log.method || '').toUpperCase();
    const Model = resolveModel(resource);
    const targetId = log.resourceId || log.previousState?._id || log.previousState?.id;

    let revertSuccess = false;
    let detailMessage = '';

    try {
      if (log.previousState && Model) {
        if (['PUT', 'PATCH'].includes(method)) {
          if (targetId && mongoose.isValidObjectId(targetId)) {
            const submittedBody = log.changes?.submitted?.body || {};
            const keysToRestore = Object.keys(submittedBody).filter(k => !['_id', 'id', '__v'].includes(k));
            const rollbackData = {};

            keysToRestore.forEach(k => {
              rollbackData[k] = log.previousState[k] !== undefined ? log.previousState[k] : null;
            });

            if (Object.keys(rollbackData).length > 0) {
              await Model.findByIdAndUpdate(targetId, { $set: rollbackData });
              revertSuccess = true;
              detailMessage = `Restored ${Object.keys(rollbackData).join(', ')} to previous state`;
            }
          }
        } else if (method === 'POST') {
          // Record was created; undoing means removing the created record
          const createdId = log.changes?.result?.data?._id || log.changes?.result?.data?.id || targetId;
          if (createdId && mongoose.isValidObjectId(createdId)) {
            await Model.findByIdAndDelete(createdId);
            revertSuccess = true;
            detailMessage = 'Deleted the created record';
          }
        } else if (method === 'DELETE') {
          // Record was deleted; undoing means recreating it from previousState
          const stateToRestore = { ...log.previousState };
          delete stateToRestore.__v;
          await Model.create(stateToRestore);
          revertSuccess = true;
          detailMessage = 'Re-created the deleted record from snapshot';
        }
      } else {
        // Fallback heuristic revert when snapshot was not present
        if (resource === 'student' && Model && targetId && mongoose.isValidObjectId(targetId)) {
          const body = log.changes?.submitted?.body || {};
          if (body.placementStatus) {
            await Model.findByIdAndUpdate(targetId, { $set: { placementStatus: 'In Progress' } });
            revertSuccess = true;
            detailMessage = 'Reset student placement status to In Progress';
          } else if (body.snoozed || body.internshipPriority === 'Snooze') {
            await Model.findByIdAndUpdate(targetId, { $set: { snoozed: false, internshipPriority: 'Normal', status: 'Active' } });
            revertSuccess = true;
            detailMessage = 'Restored snoozed student to active workflow';
          } else if (body.status === 'Inactive') {
            await Model.findByIdAndUpdate(targetId, { $set: { status: 'Active', internshipPriority: 'Normal' } });
            revertSuccess = true;
            detailMessage = 'Restored inactive student to active status';
          }
        } else if (resource === 'payment') {
          const PaymentModel = resolveModel('payment');
          if (log.path?.includes('/remove') && targetId) {
            await PaymentModel.findByIdAndUpdate(targetId, {
              $set: { isManuallyRemoved: false, removedAt: null, removedBy: null, removedByName: '' }
            });
            revertSuccess = true;
            detailMessage = 'Restored student to payment list';
          }
        }
      }

      if (!revertSuccess) {
        throw new BadRequestError(`Cannot automatically revert this ${resource} ${method} action without previous snapshot.`);
      }

      log.isReverted = true;
      log.revertedAt = new Date();
      log.revertedBy = user?._id || user?.id || null;
      log.revertedByName = user?.name || 'Administrator';
      await log.save();

      // Record a new audit log entry for this revert action
      await UserLogModel.create({
        actorId: user?._id || user?.id || null,
        actorName: user?.name || 'Administrator',
        actorEmail: user?.email || '',
        actorRole: user?.role || 'Administrator',
        action: `reverted ${log.action} (#${log._id})`,
        method: 'POST',
        path: `/user-logs/${log._id}/revert`,
        resource: log.resource,
        resourceId: String(targetId || ''),
        humanDescription: `${user?.name || 'Administrator'} reverted change: ${log.humanDescription || log.action}`,
        isReverted: false,
        statusCode: 200,
        changes: {
          revertedLogId: log._id,
          detail: detailMessage,
        },
      });

      return {
        success: true,
        message: `Successfully reverted change: ${detailMessage || log.humanDescription}`,
        log,
      };
    } catch (err) {
      logger.error(`[AuditService] Revert failed: ${err.message}`);
      throw err;
    }
  }
}
