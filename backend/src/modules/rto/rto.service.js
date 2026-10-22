import mongoose from 'mongoose';
import RtoModel from './rto.model.js';
import UserModel from '../user/user.model.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../core/errors/AppError.js';

// Base64 files are stored inline in RTO documents; exclude them from list views
// to keep payloads small (they are still returned by getRtoById).
const LIST_EXCLUDE = '-registrationCertificate -documents.file';

export const buildCoordinatorRtoFilter = (user) => {
  if (!user) return { _id: null };
  const matches = [
    { onboardedBy: user._id },
    { createdBy: user._id },
  ];
  if (mongoose.Types.ObjectId.isValid(user._id)) {
    matches.push({ onboardedBy: new mongoose.Types.ObjectId(user._id) });
    matches.push({ createdBy: new mongoose.Types.ObjectId(user._id) });
  }
  if (user.name) {
    matches.push({ onboardedByName: { $regex: `^${user.name.trim()}$`, $options: 'i' } });
  }
  return { $or: matches };
};

export const checkCoordinatorRtoOwnership = (rto, user) => {
  if (!user || user.role !== 'Coordinator') return true;
  const userIdStr = user._id ? String(user._id) : '';
  const createdByStr = rto.createdBy ? String(rto.createdBy) : '';
  const onboardedByStr = rto.onboardedBy ? String(rto.onboardedBy) : '';
  const nameMatches = user.name && rto.onboardedByName &&
    rto.onboardedByName.trim().toLowerCase() === user.name.trim().toLowerCase();

  return (userIdStr && (createdByStr === userIdStr || onboardedByStr === userIdStr)) || Boolean(nameMatches);
};

