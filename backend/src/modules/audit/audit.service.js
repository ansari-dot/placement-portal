import UserLogModel from './audit.model.js';

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
      ];
    }

    const [logs, total] = await Promise.all([
      UserLogModel.find(query).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
      UserLogModel.countDocuments(query),
    ]);

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
}
