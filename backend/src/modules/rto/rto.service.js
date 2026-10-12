import RtoModel from './rto.model.js';
import UserModel from '../user/user.model.js';
import {
  BadRequestError,
  NotFoundError,
} from '../../core/errors/AppError.js';

export class RtoService {
  static async getAllRtos({ search, status, loc }, user) {
    const query = {};
    const role = user?.role;
    const userEmail = user?.email?.toLowerCase()?.trim();

    if (user && role !== 'Administrator' && role !== 'Coordinator') {
      if (role === 'RTO Manager') {
        let userRtoName = user.rtoName;
        if (!userRtoName && userEmail) {
          const matchedRto = await RtoModel.findOne({ contactEmail: userEmail });
          if (matchedRto) userRtoName = matchedRto.name;
        }
        if (userRtoName) {
          query.name = { $regex: `^${userRtoName.trim()}$`, $options: 'i' };
        } else if (userEmail) {
          query.contactEmail = userEmail;
        } else {
          query._id = null;
        }
      } else {
        query._id = null; // Students & Industry users cannot view RTO lists
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') query.status = status;
    if (loc && loc !== 'All') query.loc = loc;

    return await RtoModel.find(query).sort({ createdAt: -1 });
  }

  static async getRtoById(id) {
    const rto = await RtoModel.findById(id);
    if (!rto) {
      throw new NotFoundError('RTO not found');
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

    if (!rtoName || !rtoName.trim()) {
      throw new BadRequestError('RTO Name is required');
    }

    let linkedUser = null;
    if (onboardedBy) {
      linkedUser = await UserModel.findById(onboardedBy).select('_id name role status');
      if (!linkedUser) {
        throw new BadRequestError('Selected Portal User ID was not found');
      }
      if (!['Administrator', 'Coordinator', 'Staff'].includes(linkedUser.role) || linkedUser.status !== 'Active') {
        throw new BadRequestError('Selected onboardedBy user must be an active Administrator, Coordinator, or Staff member');
      }
    }

    const resolvedOnboardedByName = String(onboardedByName || linkedUser?.name || '').trim();
    if (!resolvedOnboardedByName) {
      throw new BadRequestError('Onboarded By is required');
    }

    const generatedCode = rtoCode && rtoCode.trim()
      ? rtoCode.trim()
      : `RTO-${Math.floor(10000 + Math.random() * 90000)}`;

    const rto = new RtoModel({
      name: rtoName.trim(),
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
      address: addressLine1 || '',
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
      onboardedBy: linkedUser?._id || null,
    });

    await rto.save();
    return rto;
  }

  static async updateRto(id, updates) {
    const rtoUpdates = { ...updates };

    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'onboardedByName')) {
      if (!String(rtoUpdates.onboardedByName || '').trim()) delete rtoUpdates.onboardedByName;
      else rtoUpdates.onboardedByName = String(rtoUpdates.onboardedByName).trim();
    }
    if (Object.prototype.hasOwnProperty.call(rtoUpdates, 'onboardedBy') && rtoUpdates.onboardedBy) {
      const linkedUser = await UserModel.findById(rtoUpdates.onboardedBy).select('_id name role status');
      if (!linkedUser) throw new BadRequestError('Selected Portal User ID was not found');
      if (!['Administrator', 'Coordinator', 'Staff'].includes(linkedUser.role) || linkedUser.status !== 'Active') {
        throw new BadRequestError('Selected onboardedBy user must be an active Administrator, Coordinator, or Staff member');
      }
      rtoUpdates.onboardedBy = linkedUser._id;
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

    const rto = await RtoModel.findByIdAndUpdate(id, rtoUpdates, { new: true });
    if (!rto) {
      throw new NotFoundError('RTO not found');
    }
    return rto;
  }

  static async getRtoStats() {
    const [totalRtos, activeRtos, inactiveRtos, rtos] = await Promise.all([
      RtoModel.countDocuments(),
      RtoModel.countDocuments({ status: 'Active' }),
      RtoModel.countDocuments({ status: 'Inactive' }),
      RtoModel.find(),
    ]);

    const totalStudents = rtos.reduce((sum, rto) => sum + (rto.students || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = await RtoModel.countDocuments({
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

  static async deleteRto(id) {
    const deletedRto = await RtoModel.findByIdAndDelete(id);
    if (!deletedRto) {
      throw new NotFoundError('RTO not found');
    }
    return true;
  }

  static async getMyRtos(user) {
    if (!user) return [];
    const isAdmin = user.role === 'Administrator';
    return isAdmin
      ? await RtoModel.find().sort({ createdAt: -1 }).lean()
      : await RtoModel.find({
          $or: [{ onboardedBy: user._id }, { createdBy: user._id, onboardedBy: null }],
        })
          .sort({ createdAt: -1 })
          .lean();
  }
}