export class RtoService {
  static async getAllRtos({ search, status, loc, my }, user) {
    const filters = [];
    const role = user?.role;
    const userEmail = user?.email?.toLowerCase()?.trim();

    if (user && role !== 'Administrator') {
      if (role === 'Coordinator') {
        if (my === 'true') {
          filters.push(buildCoordinatorRtoFilter(user));
        }
        // By default, Coordinators can view all RTOs for directory and student assignments
      } else if (role === 'RTO Manager') {
        let userRtoName = user.rtoName;
        if (!userRtoName && userEmail) {
          const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
          if (matchedRto) userRtoName = matchedRto.name;
        }
        if (userRtoName) {
          filters.push({ name: { $regex: `^${userRtoName.trim()}$`, $options: 'i' } });
        } else if (userEmail) {
          filters.push({ contactEmail: userEmail });
        } else {
          filters.push({ _id: null });
        }
      } else {
        filters.push({ _id: null }); // Students & Industry users cannot view RTO lists
      }
    }

    if (search) {
      filters.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } },
        ],
      });
    }

    if (status && status !== 'All') filters.push({ status });
    if (loc && loc !== 'All') filters.push({ loc });

    const query = filters.length > 0 ? (filters.length === 1 ? filters[0] : { $and: filters }) : {};
    return await RtoModel.find(query).select(LIST_EXCLUDE).sort({ createdAt: -1 }).lean();
  }

  static async getRtoById(id, user) {
    const rto = await RtoModel.findById(id);
    if (!rto) {
      throw new NotFoundError('RTO not found');
    }
    if (user && user.role === 'Coordinator' && !checkCoordinatorRtoOwnership(rto, user)) {
      throw new ForbiddenError('Access denied. You can only view RTOs added by you.');
    }
    return rto;
  }

  static async createRto(data, actingUser) {
    const {
      rtoName,
      rtoCode,
      abn,
      acn,
      website,
      yearEstablished,
      shortDescription,
      paymentCycle,
      payoutRate,
      coursePricing,
      logo,
      registrationCertificate,
      registrationCertificateName,
      documents,
      contactName,
      contactEmail,
      contactTitle,
      contactDepartment,
      contactPhone,
      contactWhatsapp,
      contactMobile,
      contactFax,
      addressLine1,
      addressLine2,
      suburb,
      state,
      postcode,
      country,
      partnershipSince,
      registrationNumber,
      issuingAuthority,
      onboardedByName,
      onboardedBy,
    } = data;

    const resolvedName = String(rtoName || data.name || '').trim();
    if (!resolvedName) {
      throw new BadRequestError('RTO Name is required');
    }

    let linkedUser = null;
    if (onboardedBy && mongoose.Types.ObjectId.isValid(onboardedBy)) {
      try {
        linkedUser = await UserModel.findById(onboardedBy).select('_id name role status');
      } catch (_) {
        linkedUser = null;
      }
    }
    if (!linkedUser && actingUser) {
      linkedUser = actingUser;
    }

    const resolvedOnboardedByName = String(
      onboardedByName || actingUser?.name || linkedUser?.name || 'Portal Administrator'
    ).trim();

    const generatedCode = (rtoCode || data.code) && String(rtoCode || data.code).trim()
      ? String(rtoCode || data.code).trim()
      : `RTO-${Math.floor(10000 + Math.random() * 90000)}`;

    const rto = new RtoModel({
      name: resolvedName,
      code: generatedCode,
      abn: abn || '',
      acn: acn || '',
      website: website || '',
      yearEstablished: yearEstablished || '',
      shortDescription: shortDescription || '',
      paymentCycle: paymentCycle || 'Placement',
      payoutRate: Number(payoutRate) || 0,
      coursePricing: Array.isArray(coursePricing) ? coursePricing : [],
      logo: logo || '',
      registrationCertificate: registrationCertificate || '',
      registrationCertificateName: registrationCertificateName || '',
      documents: Array.isArray(documents) ? documents : [],
      contactName: contactName || '',
      contactEmail: contactEmail || '',
      contactTitle: contactTitle || '',
      contactDepartment: contactDepartment || '',
      contactPhone: contactPhone || '',
      contactWhatsapp: contactWhatsapp || '',
      contactMobile: contactMobile || '',
      contactFax: contactFax || '',
      address: addressLine1 || data.address || '',
      addressLine2: addressLine2 || '',
      suburb: suburb || '',
      state: state || '',
      postcode: postcode || '',
      country: country || 'Australia',
      partnershipSince: partnershipSince || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      registrationNumber: registrationNumber || '',
      issuingAuthority: issuingAuthority || '',
      loc: suburb && state ? `${suburb}, ${state}` : 'Melbourne, VIC',
      date: partnershipSince || new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Active',
      students: 0,
      createdBy: actingUser?._id || null,
      onboardedByName: resolvedOnboardedByName,
      onboardedBy: linkedUser?._id || (actingUser?._id ? actingUser._id : null),
    });

    await rto.save();

    // Auto-link any existing students who were uploaded with this RTO name
    try {
      const StudentModel = (await import('../student/student.model.js')).default;
      const cleanName = rto.name.trim();
      const matchRegex = new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      await StudentModel.updateMany(
        {
          $or: [
            { assignedRto: matchRegex },
            { institute: matchRegex, assignedRto: '' },
            { institute: matchRegex, assignedRto: { $exists: false } },
            { institute: matchRegex, assignedRto: null },
          ],
        },
        {
          $set: {
            assignedRto: rto.name,
            rtoId: rto._id,
            studentType: 'RTO Student',
          },
        }
      );

      // Trigger payment sync in background so pricing schedule is applied
      const { syncChargeableStudents } = await import('../payment/payment.service.js');
      syncChargeableStudents().catch(() => {});
    } catch (linkErr) {
      console.warn('[RtoService] Auto-linking students to new RTO skipped:', linkErr.message);
    }

    return rto;
  }

  static async updateRto(id, updates, actingUser) {
    const existing = await RtoModel.findById(id);
    if (!existing) {
      throw new NotFoundError('RTO not found');
    }
    if (actingUser && actingUser.role === 'Coordinator' && !checkCoordinatorRtoOwnership(existing, actingUser)) {
      throw new ForbiddenError('Access denied. You can only edit RTOs added by you.');
    }

    const rtoUpdates = { ...updates };

    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'onboardedByName')) {
      if (!String(rtoUpdates.onboardedByName || '').trim()) delete rtoUpdates.onboardedByName;
      else rtoUpdates.onboardedByName = String(rtoUpdates.onboardedByName).trim();
    }
    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'onboardedBy') && rtoUpdates.onboardedBy) {
      if (mongoose.Types.ObjectId.isValid(rtoUpdates.onboardedBy)) {
        try {
          const linkedUser = await UserModel.findById(rtoUpdates.onboardedBy).select('_id name role status');
          if (linkedUser) rtoUpdates.onboardedBy = linkedUser._id;
        } catch (_) {}
      } else {
        delete rtoUpdates.onboardedBy;
      }
    } else if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'onboardedBy')) {
      rtoUpdates.onboardedBy = null;
    }

    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'rtoName')) {
      if (!String(rtoUpdates.rtoName || '').trim()) {
        throw new BadRequestError('RTO Name is required');
      }
      rtoUpdates.name = String(rtoUpdates.rtoName).trim();
      delete rtoUpdates.rtoName;
    }
    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'rtoCode')) {
      rtoUpdates.code = String(rtoUpdates.rtoCode || '').trim();
      delete rtoUpdates.rtoCode;
    }
    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'addressLine1')) {
      rtoUpdates.address = rtoUpdates.addressLine1 || '';
      delete rtoUpdates.addressLine1;
    }
    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'suburb') || Object.prototype.hasOwnProperty.call(rtoUpdates, 'state')) {
      const suburb = rtoUpdates.suburb ?? '';
      const state = rtoUpdates.state ?? '';
      rtoUpdates.loc = [suburb, state].filter(Boolean).join(', ');
    }

    const rto = await RtoModel.findByIdAndUpdate(id, rtoUpdates, { returnDocument: 'after' });
    if (!rto) {
      throw new NotFoundError('RTO not found');
    }

    // Refresh payment pricing if coursePricing or name was updated
    if (rtoUpdates.coursePricing || rtoUpdates.name) {
      try {
        const { syncChargeableStudents } = await import('../payment/payment.service.js');
        syncChargeableStudents().catch(() => {});
      } catch (_) {}
    }

    return rto;
  }

  static async getRtoStats(user) {
    let baseFilter = {};
    if (user && user.role === 'Coordinator') {
      baseFilter = buildCoordinatorRtoFilter(user);
    }

    const [totalRtos, activeRtos, inactiveRtos, studentAgg] = await Promise.all([
      RtoModel.countDocuments(baseFilter),
      RtoModel.countDocuments({ ...baseFilter, status: 'Active' }),
      RtoModel.countDocuments({ ...baseFilter, status: 'Inactive' }),
      RtoModel.aggregate([
        ...(Object.keys(baseFilter).length > 0 ? [{ $match: baseFilter }] : []),
        { $group: { _id: null, total: { $sum: { $ifNull: ['$students', 0] } } } },
      ]),
    ]);

    const totalStudents = studentAgg[0]?.total || 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = await RtoModel.countDocuments({
      ...baseFilter,
      createdAt: { $gte: thirtyDaysAgo },
    });

    return {
      totalRtos,
      activeRtos,
      inactiveRtos,
      totalStudents,
      newThisMonth,
    };
  }

  static async deleteRto(id, actingUser) {
    if (actingUser && actingUser.role === 'Coordinator') {
      const existing = await RtoModel.findById(id);
      if (!existing) return true;
      if (!checkCoordinatorRtoOwnership(existing, actingUser)) {
        throw new ForbiddenError('Access denied. You can only delete RTOs added by you.');
      }
    }
    // Idempotent: a repeated delete of an already-removed RTO is treated as success.
    await RtoModel.deleteOne({ _id: id });
    return true;
  }

  static async getMyRtos(user) {
    if (!user) return [];
    const isAdmin = user.role === 'Administrator';
    return isAdmin
      ? await RtoModel.find().select(LIST_EXCLUDE).sort({ createdAt: -1 }).lean()
      : await RtoModel.find(buildCoordinatorRtoFilter(user))
          .select(LIST_EXCLUDE)
          .sort({ createdAt: -1 })
          .lean();
  }

  static checkCoordinatorRtoOwnership = checkCoordinatorRtoOwnership;
  static buildCoordinatorRtoFilter = buildCoordinatorRtoFilter;
}
