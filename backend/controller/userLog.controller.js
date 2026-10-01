import UserLogModel from '../model/userLog.model.js';

export const getUserLogsController = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(10, Number.parseInt(req.query.limit, 10) || 25));
    const query = {};

    if (req.query.resource && req.query.resource !== 'All') query.resource = req.query.resource;
    if (req.query.action && req.query.action !== 'All') {
      const methodByAction = { created: 'POST', updated: { $in: ['PUT', 'PATCH'] }, deleted: 'DELETE' };
      query.method = methodByAction[req.query.action] || req.query.action;
    }
    if (req.query.search) {
      const term = String(req.query.search).trim().slice(0, 100);
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { actorName: { $regex: escaped, $options: 'i' } },
        { actorEmail: { $regex: escaped, $options: 'i' } },
        { action: { $regex: escaped, $options: 'i' } },
        { path: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [logs, total] = await Promise.all([
      UserLogModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      UserLogModel.countDocuments(query),
    ]);

    res.status(200).json({ success: true, data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
